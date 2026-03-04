import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co';
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Verifying Mentor Assessment Limit ---');
    const { data: mentorData, error: mentorErr } = await supabase
        .from('assessments')
        .select('id, project_id, assessment_type')
        .eq('assessment_type', 'mentor')
        .limit(5000);

    if (mentorErr) {
        console.error('Error:', mentorErr);
    } else {
        console.log(`Mentor Assessments Retrieved: ${mentorData.length}`);

        const bxrProjId = '35025152-145e-4718-9ef5-e30d6beda2c8';
        const bxrRefs = mentorData.filter(d => d.project_id === bxrProjId);
        console.log(`Business X-Ray Assessments Included: ${bxrRefs.length}`);
    }

    console.log('\n--- Verifying Linear Min-Max Interpolation Logic ---');
    const scaleMin = 1;
    const scaleMax = 4;

    const simulateScore = (raw: number) => {
        return ((raw - scaleMin) / (scaleMax - scaleMin)) * 9 + 1;
    };

    console.log(`Scale: ${scaleMin} to ${scaleMax}`);
    console.log(`- Raw 1: -> Normalized ${simulateScore(1)}`);
    console.log(`- Raw 2: -> Normalized ${simulateScore(2)}`);
    console.log(`- Raw 3: -> Normalized ${simulateScore(3)}`);
    console.log(`- Raw 4: -> Normalized ${simulateScore(4)}`);
}

verify();
