import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const projId = '35025152-145e-4718-9ef5-e30d6beda2c8'; // Business X-Ray

    // 1. Get sample assessments
    const { data: assessments } = await supabase
        .from('assessments')
        .select('parameter_id, student_id')
        .eq('project_id', projId)
        .limit(1);

    if (!assessments || assessments.length === 0) {
        console.log('No assessments found for this project.');
        return;
    }

    const { parameter_id, student_id } = assessments[0];
    console.log(`Checking IDs: Param=${parameter_id}, Student=${student_id}`);

    // 2. Check if Parameter exists
    const { data: param } = await supabase.from('readiness_parameters').select('id, name').eq('id', parameter_id).single();
    if (param) {
        console.log('✅ Parameter found:', param.name);
    } else {
        console.log('❌ Parameter NOT found in readiness_parameters table!');
    }

    // 3. Check if Student exists
    const { data: student } = await supabase.from('students').select('id, canonical_name, is_active').eq('id', student_id).single();
    if (student) {
        console.log(`✅ Student found: ${student.canonical_name}, Active: ${student.is_active}`);
    } else {
        console.log('❌ Student NOT found in students table!');
    }

    // 4. Check how many unique parameters are in these assessments
    const { data: allAssessments } = await supabase.from('assessments').select('parameter_id').eq('project_id', projId);
    if (allAssessments) {
        const uniqueParams = [...new Set(allAssessments.map(a => a.parameter_id))];
        console.log(`Project has ${allAssessments.length} assessments across ${uniqueParams.length} parameters.`);

        const { count: validParamCount } = await supabase.from('readiness_parameters').select('*', { count: 'exact', head: true }).in('id', uniqueParams);
        console.log(`Found ${validParamCount} valid parameters in the system for these assessments.`);
    }
}

debug();
