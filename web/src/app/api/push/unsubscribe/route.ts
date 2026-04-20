import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/push/unsubscribe
 * body: { endpoint: string }
 * 인증: Bearer <Supabase auth token>
 */

export const runtime = 'nodejs';

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) return err(500, 'server_misconfigured');

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!token) return err(401, 'missing_token');

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return err(401, 'unauthorized');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, 'invalid_body');
  }
  const endpoint = (body as { endpoint?: string })?.endpoint;
  if (!endpoint) return err(400, 'missing_endpoint');

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('endpoint', endpoint);
  if (error) return err(500, 'delete_failed');

  return NextResponse.json({ ok: true });
}
