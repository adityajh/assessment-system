import { SupabaseClient } from '@supabase/supabase-js';
import { Student } from './students';

export type TermTracking = {
    id: string;
    student_id: string;
    cbp_count: number;
    conflexion_count: number;
    bow_score: number;
    term: string;
    updated_at: string;
};

export async function getTermTrackingData(supabase: SupabaseClient) {
    const [studentsResult, trackingResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('term_tracking').select('*').order('term')
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (trackingResult.error) throw trackingResult.error;

    return {
        students: studentsResult.data as Student[],
        tracking: trackingResult.data as TermTracking[],
    };
}
