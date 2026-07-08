import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/apiAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const isAuthenticated = await authenticateApiRequest(request);
    if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const studentId = id;

    // Fetch student basic profile
    const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 404 });
    }

    // Fetch domain scores
    const { data: scores } = await supabase
        .from('v_domain_scores')
        .select('*')
        .eq('student_id', studentId);

    // Fetch peer feedback summary
    const { data: feedback } = await supabase
        .from('v_peer_feedback_summary')
        .select('*')
        .eq('student_id', studentId);

    return NextResponse.json({
        data: {
            profile,
            scores: scores || [],
            feedback: feedback || []
        }
    });
}
