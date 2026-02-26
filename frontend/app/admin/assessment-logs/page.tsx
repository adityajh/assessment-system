import AssessmentLogsClientPage from './AssessmentLogsClientPage';
import { createClient } from '@/lib/supabase/server';

export default async function AssessmentLogsRoute() {
    const supabase = await createClient();

    // Fetch logs with program and project names
    const { data: logs, error } = await supabase
        .from('assessment_logs')
        .select(`
            *,
            programs ( name ),
            projects ( name )
        `)
        .order('assessment_date', { ascending: false });

    // Fetch readiness parameters to resolve mapping names nicely in the UI
    const { data: parameters } = await supabase.from('readiness_parameters').select('*');

    return <AssessmentLogsClientPage logs={logs || []} parameters={parameters || []} />;
}
