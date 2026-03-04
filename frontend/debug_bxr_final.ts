import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const projId = '35025152-145e-4718-9ef5-e30d6beda2c8';
    console.log(`--- Assessments for Project: Business X-Ray (${projId}) ---`);
    const { data: assessments, count, error } = await supabase
        .from('assessments')
        .select('id, student_id, parameter_id, assessment_type, assessment_log_id, raw_score, normalized_score', { count: 'exact' })
        .eq('project_id', projId);

    if (error) {
        console.error('Error fetching assessments:', error);
    } else {
        console.log('Total assessments found:', count);
        if (assessments && assessments.length > 0) {
            console.log('\n--- Sample Records ---');
            console.table(assessments.slice(0, 10));

            const types = [...new Set(assessments.map(a => a.assessment_type))];
            console.log('Unique assessment types found:', types);

            const logIds = [...new Set(assessments.map(a => a.assessment_log_id))];
            console.log('Unique log IDs found:', logIds);

            if (logIds.at(0)) {
                const { data: log } = await supabase.from('assessment_logs').select('*').eq('id', logIds[0]!).single();
                console.log('\n--- Log record for these assessments ---');
                console.log(JSON.stringify(log, null, 2));
            }
        } else {
            console.log('No assessments found for this project ID.');
        }
    }
}

debug();
