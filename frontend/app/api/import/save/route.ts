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
        const [studentsRes, paramsRes, programsRes, projectsRes] = await Promise.all([
            supabase.from('students').select('id, canonical_name, aliases'),
            supabase.from('readiness_parameters').select('id, code, param_number'),
            supabase.from('programs').select('id, name'),
            supabase.from('projects').select('id, name, sequence_label')
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (paramsRes.error) throw paramsRes.error;
        if (programsRes.error) throw programsRes.error;
        if (projectsRes.error) throw projectsRes.error;

        // Try to resolve program ID from name exactly, else use the first one or a fallback
        let resolvedProgramId = programsRes.data?.[0]?.id;
        const matchingProgram = programsRes.data?.find(p => p.name.toLowerCase() === program.toLowerCase());
        if (matchingProgram) {
            resolvedProgramId = matchingProgram.id;
        }

        const students = studentsRes.data;
        const parameters = paramsRes.data;
        const projects = projectsRes.data;

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
        let mappingConfig: Record<string, any> = {}; // for the assessment log

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

                // Find question column if applicable
                let questionColIdx = -1;

                // Identify which columns belong to which students
                const studentCols: Record<number, string> = {};
                for (let colIdx = 1; colIdx < headerRow.length; colIdx++) {
                    const headerVal = String(headerRow[colIdx] || '').trim();
                    if (!headerVal || headerVal.toLowerCase() === 'nan') continue;

                    const lowHeader = headerVal.toLowerCase();
                    if (lowHeader.includes('question') || lowHeader.includes('prompt') || lowHeader.includes('helper text')) {
                        questionColIdx = colIdx;
                        continue;
                    }

                    // If it is 'I-Statement Prompt' or 'Domain' or 'Parameter', skip it
                    if (['domain', 'parameter', 'i-statement prompt'].includes(lowHeader)) continue;

                    // Try to match standard UI student columns
                    const studentId = getStudentId(headerVal);
                    if (studentId) {
                        studentCols[colIdx] = studentId;
                    }
                }

                // If no students found in headers, it might be the flat CSV format
                // In a true robust system, we would dynamically detect flat CSV vs Matrix.
                // For now, assuming matrix format since that's what was uploaded.

                // 1. Pass 1: Detect scale
                let maxFoundScore = 0;
                for (let rIdx = headerRowIndex + 1; rIdx < rows.length; rIdx++) {
                    const row = rows[rIdx];
                    if (!row) continue;
                    Object.keys(studentCols).forEach(colIdxStr => {
                        const scoreVal = parseFloat(String(row[parseInt(colIdxStr, 10)] || ''));
                        if (!isNaN(scoreVal) && scoreVal > maxFoundScore) {
                            maxFoundScore = scoreVal;
                        }
                    });
                }

                // If maxFoundScore <= 5, assume a 5-point scale, else assume 10.
                const detectedScale = maxFoundScore <= 5 ? 5 : 10;

                // 2. Pass 2: Extract Data
                for (let rIdx = headerRowIndex + 1; rIdx < rows.length; rIdx++) {
                    const row = rows[rIdx];
                    if (!row || row.length === 0) continue;

                    const codeVal = String(row[0] || '').trim().toUpperCase();
                    if (!codeVal || codeVal === 'NAN') continue;

                    // Match parameter by Code
                    const param = parameters.find(p => p.code === codeVal);
                    if (!param) continue;

                    mappingConfig[codeVal] = param.id;

                    if (type === 'self' && questionColIdx !== -1) {
                        mappingConfig.questions = mappingConfig.questions || [];
                        const qText = String(row[questionColIdx] || '').trim();
                        if (qText) {
                            mappingConfig.questions.push({
                                parameter_id: param.id,
                                question_text: qText
                            });
                        }
                    }

                    // Extract scores for each matched student
                    Object.entries(studentCols).forEach(([colStr, sId]) => {
                        const colIdx = parseInt(colStr, 10);
                        const scoreStr = String(row[colIdx] || '').trim();
                        if (!scoreStr || scoreStr.toLowerCase() === 'nan' || scoreStr === '-' || scoreStr === '') return;

                        let rawScore = parseFloat(scoreStr);
                        if (isNaN(rawScore)) return;

                        // Normalize to 1-10
                        let normalizedScore = rawScore;
                        if (detectedScale === 5) {
                            normalizedScore = ((rawScore - 1) / (5 - 1)) * 9 + 1;
                        } else if (detectedScale === 10) {
                            // Already 1-10, keep as is
                            normalizedScore = rawScore;
                        }

                        inserts.push({
                            student_id: sId,
                            project_id: projectId,
                            parameter_id: param.id,
                            assessment_type: type,
                            raw_score: rawScore,
                            raw_scale_min: 1,
                            raw_scale_max: detectedScale,
                            normalized_score: normalizedScore,
                            source_file: fileName
                        });
                    });
                }
            });

            if (inserts.length === 0) {
                return NextResponse.json({ error: 'Zero valid records were extracted. Please check the file formatting.' }, { status: 400 });
            }

            // Deduplicate inserts based on unique constraint: student_id, project_id, parameter_id, assessment_type
            // If duplicate sheets are uploaded, this keeps the last occurrence.
            const uniqueInsertsMap = new Map();
            inserts.forEach(insert => {
                const key = `${insert.student_id}-${insert.project_id}-${insert.parameter_id}-${insert.assessment_type}`;
                uniqueInsertsMap.set(key, insert);
            });
            inserts = Array.from(uniqueInsertsMap.values());

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

            // If it's a self assessment and we have question mappings, save them first
            if (type === 'self' && mappingConfig.questions?.length > 0) {
                const questionsToInsert = mappingConfig.questions.map((q: any) => ({
                    assessment_log_id: logData.id,
                    project_id: projectId,
                    parameter_id: q.parameter_id,
                    question_text: q.question_text,
                    question_order: 0,
                    rating_scale_min: 1,
                    rating_scale_max: mappingConfig.raw_scale_max || 10
                }));

                const { data: insertedQuestions, error: qErr } = await supabase
                    .from('self_assessment_questions')
                    .upsert(questionsToInsert, {
                        onConflict: 'assessment_log_id,parameter_id'
                    })
                    .select('id, parameter_id');

                if (qErr) {
                    console.error('Error saving self assessment questions:', qErr);
                }

                // Map the newly inserted question IDs back to the score inserts
                const questionMap = new Map((insertedQuestions || []).map(q => [q.parameter_id, q.id]));
                inserts.forEach(ins => {
                    if (ins.parameter_id && questionMap.has(ins.parameter_id)) {
                        ins.self_assessment_question_id = questionMap.get(ins.parameter_id);
                    }
                });
            }

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

        if (type === 'peer') {
            let peerInserts: any[] = [];
            let lastColMap: Record<string, number> = {};

            Object.entries(sheetsData as Record<string, any[][]>).forEach(([sheetName, rows]) => {
                if (rows.length < 2) return;

                // 1. Find Header Row
                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const rowStr = rows[i].join(' ').toLowerCase();
                    if (rowStr.includes('recipient') || rowStr.includes('quality') || rowStr.includes('feedback')) {
                        headerRowIdx = i;
                        break;
                    }
                }
                if (headerRowIdx === -1) headerRowIdx = 0;

                const headers = rows[headerRowIdx].map(h => String(h || '').toLowerCase().trim());

                // 2. Map Columns
                const colMap: Record<string, number> = {};
                headers.forEach((h, idx) => {
                    if (h.includes('recipient')) colMap['recipient'] = idx;
                    else if (h.includes('your name') || h.includes('giver')) colMap['giver'] = idx;
                    else if (h.includes('project')) colMap['project'] = idx;
                    else if (h.includes('quality')) colMap['quality'] = idx;
                    else if (h.includes('initiative') || h.includes('ownership')) colMap['initiative'] = idx;
                    else if (h.includes('communication')) colMap['communication'] = idx;
                    else if (h.includes('collaboration')) colMap['collaboration'] = idx;
                    else if (h.includes('growth')) colMap['growth'] = idx;
                });
                lastColMap = colMap;

                // 3. Extract Data
                for (let r = headerRowIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    const recipientName = row[colMap['recipient']];
                    const giverName = row[colMap['giver']];
                    if (!recipientName || !giverName) continue;

                    const recipientId = getStudentId(recipientName);
                    const giverId = getStudentId(giverName);
                    if (!recipientId || !giverId) continue;

                    // Metrics
                    const getValue = (key: string) => {
                        const val = row[colMap[key]];
                        const num = parseFloat(String(val || ''));
                        return isNaN(num) ? null : num;
                    };

                    const quality = getValue('quality');
                    const initiative = getValue('initiative');
                    const communication = getValue('communication');
                    const collaboration = getValue('collaboration');
                    const growth = getValue('growth');

                    // Skip if all metrics are empty
                    if (quality === null && initiative === null && communication === null && collaboration === null && growth === null) continue;

                    // Resolve Project ID: check row first, then UI selection
                    let rowProjectId = projectId || null;
                    if (colMap['project'] !== undefined) {
                        const rowProjName = String(row[colMap['project']] || '').trim();
                        if (rowProjName) {
                            const foundProj = (projects as any[]).find(p =>
                                p.name.toLowerCase() === rowProjName.toLowerCase() ||
                                p.sequence_label?.toLowerCase() === rowProjName.toLowerCase()
                            );
                            if (foundProj) rowProjectId = foundProj.id;
                        }
                    }

                    if (!rowProjectId) {
                        return NextResponse.json({ error: 'Project association missing for peer feedback. Please select a Project from the dropdown or ensure the Project column matches a known project name.' }, { status: 400 });
                    }

                    peerInserts.push({
                        recipient_id: recipientId,
                        giver_id: giverId,
                        project_id: rowProjectId,
                        quality_of_work: quality,
                        initiative_ownership: initiative,
                        communication: communication,
                        collaboration: collaboration,
                        growth_mindset: growth
                    });
                }
            });

            if (peerInserts.length === 0) {
                return NextResponse.json({ error: 'No valid peer feedback records found.' }, { status: 400 });
            }

            // Deduplicate peer inserts based on unique constraint: recipient_id, giver_id, project_id
            const uniquePeerInsertsMap = new Map();
            peerInserts.forEach(insert => {
                const key = `${insert.recipient_id}-${insert.giver_id}-${insert.project_id}`;
                uniquePeerInsertsMap.set(key, insert);
            });
            peerInserts = Array.from(uniquePeerInsertsMap.values());

            // 4. Create Log & Save
            const { data: log, error: logEff } = await supabase
                .from('assessment_logs')
                .insert({
                    assessment_date: date,
                    program_id: resolvedProgramId,
                    term: term,
                    data_type: 'peer',
                    project_id: projectId || null,
                    file_name: fileName,
                    mapping_config: lastColMap as any, // Save the column detection for audit
                    records_inserted: peerInserts.length
                })
                .select().single();

            if (logEff) throw logEff;

            // Add log ID to records
            const finalPeerInserts = peerInserts.map(p => ({ ...p, assessment_log_id: log.id }));

            const { error: peerErr } = await supabase
                .from('peer_feedback')
                .upsert(finalPeerInserts, {
                    onConflict: 'recipient_id,giver_id,project_id'
                });

            if (peerErr) throw peerErr;

            return NextResponse.json({
                success: true,
                message: `Imported ${peerInserts.length} peer feedback entries.`,
                count: peerInserts.length
            });
        }

        if (type === 'term') {
            const updatesByStudent: Record<string, any> = {};
            let lastColMap: Record<string, number> = {};

            Object.entries(sheetsData as Record<string, any[][]>).forEach(([sheetName, rows]) => {
                if (rows.length < 2) return;

                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const rowStr = rows[i].join(' ').toLowerCase();
                    if (rowStr.includes('metric') && rowStr.includes('value')) {
                        headerRowIdx = i;
                        break;
                    }
                }
                if (headerRowIdx === -1) headerRowIdx = 0;

                const headers = rows[headerRowIdx].map(h => String(h || '').toLowerCase().trim());
                const colMap: Record<string, number> = {};
                headers.forEach((h, idx) => {
                    if (h.includes('student') || h.includes('name')) colMap['student'] = idx;
                    else if (h.includes('metric') && !h.includes('value')) colMap['metric'] = idx;
                    else if (h.includes('value') || h.includes('score') || h.includes('count')) colMap['value'] = idx;
                });
                lastColMap = colMap;

                if (colMap['student'] === undefined || colMap['metric'] === undefined || colMap['value'] === undefined) {
                    return; // Skip sheet if missing required columns
                }

                for (let r = headerRowIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    const studentName = String(row[colMap['student']] || '').trim();
                    const metric = String(row[colMap['metric']] || '').trim().toLowerCase();
                    const valueStr = String(row[colMap['value']] || '').trim();

                    if (!studentName || !metric || !valueStr || valueStr.toLowerCase() === 'nan') continue;

                    const studentId = getStudentId(studentName);
                    if (!studentId) continue;

                    if (!updatesByStudent[studentId]) {
                        updatesByStudent[studentId] = { student_id: studentId, term: term };
                    }

                    const valNum = parseFloat(valueStr);
                    if (isNaN(valNum)) continue;

                    if (metric.includes('cbp')) {
                        updatesByStudent[studentId].cbp_count = Math.round(valNum);
                    } else if (metric.includes('conflexion')) {
                        updatesByStudent[studentId].conflexion_count = Math.round(valNum);
                    } else if (metric.includes('bow')) {
                        updatesByStudent[studentId].bow_score = valNum;
                    }
                }
            });

            const termInserts = Object.values(updatesByStudent);

            if (termInserts.length === 0) {
                return NextResponse.json({ error: 'No valid term report records found.' }, { status: 400 });
            }

            // Create Log
            const { data: log, error: logEff } = await supabase
                .from('assessment_logs')
                .insert({
                    assessment_date: date,
                    program_id: resolvedProgramId,
                    term: term,
                    data_type: 'term',
                    project_id: projectId || null,
                    file_name: fileName,
                    mapping_config: lastColMap as any,
                    records_inserted: termInserts.length
                })
                .select().single();

            if (logEff) throw logEff;

            // Fetch existing term records to avoid completely overwriting untouched metrics
            const { data: existingRecords } = await supabase
                .from('term_tracking')
                .select('*')
                .in('student_id', termInserts.map(t => t.student_id))
                .eq('term', term);

            const existingMap = new Map();
            (existingRecords || []).forEach(r => existingMap.set(r.student_id, r));

            const finalInserts = termInserts.map(insert => {
                const ex = existingMap.get(insert.student_id);
                const payload: any = {
                    student_id: insert.student_id,
                    term: insert.term,
                    assessment_log_id: log.id,
                    cbp_count: insert.cbp_count !== undefined ? insert.cbp_count : (ex?.cbp_count || 0),
                    conflexion_count: insert.conflexion_count !== undefined ? insert.conflexion_count : (ex?.conflexion_count || 0),
                    bow_score: insert.bow_score !== undefined ? insert.bow_score : (ex?.bow_score || 0)
                };
                if (ex && ex.id) {
                    payload.id = ex.id;
                }
                return payload;
            });

            const { error: termErr } = await supabase
                .from('term_tracking')
                .upsert(finalInserts, {
                    onConflict: 'student_id,term,assessment_log_id'
                });

            if (termErr) throw termErr;

            return NextResponse.json({
                success: true,
                message: `Imported term tracking metrics for ${finalInserts.length} students.`,
                count: finalInserts.length
            });
        }

        if (type === 'mentor_notes') {
            const notesByStudent: Record<string, {
                student_id: string,
                project_id: string | null,
                mentors: Set<string>,
                notes: string[]
            }> = {};
            let lastColMap: Record<string, number> = {};

            Object.entries(sheetsData as Record<string, any[][]>).forEach(([sheetName, rows]) => {
                if (rows.length < 2) return;

                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const rowStr = rows[i].join(' ').toLowerCase();
                    if (rowStr.includes('student') && rowStr.includes('mentor')) {
                        headerRowIdx = i;
                        break;
                    }
                }
                if (headerRowIdx === -1) headerRowIdx = 0;

                const headers = rows[headerRowIdx].map(h => String(h || '').toLowerCase().trim());
                const colMap: Record<string, number> = {};
                headers.forEach((h, idx) => {
                    if (h.includes('student') || h.includes('name')) colMap['student'] = idx;
                    else if (h.includes('mentor')) colMap['mentor'] = idx;
                    else if (h.includes('note')) colMap['notes'] = idx;
                });
                lastColMap = colMap;

                if (colMap['student'] === undefined || colMap['notes'] === undefined) {
                    return; // Skip sheet if missing required columns
                }

                for (let r = headerRowIdx + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row || row.length === 0) continue;

                    const studentName = String(row[colMap['student']] || '').trim();
                    const mentorName = colMap['mentor'] !== undefined ? String(row[colMap['mentor']] || '').trim() : 'Unknown Mentor';
                    const noteText = String(row[colMap['notes']] || '').trim();

                    if (!studentName || !noteText || noteText.toLowerCase() === 'nan') continue;

                    const studentId = getStudentId(studentName);
                    if (!studentId) continue;

                    if (!notesByStudent[studentId]) {
                        notesByStudent[studentId] = {
                            student_id: studentId,
                            project_id: projectId || null,
                            mentors: new Set(),
                            notes: []
                        };
                    }

                    if (mentorName && mentorName.toLowerCase() !== 'nan') {
                        notesByStudent[studentId].mentors.add(mentorName);
                    }

                    const prefix = mentorName && mentorName.toLowerCase() !== 'nan' ? `${mentorName}: ` : '';
                    notesByStudent[studentId].notes.push(`${prefix}${noteText}`);
                }
            });

            const finalInserts = Object.values(notesByStudent).map(data => ({
                student_id: data.student_id,
                project_id: data.project_id,
                note_text: data.notes.join('\n\n'),
                note_type: 'general',
                created_by: Array.from(data.mentors).join(', ')
            }));

            if (finalInserts.length === 0) {
                return NextResponse.json({ error: 'No valid mentor notes records found.' }, { status: 400 });
            }

            // Create Log
            const { data: log, error: logEff } = await supabase
                .from('assessment_logs')
                .insert({
                    assessment_date: date,
                    program_id: resolvedProgramId,
                    term: term,
                    data_type: 'mentor_notes',
                    project_id: projectId || null,
                    file_name: fileName,
                    mapping_config: lastColMap as any,
                    records_inserted: finalInserts.length
                })
                .select().single();

            if (logEff) throw logEff;

            // Note: `mentor_notes` table does not have an assessment_log_id column yet according to schema,
            // but we logged the event in assessment_logs. We insert directly into mentor_notes.

            const { error: notesErr } = await supabase
                .from('mentor_notes')
                .insert(finalInserts);

            if (notesErr) throw notesErr;

            return NextResponse.json({
                success: true,
                message: `Imported combined mentor notes for ${finalInserts.length} students.`,
                count: finalInserts.length
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
