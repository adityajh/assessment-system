import { SupabaseClient } from '@supabase/supabase-js';
import { Student } from './students';

export type TermTracking = {
    id: string;
    student_id: string;
    assessment_log_id: string | null;
    cbp_count: number;
    conflexion_count: number;
    bow_score: number;
    term: string;
    updated_at: string;
};

export type AssessmentLog = {
    id: string;
    assessment_date: string;
    program_id: string;
    term: string;
    data_type: string;
    project_id: string | null;
    file_name: string;
    records_inserted: number;
};

export async function getMetricsData(supabase: SupabaseClient) {
    const [studentsResult, trackingResult, logsResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('term_tracking').select('*, assessment_logs(assessment_date, file_name, id)'),
        supabase.from('assessment_logs').select('*').eq('data_type', 'term').order('assessment_date', { ascending: false })
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (trackingResult.error) throw trackingResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
        students: studentsResult.data as Student[],
        tracking: trackingResult.data as TermTracking[],
        logs: logsResult.data as AssessmentLog[],
    };
}
