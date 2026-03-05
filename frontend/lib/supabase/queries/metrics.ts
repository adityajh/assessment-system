import { SupabaseClient } from '@supabase/supabase-js';
import { Student } from './students';

export type MetricRecord = {
    id: string;
    student_id: string;
    metric_id: string;
    assessment_log_id: string;
    value: number;
    metrics: {
        name: string;
    };
};

export type AssessmentLog = {
    id: string;
    assessment_date: string;
    program_id: string;
    term: string;
    data_type: string;
    file_name: string;
    mapping_config: any;
};

export type MetricType = {
    id: string;
    name: string;
};

export async function getMetricsData(supabase: SupabaseClient) {
    const [studentsResult, trackingResult, logsResult, metricsResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('metric_tracking').select('*, metrics(name)'),
        supabase.from('assessment_logs').select('*').eq('data_type', 'term').order('assessment_date', { ascending: false }),
        supabase.from('metrics').select('*').order('name')
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (trackingResult.error) throw trackingResult.error;
    if (logsResult.error) throw logsResult.error;
    if (metricsResult.error) throw metricsResult.error;

    return {
        students: studentsResult.data as Student[],
        tracking: trackingResult.data as MetricRecord[],
        logs: logsResult.data as AssessmentLog[],
        metrics: metricsResult.data as MetricType[]
    };
}
