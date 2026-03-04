import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- All Projects ---');
    const { data: projects, error } = await supabase.from('projects').select('*').order('sequence');
    if (error) {
        console.error('Error fetching projects:', error);
    } else {
        console.table(projects);
    }
}

debug();
