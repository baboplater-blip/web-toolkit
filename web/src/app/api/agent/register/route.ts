import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp, rateLimitedResponse } from '@/lib/rate-limit';

/**
 * POST /api/agent/register
 *
 * install_token 으로 최초 1회 교환: { api_key, user_id, agent_id } 를 돌려준다.
 * 에이전트 설치 스크립트는 이 엔드포인트만 사용한다 — Service Role Key 를 PC 에 내려받지 않는다.
 *
 * - 요청: { install_token: string, pc_name?: string }
 * - 응답: { api_key, user_id, agent_id }
 */

export const runtime = 'nodejs';

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  // install_token 연타/무차별 대입 방어 — IP 당 분당 10회.
  const rl = rateLimit({
    key: clientIp(req),
    limit: 10,
    windowMs: 60_000,
    namespace: 'agent-register',
  });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return err(500, 'server_misconfigured');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, 'invalid_body');
  }

  const token =
    body && typeof body === 'object' && 'install_token' in body
      ? String((body as Record<string, unknown>).install_token ?? '')
      : '';
  if (!/^[a-f0-9]{16,64}$/i.test(token)) {
    return err(400, 'invalid_token_format');
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) 토큰 유효성 + 만료 확인
  const { data: row, error } = await admin
    .from('install_tokens')
    .select('id, token, pc_name, api_key, user_id, used, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error) return err(500, 'lookup_failed');
  if (!row) return err(404, 'not_found');
  if (row.used) return err(410, 'already_used');
  if (new Date(row.expires_at).getTime() < Date.now()) return err(410, 'expired');

  // 2) agents 테이블에 (id, api_key, user_id) 가 존재하는지 확인, 없으면 생성
  //    AddPCDialog 흐름에서는 이미 insert 되지만, 방어적으로 upsert 처럼 동작시킴
  const { data: existing } = await admin
    .from('agents')
    .select('id')
    .eq('api_key', row.api_key)
    .eq('user_id', row.user_id)
    .maybeSingle();

  let agentId = existing?.id;

  if (!agentId) {
    const { data: inserted, error: insErr } = await admin
      .from('agents')
      .insert({
        name: row.pc_name,
        api_key: row.api_key,
        user_id: row.user_id,
      })
      .select('id')
      .single();
    if (insErr || !inserted) return err(500, 'register_failed');
    agentId = inserted.id;
  }

  // 3) 토큰 소비 표시 (실패해도 무시 — 이미 agent 는 만들어졌음)
  await admin.from('install_tokens').update({ used: true }).eq('id', row.id);

  return NextResponse.json({
    api_key: row.api_key,
    user_id: row.user_id,
    agent_id: agentId,
  });
}
