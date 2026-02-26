import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { logId } = await request.json();

        if (!logId) {
            return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Deleting the log record will cascade and delete associated assessments, 
        // peer feedback, and term tracking records due to ON DELETE CASCADE configs.
        const { error } = await supabase
            .from('assessment_logs')
            .delete()
            .eq('id', logId);

        if (error) {
            console.error('Error deleting log:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Import successfully deleted and data reverted.' });
    } catch (err: any) {
        console.error('Delete import error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
