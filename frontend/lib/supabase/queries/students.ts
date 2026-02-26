import { SupabaseClient } from '@supabase/supabase-js';

export type Student = {
    id: string;
    student_number: number;
    canonical_name: string;
    aliases: string[];
    program_id?: string;
    cohort?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Program = {
    id: string;
    name: string;
    created_at: string;
};

export async function getStudents(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('student_number', { ascending: true });

    if (error) throw error;
    return data as Student[];
}

export async function getPrograms(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return data as Program[];
}

export async function updateStudent(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>
) {
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Student;
}

export async function createStudent(
    supabase: SupabaseClient,
    student: Omit<Student, 'id' | 'created_at' | 'updated_at'>
) {
    const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single();

    if (error) throw error;
    return data as Student;
}
