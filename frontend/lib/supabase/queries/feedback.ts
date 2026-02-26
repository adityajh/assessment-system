import { SupabaseClient } from '@supabase/supabase-js';
import { Student } from './students';
import { Project } from './projects';

export type PeerFeedback = {
    id: string;
    recipient_id: string;
    giver_id: string;
    project_id: string;
    quality_of_work: number | null;
    initiative_ownership: number | null;
    communication: number | null;
    collaboration: number | null;
    growth_mindset: number | null;
    normalized_avg: number | null;
    assessment_log_id: string | null;
    submitted_at: string | null;
    created_at: string;
};

export async function getPeerFeedbackData(supabase: SupabaseClient) {
    const [studentsResult, projectsResult, feedbackResult, logsResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('projects').select('*').order('sequence').order('sequence_label'),
        supabase.from('peer_feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('assessment_logs').select('id, assessment_date, file_name, project_id').eq('data_type', 'peer').order('assessment_date', { ascending: false })
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (feedbackResult.error) throw feedbackResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
        students: studentsResult.data as Student[],
        projects: projectsResult.data as Project[],
        feedback: feedbackResult.data as PeerFeedback[],
        logs: logsResult.data as any[]
    };
}
