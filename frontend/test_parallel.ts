import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
    try {
        console.log("Fetching sequentially...");
        const req1 = await supabase.from('students').select('id').limit(1);
        console.log("Req1:", req1.error || "OK");
        const req2 = await supabase.from('projects').select('id').limit(1);
        console.log("Req2:", req2.error || "OK");

        console.log("Fetching parallel...");
        const results = await Promise.all([
            supabase.from('students').select('id').limit(1),
            supabase.from('projects').select('id').limit(1),
            supabase.from('readiness_domains').select('id').limit(1),
            supabase.from('readiness_parameters').select('id').limit(1),
            supabase.from('assessments').select('id').limit(1),
            supabase.from('assessment_logs').select('id').limit(1)
        ]);
        console.log("Parallel results:", results.map(r => r.error || "OK"));

    } catch (e) {
        console.error("Exception:", e);
    }
}

testFetch()
