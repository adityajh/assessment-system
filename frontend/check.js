const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/adityajhunjhunwala/Documents/Antigravity/AssessmentSystem/frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: termTracking } = await supabase.from('term_tracking').select('student_id, cbp_count, conflexion_count, bow_score, student_profiles(canonical_name)');
  const { data: selfAssessments } = await supabase.from('assessments').select('student_id').eq('assessment_type', 'self');

  const saCount = {};
  selfAssessments.forEach(sa => {
    saCount[sa.student_id] = (saCount[sa.student_id] || 0) + 1;
  });

  let consistency = 0;
  let breadth = 0;

  console.log("Stats:");
  termTracking.forEach(t => {
    const sa = saCount[t.student_id] || 0;
    const cbp = t.cbp_count || 0;
    const conf = t.conflexion_count || 0;
    const bow = Number(t.bow_score || 0);

    const hasC = cbp >= 4 && conf >= 4;
    const hasB = cbp >= 5 && conf >= 5 && bow >= 8 && sa >= 10;

    if (hasC) consistency++;
    if (hasB) breadth++;

    if (hasC || hasB || sa > 0) {
      console.log(`${t.student_profiles?.canonical_name}: CBP=${cbp}, Conf=${conf}, BoW=${bow}, SA=${sa} -> Consistency:${hasC}, Breadth:${hasB}`);
    }
  });

  console.log(`\nTotal Consistency Badges: ${consistency}`);
  console.log(`Total Breadth Badges: ${breadth}`);
}

check();
