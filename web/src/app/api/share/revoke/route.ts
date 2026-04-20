import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/share/revoke
 * body: { token?: string, conversation_id?: string }
 * - token 지정 시 그 토큰만 회수
 * - conversation_id 지정 시 해당 대화의 모든 활성 토큰 회수
 *
 * 인증: Bearer <Supabase auth token>
 * 응답: { revoked: number }
 */

export const runtime = 'nodejs';

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return err(500, 'server_misconfigured');

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!token) return err(401, 'missing_token');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, 'invalid_body');
  }
  const { token: revokeToken, conversation_id } = (body ?? {}) as {
    token?: string;
    conversation_id?: string;
  };
  if (!revokeToken && !conversation_id) return err(400, 'missing_target');

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  let query = userClient
    .from('conversation_share_tokens')
    .update({ revoked_at: now }, { count: 'exact' })
    .is('revoked_at', null);

  if (revokeToken) query = query.eq('token', revokeToken);
  if (conversation_id) query = query.eq('conversation_id', conversation_id);

  const { count, error } = await query;
  if (error) return err(500, 'revoke_failed');

  return NextResponse.json({ revoked: count ?? 0 });
}
