import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wqcdtdofwytfrcbhfycc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    // 1. Find Business X-Ray project
    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('id, name, sequence_label, project_type');

    if (pErr) { console.error('Projects error:', pErr.message); return; }
    console.log('\n=== ALL PROJECTS ===');
    projects.forEach(p => console.log(`  [${p.project_type}] ${p.sequence_label} - ${p.name} (${p.id})`));

    const bxr = projects.find(p => p.name?.toLowerCase().includes('business') || p.name?.toLowerCase().includes('x-ray') || p.name?.toLowerCase().includes('xray') || p.name?.toLowerCase().includes('bxr'));
    if (!bxr) {
        console.log('\n⚠️  No "Business X-Ray" project found by name. Check project list above.');
        return;
    }
    console.log(`\n✅  Found project: ${bxr.name} (ID: ${bxr.id})`);

    // 2. Check assessment_logs for this project with type 'mentor'
    const { data: logs, error: lErr } = await supabase
        .from('assessment_logs')
        .select('id, data_type, assessment_date, cohort, project_id, records_inserted, file_name, mapping_config')
        .eq('project_id', bxr.id)
        .eq('data_type', 'mentor');

    if (lErr) { console.error('Logs error:', lErr.message); return; }
    console.log(`\n=== MENTOR ASSESSMENT LOGS for ${bxr.name} ===`);
    if (!logs || logs.length === 0) {
        console.log('  ❌ NO mentor logs found for this project!');
    } else {
        logs.forEach(l => console.log(`  Log: ${l.id} | date=${l.assessment_date} | cohort=${l.cohort} | records=${l.records_inserted} | file=${l.file_name}`));
    }

    // 3. Check assessments table
    const { data: assessments, error: aErr } = await supabase
        .from('assessments')
        .select('id, project_id, assessment_log_id, assessment_type')
        .eq('project_id', bxr.id)
        .eq('assessment_type', 'mentor')
        .limit(5);

    if (aErr) { console.error('Assessments error:', aErr.message); return; }
    console.log(`\n=== MENTOR ASSESSMENTS for ${bxr.name} (first 5) ===`);
    if (!assessments || assessments.length === 0) {
        console.log('  ❌ NO mentor assessments rows found for this project!');
    } else {
        assessments.forEach(a => console.log(`  Row: ${a.id} | log=${a.assessment_log_id} | type=${a.assessment_type}`));
    }

    // 4. Check all assessments regardless of type
    const { count: totalCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', bxr.id);

    console.log(`\n  Total assessments (any type) for this project: ${totalCount}`);
}

diagnose().catch(console.error);
