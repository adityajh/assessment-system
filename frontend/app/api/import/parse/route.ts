import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Parse excel file
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;
        const sheetsData: Record<string, any[][]> = {};

        sheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            sheetsData[name] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
        });

        // 2. Recognition Logic (Scan for Students and Parameter Codes)
        const [studentsRes, paramsRes] = await Promise.all([
            supabase.from('students').select('id, canonical_name, aliases'),
            supabase.from('readiness_parameters').select('id, code, name')
        ]);

        const students = studentsRes.data || [];
        const parameters = paramsRes.data || [];

        let recognizedStudents = new Set<string>();
        let recognizedCodes = new Set<string>();
        let missingCodes = new Set<string>();
        let unrecognizedStudents = new Set<string>();

        const checkStudent = (name: string) => {
            const clean = String(name || '').trim().toLowerCase();
            if (!clean || clean === 'nan' || clean === 'null' || clean === 'undefined') return null;
            return students.find(s =>
                s.canonical_name.toLowerCase() === clean ||
                (s.aliases || []).some((a: string) => a.toLowerCase() === clean)
            );
        };

        const isKnownMetadata = (val: string) => {
            const low = val.toLowerCase();
            return ['code', 'parameter', 'description', 'rubric', 'weight', 'score', 'average', 'total'].includes(low);
        };

        let finalDetectedType = detectFileType(file.name, sheetNames);
        let maxFoundScore = 0;

        // Scan sheets for patterns
        Object.values(sheetsData).forEach(rows => {
            if (rows.length === 0) return;

            // Find Matrix Header or Flat Header
            let headerIdx = -1;
            for (let i = 0; i < Math.min(10, rows.length); i++) {
                const rowStr = rows[i].join(' ').toLowerCase();
                if (rowStr.includes('code') || rowStr.includes('recipient') || rowStr.includes('giver') || rowStr.includes('quality')) {
                    headerIdx = i;
                    break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;

            const headerRow = rows[headerIdx];
            const headerRowStr = headerRow.join(' ').toLowerCase();

            // Upgrade unknown type if headers indicate a matrix
            if (finalDetectedType === 'unknown' && (headerRowStr.includes('code') && headerRowStr.includes('domain'))) {
                finalDetectedType = 'mentor';
            }

            // Matrix Format Detection (Headers are students)
            if (finalDetectedType === 'mentor' || finalDetectedType === 'self') {
                const studentCols: number[] = [];
                let hasQuestionCol = false;

                headerRow.forEach((cell, idx) => {
                    const cellStr = String(cell || '').trim();
                    const low = cellStr.toLowerCase();
                    if (!cellStr || isKnownMetadata(cellStr)) return;

                    if (low.includes('question') || low.includes('prompt') || low.includes('helper text')) {
                        hasQuestionCol = true;
                        return;
                    }

                    const student = checkStudent(cellStr);
                    if (student) {
                        recognizedStudents.add(student.canonical_name);
                        studentCols.push(idx);
                    }
                    else unrecognizedStudents.add(cellStr);
                });

                // Detect max score for scale determination
                for (let r = headerIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row) continue;
                    studentCols.forEach(colIdx => {
                        const scoreVal = parseFloat(String(row[colIdx] || ''));
                        if (!isNaN(scoreVal) && scoreVal > maxFoundScore) {
                            maxFoundScore = scoreVal;
                        }
                    });
                }
            }

            // Flat Format Detection (Columns are students)
            if (finalDetectedType === 'peer') {
                // Find Columns for Giver/Recipient
                const colMap: Record<string, number> = {};
                headerRow.forEach((cell, idx) => {
                    const low = String(cell || '').toLowerCase();
                    if (low.includes('recipient') || low.includes('to:')) colMap['recipient'] = idx;
                    if (low.includes('giver') || low.includes('from:')) colMap['giver'] = idx;
                });

                for (let r = headerIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    ['recipient', 'giver'].forEach(key => {
                        if (colMap[key] !== undefined) {
                            const cellStr = String(row[colMap[key]] || '').trim();
                            if (!cellStr || cellStr.toLowerCase() === 'nan') return;

                            const student = checkStudent(cellStr);
                            if (student) recognizedStudents.add(student.canonical_name);
                            else unrecognizedStudents.add(cellStr);
                        }
                    });

                    // Also check for parameters/metrics
                    headerRow.forEach((cell, idx) => {
                        const cellStr = String(cell || '').toLowerCase();
                        if (cellStr.includes('quality') || cellStr.includes('initiative') || cellStr.includes('communication') || cellStr.includes('collaboration') || cellStr.includes('growth')) {
                            recognizedCodes.add(cellStr); // For Peer, we recognize by header keywords
                        }
                    });
                }
            }

            // Term Report Format Detection
            if (finalDetectedType === 'term') {
                // Find Columns for Student, Metric, Value
                const colMap: Record<string, number> = {};
                headerRow.forEach((cell, idx) => {
                    const low = String(cell || '').toLowerCase();
                    if (low.includes('student') || low.includes('name')) colMap['student'] = idx;
                    if (low.includes('metric') && !low.includes('value')) colMap['metric'] = idx;
                    if (low.includes('value') || low.includes('score') || low.includes('count')) colMap['value'] = idx;
                });

                for (let r = headerIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    if (colMap['student'] !== undefined) {
                        const cellStr = String(row[colMap['student']] || '').trim();
                        if (!cellStr || cellStr.toLowerCase() === 'nan') continue;

                        const student = checkStudent(cellStr);
                        if (student) recognizedStudents.add(student.canonical_name);
                        else unrecognizedStudents.add(cellStr);
                    }

                    if (colMap['metric'] !== undefined) {
                        const metricStr = String(row[colMap['metric']] || '').trim().toLowerCase();
                        if (metricStr && metricStr !== 'nan') {
                            if (metricStr.includes('cbp') || metricStr.includes('conflexion') || metricStr.includes('bow')) {
                                recognizedCodes.add(metricStr);
                            } else {
                                missingCodes.add(metricStr);
                            }
                        }
                    }
                }
            }

            // Mentor Notes Format Detection
            if (finalDetectedType === 'mentor_notes') {
                // Find Columns for Student, Mentor, Notes
                const colMap: Record<string, number> = {};
                headerRow.forEach((cell, idx) => {
                    const low = String(cell || '').toLowerCase();
                    if (low.includes('student') || low.includes('name')) colMap['student'] = idx;
                    if (low.includes('mentor')) colMap['mentor'] = idx;
                    if (low.includes('note')) colMap['notes'] = idx;
                });

                for (let r = headerIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    if (colMap['student'] !== undefined) {
                        const cellStr = String(row[colMap['student']] || '').trim();
                        if (!cellStr || cellStr.toLowerCase() === 'nan') continue;

                        const student = checkStudent(cellStr);
                        if (student) recognizedStudents.add(student.canonical_name);
                        else unrecognizedStudents.add(cellStr);
                    }
                }
            }

            // Also check for Parameter Codes in Column 0 (Matrix)
            if (finalDetectedType === 'mentor' || finalDetectedType === 'self') {
                for (let r = headerIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;
                    const code = String(row[0] || '').trim().toUpperCase();
                    if (code && code !== 'NAN') {
                        const param = parameters.find(p => p.code === code);
                        if (param) recognizedCodes.add(code);
                        else if (code.length >= 2 && code.length <= 4) missingCodes.add(code);
                    }
                }
            }
        });

        const detectedScale = maxFoundScore > 0 ? (maxFoundScore <= 5 ? 5 : 10) : null;

        return NextResponse.json({
            success: true,
            filename: file.name,
            sheetNames,
            sheetsData,
            detectedType: finalDetectedType,
            detectedScale,
            recognition: {
                studentCount: recognizedStudents.size,
                students: Array.from(recognizedStudents).sort(),
                unrecognizedStudentCount: unrecognizedStudents.size,
                unrecognizedStudents: Array.from(unrecognizedStudents).sort(),
                parameterCount: recognizedCodes.size,
                parameters: Array.from(recognizedCodes).sort(),
                unrecognizedCodes: Array.from(missingCodes).sort()
            }
        });

    } catch (error: any) {
        console.error('File parsing error:', error);
        return NextResponse.json(
            { error: `Failed to parse Excel file: ${error.message}` },
            { status: 500 }
        );
    }
}

function detectFileType(filename: string, sheetNames: string[]): string {
    const nameLower = filename.toLowerCase();
    if (nameLower.includes('note')) return 'mentor_notes';
    if (nameLower.includes('matrix') || sheetNames.includes('Kickstart') || sheetNames.includes('Legend')) return 'mentor';
    if (nameLower.includes('self') || nameLower.includes('x-ray') || nameLower.includes('accounting')) return 'self';
    if (nameLower.includes('peer')) return 'peer';
    if (nameLower.includes('term')) return 'term';
    return 'unknown';
}
