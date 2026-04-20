import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

/**
 * POST /api/share/create
 * body: { conversation_id: string, expires_in_days?: number }
 *
 * 인증: Bearer <Supabase auth token> (대화 소유자만 발급 가능 — RLS 로 검증)
 * 응답: { token, expires_at, share_url }
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
  const { conversation_id, expires_in_days } = (body ?? {}) as {
    conversation_id?: string;
    expires_in_days?: number;
  };
  if (!conversation_id || !/^[a-f0-9-]{36}$/i.test(conversation_id)) {
    return err(400, 'invalid_conversation_id');
  }

  // RLS 로 자신이 소유한 대화만 insert 가능
  const expires_at =
    typeof expires_in_days === 'number' && expires_in_days > 0
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const rawToken = randomBytes(18).toString('hex'); // 36자

  const { data, error } = await userClient
    .from('conversation_share_tokens')
    .insert({
      conversation_id,
      user_id: userData.user.id,
      token: rawToken,
      expires_at,
    })
    .select('token, expires_at')
    .single();

  if (error || !data) return err(500, 'create_failed');

  const origin = new URL(req.url).origin;
  return NextResponse.json({
    token: data.token,
    expires_at: data.expires_at,
    share_url: `${origin}/share/${data.token}`,
  });
}
