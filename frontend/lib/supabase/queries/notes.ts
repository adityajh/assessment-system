import { SupabaseClient } from '@supabase/supabase-js';
import { Student } from './students';

export type MentorNote = {
    id: string;
    student_id: string;
    project_id: string | null;
    note_text: string;
    note_type: string;
    created_by: string;
    created_at: string;
    updated_at: string;
};

export type BasicProject = {
    id: string;
    sequence_label: string;
    name: string;
};

export async function getMentorNotesData(supabase: SupabaseClient) {
    const [notesResult, studentsResult, projectsResult] = await Promise.all([
        supabase.from('mentor_notes').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('student_number'),
        supabase.from('projects').select('id, sequence_label, name').order('sequence_label')
    ]);

    if (notesResult.error) throw notesResult.error;
    if (studentsResult.error) throw studentsResult.error;
    if (projectsResult.error) throw projectsResult.error;

    return {
        notes: notesResult.data as MentorNote[],
        students: studentsResult.data as Student[],
        projects: projectsResult.data as BasicProject[],
    };
}
