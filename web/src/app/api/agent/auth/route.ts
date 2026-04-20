import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { signAgentJwt } from '@/lib/agent-jwt';
import { rateLimit, clientIp, rateLimitedResponse } from '@/lib/rate-limit';

/**
 * POST /api/agent/auth
 *
 * 에이전트가 자신의 AGENT_API_KEY 로 Supabase 접근용 JWT 를 교환한다.
 * - 요청: { api_key: string }
 * - 응답: { access_token, expires_at, agent_id, user_id }
 *
 * 이 엔드포인트 덕분에 에이전트 쪽 .env 에 Service Role Key 를 넣을 필요가 없다.
 * 서버만 SUPABASE_SERVICE_KEY / SUPABASE_JWT_SECRET 을 알고 있다.
 */

export const runtime = 'nodejs';

function errorResponse(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  // API 키 무차별 대입 방어 — IP 당 분당 30회 (정상 에이전트는 5분마다 교환).
  const rl = rateLimit({
    key: clientIp(req),
    limit: 30,
    windowMs: 60_000,
    namespace: 'agent-auth',
  });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !jwtSecret || !supabaseUrl) {
    return errorResponse(500, 'server_misconfigured');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'invalid_body');
  }

  const apiKey =
    body && typeof body === 'object' && 'api_key' in body
      ? String((body as Record<string, unknown>).api_key ?? '')
      : '';

  if (!/^acp_[a-f0-9]{32,64}$/.test(apiKey)) {
    return errorResponse(400, 'invalid_api_key_format');
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: agent, error } = await admin
    .from('agents')
    .select('id, user_id')
    .eq('api_key', apiKey)
    .maybeSingle();

  if (error) {
    return errorResponse(500, 'lookup_failed');
  }
  if (!agent || !agent.user_id) {
    return errorResponse(401, 'unauthorized');
  }

  const { access_token, expires_at } = signAgentJwt(
    agent.user_id,
    agent.id,
    jwtSecret,
    60 * 60,
  );

  return NextResponse.json({
    access_token,
    expires_at,
    agent_id: agent.id,
    user_id: agent.user_id,
  });
}
