import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const { count, error } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('assessment_type', 'mentor');

    if (error) {
        console.error('Error fetching count:', error);
    } else {
        console.log('Total Mentor Assessments:', count);
    }
}

debug();
