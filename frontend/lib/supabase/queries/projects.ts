import { SupabaseClient } from '@supabase/supabase-js';

export type Project = {
    id: string;
    name: string;
    internal_name: string | null;
    sequence: number;
    sequence_label: string;
    is_concurrent: boolean;
    concurrent_group: string | null;
    project_type: 'standard' | 'client';
    parent_project_id: string | null;
    created_at: string;
};

export async function getProjects(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sequence', { ascending: true })
        .order('sequence_label', { ascending: true });

    if (error) throw error;
    return data as Project[];
}

export async function updateProject(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Project, 'id' | 'created_at'>>
) {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Project;
}

export async function createProject(
    supabase: SupabaseClient,
    project: Omit<Project, 'id' | 'created_at'>
) {
    const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single();

    if (error) throw error;
    return data as Project;
}
