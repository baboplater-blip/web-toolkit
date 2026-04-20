import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhook/test
 * body: { agent_id: string, url?: string }
 *
 * 지정된 agent 의 webhook_url (또는 body 로 전달된 url) 로 테스트 페이로드를 POST 한다.
 * 인증: Bearer <Supabase auth token> — agent 소유자만 사용 가능 (RLS 로 검증).
 *
 * 응답 예: { ok, status, latency_ms, error? }
 *
 * 보안: 사설/링크로컬/루프백 IP/호스트 차단 (SSRF 방지). 5s 타임아웃.
 */

export const runtime = 'nodejs';

function err(status: number, code: string, details?: string) {
  return NextResponse.json({ error: code, details }, { status });
}

/**
 * SSRF 차단 — 사설/루프백/메타데이터 주소 금지.
 * agent 측 isSafeWebhookUrl 과 동일 로직을 유지한다.
 */
function isSafeWebhookUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;

  const host = u.hostname.toLowerCase();
  const blockedHosts = ['localhost', '0.0.0.0', 'metadata.google.internal', 'metadata.goog'];
  if (blockedHosts.includes(host)) return false;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 127) return false;
    if (a === 10) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 169 && b === 254) return false;
    if (a === 0) return false;
  }

  if (host === '[::1]' || host.startsWith('[fe80:') || host.startsWith('[fc') || host.startsWith('[fd')) {
    return false;
  }

  return true;
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
  const { agent_id, url: urlOverride } = (body ?? {}) as {
    agent_id?: string;
    url?: string;
  };
  if (!agent_id || !/^[a-f0-9-]{36}$/i.test(agent_id)) {
    return err(400, 'invalid_agent_id');
  }

  // RLS 로 소유 agent 만 조회 가능
  const { data: agent, error: agentErr } = await userClient
    .from('agents')
    .select('id, name, webhook_url')
    .eq('id', agent_id)
    .single();
  if (agentErr || !agent) return err(404, 'agent_not_found');

  const targetRaw = (urlOverride ?? (agent.webhook_url as string | null) ?? '').trim();
  if (!targetRaw) return err(400, 'no_webhook_url');

  if (!isSafeWebhookUrl(targetRaw)) {
    return err(400, 'unsafe_url', '사설망/루프백/비HTTP URL 은 차단됩니다.');
  }

  const payload = {
    content: `**[ACP] ${agent.name}** 웹훅 테스트\n> 이 메시지가 보이면 웹훅이 정상 동작합니다.\n${new Date().toISOString()}`,
  };

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5000);
  const started = Date.now();
  try {
    const res = await fetch(targetRaw, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      redirect: 'error',
    });
    const latency = Date.now() - started;
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      latency_ms: latency,
    });
  } catch (e) {
    const latency = Date.now() - started;
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      ok: false,
      status: 0,
      latency_ms: latency,
      error: message,
    });
  } finally {
    clearTimeout(timeout);
  }
}
