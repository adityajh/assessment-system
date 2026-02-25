import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const payload = await req.json();
        const { metadata, mapping, rawData } = payload;
        const { importType, programId, projectId, term, assessmentDate, fileName } = metadata;

        if (!rawData || rawData.length === 0) {
            return NextResponse.json({ error: 'No data provided.' }, { status: 400 });
        }

        // 1. Fetch all students to resolve aliases
        const { data: students, error: studentErr } = await supabase.from('students').select('id, name, aliases');
        if (studentErr) throw new Error("Failed to load students for alias matching.");

        const matchStudent = (rawName: string) => {
            if (!rawName) return null;
            const clean = String(rawName).trim().toLowerCase().replace(/\s+/g, ' ');
            for (const s of students) {
                if (s.name.toLowerCase() === clean) return s.id;
                if (s.aliases && Array.isArray(s.aliases)) {
                    for (const a of s.aliases) {
                        if (a.toLowerCase() === clean) return s.id;
                    }
                }
            }
            return null;
        };

        // 2. Create the master Assessment Log record
        const { data: logData, error: logErr } = await supabase
            .from('assessment_logs')
            .insert({
                assessment_date: assessmentDate,
                program_id: programId,
                term: term,
                data_type: importType,
                project_id: projectId || null,
                file_name: fileName,
                mapping_config: mapping,
                records_inserted: 0 // Will update after
            })
            .select('id')
            .single();

        if (logErr) throw new Error("Failed to create master Assessment Log: " + logErr.message);
        const logId = logData.id;

        // 3. Process the Data based on Type
        let recordsInserted = 0;

        if (importType === 'self' || importType === 'mentor') {
            // Find which column is mapped to the student name
            const studentCol = Object.keys(mapping).find(col => mapping[col] === 'student_name');
            if (!studentCol) throw new Error("You must map at least one column to 'Student Name Key'");

            // We need to aggregate scores if multiple columns map to the same parameter.
            // Map { student_id + param_id: { sum, count } }
            const aggregatedScores: Record<string, { studentId: string, paramId: string, sum: number, count: number }> = {};

            for (const row of rawData) {
                const sId = matchStudent(row[studentCol]);
                if (!sId) continue; // Skip if we can't find the student

                for (const colHeader in mapping) {
                    const targetParamId = mapping[colHeader];
                    if (targetParamId === 'student_name' || !targetParamId) continue;

                    const rawScore = Number(row[colHeader]);
                    if (isNaN(rawScore) || rawScore === 0) continue;

                    const key = `${sId}_${targetParamId}`;
                    if (!aggregatedScores[key]) {
                        aggregatedScores[key] = { studentId: sId, paramId: targetParamId, sum: 0, count: 0 };
                    }
                    aggregatedScores[key].sum += rawScore;
                    aggregatedScores[key].count += 1;
                }
            }

            // Prepare Insert statements
            const inserts = Object.values(aggregatedScores).map(agg => {
                const avgScore = Number((agg.sum / agg.count).toFixed(2));
                // Define scale: Assuming 1-10 for standard backend mapping
                const maxScale = 10;
                const normalized = Number((((avgScore - 1) / (maxScale - 1)) * 9 + 1).toFixed(2));

                return {
                    student_id: agg.studentId,
                    project_id: projectId,
                    parameter_id: agg.paramId,
                    assessment_type: importType,
                    raw_score: avgScore,
                    raw_scale_min: 1,
                    raw_scale_max: maxScale,
                    normalized_score: normalized,
                    source_file: fileName,
                    assessment_log_id: logId
                };
            });

            if (inserts.length > 0) {
                const { error: insErr } = await supabase.from('assessments').insert(inserts);
                if (insErr) throw new Error("Failed bulk assessments insert: " + insErr.message);
                recordsInserted = inserts.length;
            }
        }
        else if (importType === 'peer') {
            // ... [Rest of logic for Peer and Term Tracking will be implemented later]
            throw new Error("Peer Feedback import logic not yet fully implemented in API.");
        }
        else if (importType === 'term') {
            // ... [Rest of logic for Term Tracking]
            throw new Error("Term Tracking import logic not yet fully implemented in API.");
        }

        // 4. Update the Log with the final count
        await supabase.from('assessment_logs').update({ records_inserted: recordsInserted }).eq('id', logId);

        return NextResponse.json({ success: true, recordsInserted, logId });

    } catch (e: any) {
        console.error("IMPORT ERROR:", e);
        return NextResponse.json({ error: e.message || 'Unknown server error' }, { status: 500 });
    }
}
