const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function check() {
    try {
        const envPath = path.join(__dirname, 'frontend/.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

        if (!urlMatch || !keyMatch) {
            console.error("Could not find SUPABASE_URL or ANAL_KEY in .env.local");
            return;
        }

        const url = urlMatch[1].trim();
        const key = keyMatch[1].trim();

        const supabase = createClient(url, key);

        console.log("--- Checking Students ---");
        const { data: students, count, error: studentError } = await supabase.from('students').select('*', { count: 'exact', head: true });
        console.log("Students count:", count);

        console.log("\n--- Checking v_student_dashboard ---");
        const { data: metrics, error: metricError } = await supabase.from('v_student_dashboard').select('*').limit(3);
        if (metricError) console.error("Error:", metricError);
        else console.log("Sample metrics from view:", metrics);

        console.log("\n--- Checking raw assessments ---");
        const { data: rawAssess, error: rawError } = await supabase.from('assessments').select('id, assessment_type, normalized_score').limit(3);
        console.log("Sample raw assessments:", rawAssess);

        console.log("\n--- Checking term_tracking ---");
        const { data: termData, error: termError } = await supabase.from('term_tracking').select('*').limit(3);
        console.log("Sample term_tracking data:", termData);

    } catch (e) {
        console.error("Execution error:", e.message);
    }
}

check();
