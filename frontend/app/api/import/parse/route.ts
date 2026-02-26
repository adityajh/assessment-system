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
        let totalRecordsFound = 0;

        const checkStudent = (name: string) => {
            const clean = String(name || '').trim().toLowerCase();
            if (!clean || clean === 'nan') return null;
            return students.find(s =>
                s.canonical_name.toLowerCase() === clean ||
                (s.aliases || []).some((a: string) => a.toLowerCase() === clean)
            );
        };

        // Scan sheets for patterns
        Object.values(sheetsData).forEach(rows => {
            if (rows.length === 0) return;

            // Find Matrix Header or Flat Header
            let headerIdx = -1;
            for (let i = 0; i < Math.min(10, rows.length); i++) {
                const rowStr = rows[i].join(' ').toLowerCase();
                if (rowStr.includes('code') || rowStr.includes('recipient') || rowStr.includes('quality')) {
                    headerIdx = i;
                    break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;

            const headerRow = rows[headerIdx];

            // Look for students in headers (Matrix format)
            headerRow.forEach(cell => {
                const student = checkStudent(cell);
                if (student) recognizedStudents.add(student.canonical_name);
            });

            // Look for students in rows (Flat format)
            for (let r = headerIdx + 1; r < rows.length; r++) {
                const row = rows[r];
                if (!row || row.length === 0) continue;

                // Check first column for Parameter Code
                const code = String(row[0] || '').trim().toUpperCase();
                if (code && code !== 'NAN') {
                    const param = parameters.find(p => p.code === code);
                    if (param) recognizedCodes.add(code);
                    else if (code.length >= 2 && code.length <= 4) missingCodes.add(code);
                }

                // Check all cells for student matches (Flat format)
                row.forEach(cell => {
                    if (typeof cell === 'string' && cell.length > 3) {
                        const student = checkStudent(cell);
                        if (student) recognizedStudents.add(student.canonical_name);
                    }
                });
            }
        });

        return NextResponse.json({
            success: true,
            filename: file.name,
            sheetNames,
            sheetsData,
            detectedType: detectFileType(file.name, sheetNames),
            recognition: {
                studentCount: recognizedStudents.size,
                students: Array.from(recognizedStudents).sort(),
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
    if (nameLower.includes('matrix') || sheetNames.includes('Kickstart') || sheetNames.includes('Legend')) return 'mentor';
    if (nameLower.includes('self') || nameLower.includes('x-ray') || nameLower.includes('accounting')) return 'self';
    if (nameLower.includes('peer')) return 'peer';
    if (nameLower.includes('term')) return 'term';
    return 'unknown';
}
