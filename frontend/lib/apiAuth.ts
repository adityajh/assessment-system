import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validates the Authorization Bearer token in the request header.
 * @param request The incoming NextRequest
 * @returns boolean indicating if the token is valid
 */
export async function authenticateApiRequest(request: Request): Promise<boolean> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return false;

    // Hash the token using SHA-256
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check against database
    const { data, error } = await supabase
        .from('api_keys')
        .select('id')
        .eq('key_hash', tokenHash)
        .single();

    if (error || !data) {
        return false;
    }

    // Update last_used_at timestamp in background (fire and forget)
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then();

    return true;
}
