import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const data = await request.json();
        const { type, projectId, program, term, date, fileName, records: sheetsData } = data;

        if (!sheetsData || Object.keys(sheetsData).length === 0) {
            return NextResponse.json({ error: 'No records provided' }, { status: 400 });
        }

        // 1. Fetch reference data for matching
        const [studentsRes, paramsRes, programsRes] = await Promise.all([
            supabase.from('students').select('id, canonical_name, aliases'),
            supabase.from('readiness_parameters').select('id, code, param_number'),
            supabase.from('programs').select('id, name')
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (paramsRes.error) throw paramsRes.error;
        if (programsRes.error) throw programsRes.error;

        // Try to resolve program ID from name exactly, else use the first one or a fallback
        let resolvedProgramId = programsRes.data?.[0]?.id;
        const matchingProgram = programsRes.data?.find(p => p.name.toLowerCase() === program.toLowerCase());
        if (matchingProgram) {
            resolvedProgramId = matchingProgram.id;
        }

        const students = studentsRes.data;
        const parameters = paramsRes.data;

        // Normalize student matching
        const getStudentId = (rawName: string) => {
            const clean = String(rawName).trim().toLowerCase().replace(/\s+/g, ' ');
            for (const student of students) {
                if (student.canonical_name.toLowerCase() === clean) return student.id;
                for (const alias of (student.aliases || [])) {
                    if (alias.toLowerCase() === clean) return student.id;
                }
            }
            return null;
        };

        let inserts: any[] = [];
        let mappingConfig: Record<string, string> = {}; // for the assessment log

        if (type === 'mentor' || type === 'self') {
            // Process the sheetsData (Matrix Format)
            // Expecting: Column 0 = Code, Column >= 4 = Students
            Object.entries(sheetsData as Record<string, any[][]>).forEach(([sheetName, rows]) => {
                // Find the header row (has 'Code' or parameters)
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const firstCell = String(rows[i]?.[0] || '').trim().toLowerCase();
                    if (firstCell === 'code' || firstCell.includes('parameter') || firstCell.includes('domain')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1 && rows.length > 0) {
                    headerRowIndex = 0; // fallback to very first row
                }

                if (headerRowIndex === -1) return; // Empty sheet

                const headerRow = rows[headerRowIndex];

                // Identify which columns belong to which students
                const studentCols: Record<number, string> = {};
                for (let colIdx = 1; colIdx < headerRow.length; colIdx++) {
                    const headerVal = String(headerRow[colIdx] || '').trim();
                    if (!headerVal || headerVal.toLowerCase() === 'nan') continue;

                    // If it is 'I-Statement Prompt' or 'Domain' or 'Parameter', skip it
                    if (['domain', 'parameter', 'i-statement prompt'].includes(headerVal.toLowerCase())) continue;

                    // Try to match standard UI student columns
                    const studentId = getStudentId(headerVal);
                    if (studentId) {
                        studentCols[colIdx] = studentId;
                    }
                }

                // If no students found in headers, it might be the flat CSV format
                // In a true robust system, we would dynamically detect flat CSV vs Matrix.
                // For now, assuming matrix format since that's what was uploaded.

                // Iterate through rows to find scores
                for (let rIdx = headerRowIndex + 1; rIdx < rows.length; rIdx++) {
                    const row = rows[rIdx];
                    if (!row || row.length === 0) continue;

                    const codeVal = String(row[0] || '').trim().toUpperCase();
                    if (!codeVal || codeVal === 'NAN') continue;

                    // Match parameter by Code
                    const param = parameters.find(p => p.code === codeVal);
                    if (!param) continue;

                    mappingConfig[codeVal] = param.id;

                    // Extract scores for each matched student
                    Object.entries(studentCols).forEach(([colStr, sId]) => {
                        const colIdx = parseInt(colStr, 10);
                        const scoreStr = String(row[colIdx] || '').trim();
                        if (!scoreStr || scoreStr.toLowerCase() === 'nan' || scoreStr === '-' || scoreStr === '') return;

                        let rawScore = parseFloat(scoreStr);
                        if (isNaN(rawScore)) return;

                        // Normalize to 1-10 depending on source type
                        let normalizedScore = rawScore;
                        const maxScale = type === 'mentor' ? 10 : 5; // Heuristic based on legacy, ideally configure in UI
                        if (maxScale === 5) {
                            normalizedScore = ((rawScore - 1) / (5 - 1)) * 9 + 1;
                        }

                        inserts.push({
                            student_id: sId,
                            project_id: projectId,
                            parameter_id: param.id,
                            assessment_type: type,
                            raw_score: rawScore,
                            raw_scale_min: 1,
                            raw_scale_max: maxScale,
                            normalized_score: normalizedScore,
                            source_file: fileName
                        });
                    });
                }
            });

            if (inserts.length === 0) {
                return NextResponse.json({ error: 'Zero valid records were extracted. Please check the file formatting.' }, { status: 400 });
            }

            // 1. Create the Assessment Log
            const { data: logData, error: logError } = await supabase
                .from('assessment_logs')
                .insert({
                    assessment_date: date,
                    program_id: resolvedProgramId,
                    term: term,
                    data_type: type,
                    project_id: projectId,
                    file_name: fileName,
                    mapping_config: mappingConfig,
                    records_inserted: inserts.length
                })
                .select()
                .single();

            if (logError) throw logError;

            // 2. Stamp all inserts with the log ID
            inserts = inserts.map(i => ({ ...i, assessment_log_id: logData.id }));

            // 3. Upsert Assessments
            const { error: upsertError } = await supabase
                .from('assessments')
                .upsert(inserts, {
                    onConflict: 'student_id,project_id,parameter_id,assessment_type'
                });

            if (upsertError) throw upsertError;

            return NextResponse.json({
                success: true,
                message: `Successfully mapped and imported ${inserts.length} ${type} assessments! Linked to Log ID: ${logData.id.slice(0, 8)}...`,
                count: inserts.length
            });
        }

        return NextResponse.json({ error: `Unsupported import type: ${type}` }, { status: 400 });

    } catch (error: any) {
        console.error('Import saving error:', error);
        return NextResponse.json(
            { error: `Failed to save records: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
