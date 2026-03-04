import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- Projects ---');
    const { data: projects } = await supabase.from('projects').select('id, name, sequence_label');
    console.table(projects);

    console.log('\n--- Latest Assessment Logs (Detailed) ---');
    const { data: logs } = await supabase
        .from('assessment_logs')
        .select('id, file_name, data_type, project_id, records_inserted, created_at, mapping_config')
        .order('created_at', { ascending: false })
        .limit(10);

    const logsWithProj = logs?.map(l => {
        const proj = projects?.find(p => p.id === l.project_id);
        return {
            id: l.id.slice(0, 8),
            file: l.file_name,
            type: l.data_type,
            records: l.records_inserted,
            project: proj ? `${proj.sequence_label} - ${proj.name}` : 'Unknown',
            scale: (l.mapping_config as any)?.raw_scale_max
        };
    });
    console.table(logsWithProj);

    // Check if there are any self assessments for Business X-Ray
    const bxrProj = projects?.find(p => p.name.toLowerCase().includes('x-ray') || p.name.toLowerCase().includes('xray'));
    if (bxrProj) {
        console.log(`\n--- Checking Assessments for Project: ${bxrProj.name} (${bxrProj.id}) ---`);
        const { count: mentorCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('project_id', bxrProj.id).eq('assessment_type', 'mentor');
        const { count: selfCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('project_id', bxrProj.id).eq('assessment_type', 'self');
        console.log('Mentor assessments:', mentorCount);
        console.log('Self assessments:', selfCount);
    }
}

debug();
