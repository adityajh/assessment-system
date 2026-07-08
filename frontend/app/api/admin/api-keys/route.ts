import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    // Note: In a real app, verify the user is a logged-in admin.
    const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, created_at, last_used_at, created_by')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

export async function POST(request: Request) {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('base64url');
    // Store its hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabase
        .from('api_keys')
        .insert([{
            name,
            key_hash: tokenHash,
            created_by: 'Admin UI'
        }])
        .select('id, name, created_at')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Only time we return the raw token
    return NextResponse.json({ data, token });
}

export async function DELETE(request: Request) {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
