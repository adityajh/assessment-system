import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- Business X-Ray Project Diagnostics ---');
    const { data: bxrProjs } = await supabase.from('projects').select('*').ilike('name', '%Business%X%Ray%');
    console.table(bxrProjs);

    if (bxrProjs && bxrProjs.length > 0) {
        const projId = bxrProjs[0].id;
        console.log(`\n--- Sampling Assessments for Project ID: ${projId} ---`);
        const { data: assessments, count } = await supabase
            .from('assessments')
            .select('id, student_id, parameter_id, assessment_type, assessment_log_id, raw_score, normalized_score', { count: 'exact' })
            .eq('project_id', projId);

        console.log('Total assessments found:', count);
        if (assessments && assessments.length > 0) {
            console.log('\n--- Sample Assessment Records ---');
            console.table(assessments.slice(0, 5));

            // Check for valid parameter IDs
            const paramId = assessments[0].parameter_id;
            const { data: param } = await supabase.from('readiness_parameters').select('id, code, name').eq('id', paramId).single();
            console.log('\n--- Reference Check: Parameter ---');
            console.log(param);

            // Check for valid student IDs
            const studentId = assessments[0].student_id;
            const { data: student } = await supabase.from('students').select('id, canonical_name, is_active').eq('id', studentId).single();
            console.log('\n--- Reference Check: Student ---');
            console.log(student);
        }
    }

    console.log('\n--- Normalization Logic Simulation ---');
    const score = 1;
    const max = 4;
    const min = 1;

    const multiplier = (10 / max) * score;
    const minMaxInterpolation = ((score - min) / (max - min)) * 9 + 1;

    console.log(`For score ${score} on a ${min}-${max} scale:`);
    console.log(`- Proportional Multiplier (2.5x): ${multiplier}`);
    console.log(`- Min-Max Interpolation (1-10): ${minMaxInterpolation}`);
}

debug();
