import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing domains query...');
    const { data, error } = await supabase.from('readiness_domains').select('*').order('display_order');
    if (error) {
        console.error('DOMAIN ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('DOMAINS OK:', data.length);
    }

    console.log('Testing parameters query...');
    const { data: pData, error: pError } = await supabase.from('readiness_parameters').select('*').order('param_number');
    if (pError) {
        console.error('PARAM ERROR:', JSON.stringify(pError, null, 2));
    } else {
        console.log('PARAMS OK:', pData.length);
    }
}

test();
