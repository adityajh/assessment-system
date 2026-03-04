import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- Latest Assessment Logs ---');
    const { data: logs, error: logError } = await supabase
        .from('assessment_logs')
        .select('id, file_name, data_type, project_id, records_inserted, created_at, mapping_config')
        .order('created_at', { ascending: false })
        .limit(10);

    if (logError) {
        console.error('Log Error:', JSON.stringify(logError, null, 2));
    } else {
        console.table(logs?.map(l => ({
            id: l.id.slice(0, 8),
            file: l.file_name,
            type: l.data_type,
            records: l.records_inserted,
            date: l.created_at,
            scale: (l.mapping_config as any)?.raw_scale_max
        })));

        // Check Business X-Ray specifically
        const bizXRayLog = logs?.find(l => l.file_name.includes('Business X-Ray') || (l.mapping_config && JSON.stringify(l.mapping_config).includes('Business X-Ray')));
        if (bizXRayLog) {
            console.log('\n--- Business X-Ray Log Detail ---');
            console.log('ID:', bizXRayLog.id);
            console.log('Records per log:', bizXRayLog.records_inserted);

            const { count, error: countErr } = await supabase
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('assessment_log_id', bizXRayLog.id);

            console.log('Actual assessments in DB for this log:', count);
        }

        // Check Kickstart scaling
        const kickstartLog = logs?.find(l => l.file_name.toLowerCase().includes('kickstart'));
        if (kickstartLog) {
            console.log('\n--- Kickstart Log Detail ---');
            console.log('ID:', kickstartLog.id);
            console.log('Raw Scale Max:', (kickstartLog.mapping_config as any)?.raw_scale_max);

            const { data: samples, error: sampleErr } = await supabase
                .from('assessments')
                .select('raw_score, normalized_score')
                .eq('assessment_log_id', kickstartLog.id)
                .limit(10);

            console.log('Sample scores:');
            console.table(samples);
        }
    }
}

debug();
