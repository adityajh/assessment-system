import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const data = await request.json();
        const { type, records } = data;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return NextResponse.json({ error: 'No records provided' }, { status: 400 });
        }

        if (type === 'mentor' || type === 'self') {
            const { data: result, error } = await supabase
                .from('assessments')
                .upsert(records, {
                    onConflict: 'student_id,project_id,parameter_id,assessment_type'
                });

            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: `Successfully imported ${records.length} ${type} assessments.`,
                count: records.length
            });
        }

        // Handlers for peer/term can be added here once those schemas are firm

        return NextResponse.json({ error: `Unsupported import type: ${type}` }, { status: 400 });

    } catch (error: any) {
        console.error('Import saving error:', error);
        return NextResponse.json(
            { error: `Failed to save records: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
