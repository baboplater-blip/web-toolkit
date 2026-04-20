import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agent/wake
 * body: { agent_id: string }
 *
 * 오프라인 에이전트를 같은 서브넷의 온라인 helper 에이전트가 깨우도록 요청.
 *   1) 타겟 에이전트의 mac_address · local_ip 확인
 *   2) 같은 사용자 소유의 온라인 에이전트 중 타겟과 /24 서브넷이 일치하는 helper 가 있는지 확인
 *   3) agents.wake_request_at = now() 로 설정 → Realtime 으로 helper 가 감지, 매직 패킷 전송
 *
 * 인증: Bearer <Supabase user token>. RLS 로 본인 소유 에이전트에만 쓸 수 있다.
 * 응답: { ok, helper?: string, reason?: string }
 */

export const runtime = 'nodejs';

function err(status: number, code: string, details?: string) {
  return NextResponse.json({ error: code, details }, { status });
}

function sameSubnet(a: string, b: string): boolean {
  const sa = a.split('.');
  const sb = b.split('.');
  if (sa.length !== 4 || sb.length !== 4) return false;
  return sa[0] === sb[0] && sa[1] === sb[1] && sa[2] === sb[2];
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
  const { agent_id } = (body ?? {}) as { agent_id?: string };
  if (!agent_id || !/^[a-f0-9-]{36}$/i.test(agent_id)) {
    return err(400, 'invalid_agent_id');
  }

  // RLS 로 소유 agent 만 조회됨.
  const { data: target, error: targetErr } = await userClient
    .from('agents')
    .select('id, name, mac_address, local_ip, status')
    .eq('id', agent_id)
    .single();
  if (targetErr || !target) return err(404, 'agent_not_found');

  if (!target.mac_address) {
    return err(400, 'no_mac', 'MAC 주소가 등록되지 않은 PC입니다. 한 번 온라인 상태로 켜서 감지하게 해주세요.');
  }
  if (!target.local_ip) {
    return err(400, 'no_local_ip', '로컬 IP 정보가 없습니다.');
  }

  // 같은 서브넷의 온라인 helper 찾기.
  const { data: helpers } = await userClient
    .from('agents')
    .select('id, name, local_ip, status, last_heartbeat')
    .eq('status', 'online')
    .neq('id', agent_id);
  const eligibleHelper = (helpers ?? []).find((h) => {
    if (!h.local_ip) return false;
    // DB status 가 'online' 이어도 heartbeat 가 2분 넘으면 stale — UI 와 동일 임계.
    if (h.last_heartbeat && Date.now() - new Date(h.last_heartbeat).getTime() > 2 * 60 * 1000) {
      return false;
    }
    return sameSubnet(h.local_ip, target.local_ip as string);
  });

  if (!eligibleHelper) {
    return err(
      400,
      'no_helper',
      '같은 네트워크에 온라인 PC가 없어 자동으로 깨울 수 없습니다. 스마트폰 WoL 앱을 사용해 주세요.',
    );
  }

  const { error: updateErr } = await userClient
    .from('agents')
    .update({ wake_request_at: new Date().toISOString() })
    .eq('id', agent_id);
  if (updateErr) return err(500, 'update_failed', updateErr.message);

  return NextResponse.json({
    ok: true,
    helper: eligibleHelper.name,
    mac: target.mac_address,
  });
}
