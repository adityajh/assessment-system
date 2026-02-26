import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqcdtdofwytfrcbhfycc.supabase.co'
const supabaseKey = 'sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
    const { data, error } = await supabase
        .from('assessments')
        .select('id, assessment_log_id')
        .limit(1)

    console.log("Error:", error)
    console.log("Data:", data)
}

testFetch()
