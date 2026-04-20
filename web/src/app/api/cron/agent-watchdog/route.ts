import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type AdminClient = SupabaseClient;

/**
 * GET/POST /api/cron/agent-watchdog
 *
 * 목적: 에이전트가 메시지를 점유한 뒤 죽어버리거나 스트리밍이 멈춘 좀비 상태,
 * 또는 에이전트 Realtime 구독이 조용히 끊겨 새 메시지를 못 집어 "고아" 가 된
 * 경우를 주기적으로 정리·복구해 UI 의 "응답 안 옴" 침묵을 방지.
 *
 * 동작:
 *  1) heartbeat 가 90 초 넘게 끊긴 online 에이전트를 offline 으로 표시.
 *  2) role='user' 이고 status='processing' 으로 6 분 이상 멈춘 메시지를 'error' 로 마감 —
 *     에이전트가 claim 한 뒤 assistant INSERT 전에 죽은 경우.
 *  3) role='assistant' 이고 status ∈ (streaming, processing) 인 메시지가 3 분 이상
 *     updated_at 변화가 없으면 'error' 로 마감 — 스트리밍 중 멈춘 경우.
 *  4) 같은 대화에서 user 메시지가 status='completed' 로 남았는데 90 초 이상 어시스턴트
 *     응답이 없으면 → 에이전트가 Realtime 이벤트를 놓친 고아로 간주. 해당 에이전트에
 *     restart_requested 플래그를 세워 재기동 시 catchup 이 집어가게 한다.
 *
 * 인증: Vercel Cron 의 x-vercel-cron 헤더 또는 Authorization: Bearer <CRON_SECRET>.
 *        UI 의 수동 트리거는 로그인 사용자 JWT 로 호출 (POST).
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

function err(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

interface WatchdogResult {
  agents_marked_offline: number;
  user_messages_timed_out: number;
  assistant_messages_timed_out: number;
  orphaned_user_messages: number;
  agents_restart_requested: number;
  scope: 'all' | 'user';
}

interface MessageRow {
  id: string;
  agent_id: string;
  user_id: string;
  conversation_id: string;
  role: string;
  status: string;
  created_at: string;
}

async function runWatchdog(admin: AdminClient, userFilter: string | null): Promise<WatchdogResult> {
  const now = Date.now();
  const heartbeatCutoff = new Date(now - 90_000).toISOString();      // 90s
  const userStuckCutoff = new Date(now - 6 * 60_000).toISOString();  // 6min (executor TASK_TIMEOUT 5min + 여유)
  const streamStaleCutoff = new Date(now - 3 * 60_000).toISOString(); // 3min silence

  // 1) Stale heartbeat 에이전트 → offline
  const agentBase = admin
    .from('agents')
    .update({ status: 'offline' satisfies 'offline' })
    .eq('status', 'online')
    .lt('last_heartbeat', heartbeatCutoff);
  const { data: staleAgents } = await (userFilter
    ? agentBase.eq('user_id', userFilter)
    : agentBase
  ).select('id');

  // 2) 6분 이상 processing 에 갇힌 user 메시지 → error
  const userMsgBase = admin
    .from('messages')
    .update({
      status: 'error' satisfies 'error',
      error_message: '에이전트가 응답하지 않아 자동 종료되었습니다. 다시 시도해주세요.',
    })
    .eq('role', 'user')
    .eq('status', 'processing')
    .lt('updated_at', userStuckCutoff);
  const { data: stuckUser } = await (userFilter
    ? userMsgBase.eq('user_id', userFilter)
    : userMsgBase
  ).select('id');

  // 3) 3분 이상 갱신 없는 assistant streaming/processing → error
  const streamBase = admin
    .from('messages')
    .update({
      status: 'error' satisfies 'error',
      error_message: '응답 스트리밍이 중단되어 자동 종료되었습니다.',
    })
    .eq('role', 'assistant')
    .in('status', ['streaming', 'processing'])
    .lt('updated_at', streamStaleCutoff);
  const { data: stuckStream } = await (userFilter
    ? streamBase.eq('user_id', userFilter)
    : streamBase
  ).select('id');

  // 4) 고아(orphan) user 메시지: 90 초 이상 지났는데 어시스턴트 응답이 없음.
  //    agent 가 Realtime INSERT 이벤트를 놓친 흔적. 해당 agent 에 restart 플래그 세팅.
  const orphanCutoff = new Date(now - 90_000).toISOString();
  const recentWindow = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7d

  const recentBase = admin
    .from('messages')
    .select('id, agent_id, user_id, conversation_id, role, status, created_at')
    .in('role', ['user', 'assistant'])
    .gt('created_at', recentWindow)
    .order('created_at', { ascending: false })
    .limit(5000);
  const { data: recentRows } = await (userFilter
    ? recentBase.eq('user_id', userFilter)
    : recentBase
  );
  const rows = (recentRows as MessageRow[] | null) ?? [];

  // 대화 id 별로 '가장 최근 메시지' 1 건만 확인 — 이게 user 이고 created_at < orphanCutoff 면 고아.
  const seenConv = new Set<string>();
  const orphanAgentIds = new Set<string>();
  let orphanCount = 0;
  for (const m of rows) {
    if (!m.conversation_id) continue;
    if (seenConv.has(m.conversation_id)) continue;
    seenConv.add(m.conversation_id);
    if (m.role !== 'user') continue;
    if (m.status === 'error' || m.status === 'cancelled') continue;
    if (m.created_at >= orphanCutoff) continue;
    orphanCount++;
    orphanAgentIds.add(m.agent_id);
  }

  let restartCount = 0;
  if (orphanAgentIds.size > 0) {
    const agentIds = Array.from(orphanAgentIds);
    const restartBase = admin
      .from('agents')
      .update({ restart_requested: true satisfies true })
      .in('id', agentIds)
      .eq('restart_requested', false);
    const { data: restarted } = await (userFilter
      ? restartBase.eq('user_id', userFilter)
      : restartBase
    ).select('id');
    restartCount = (restarted as Array<{ id: string }> | null)?.length ?? 0;
  }

  return {
    agents_marked_offline: (staleAgents as Array<{ id: string }> | null)?.length ?? 0,
    user_messages_timed_out: (stuckUser as Array<{ id: string }> | null)?.length ?? 0,
    assistant_messages_timed_out: (stuckStream as Array<{ id: string }> | null)?.length ?? 0,
    orphaned_user_messages: orphanCount,
    agents_restart_requested: restartCount,
    scope: userFilter ? 'user' : 'all',
  };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return err(500, 'server_misconfigured');

  const auth = req.headers.get('authorization') ?? '';
  const fromVercelCron = req.headers.get('x-vercel-cron') === '1';
  if (cronSecret) {
    if (auth !== `Bearer ${cronSecret}` && !fromVercelCron) return err(401, 'unauthorized');
  } else if (!fromVercelCron) {
    return err(401, 'unauthorized');
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await runWatchdog(admin, null);
  return NextResponse.json(result);
}

/**
 * 사용자가 로그인 상태에서 "지금 점검" 버튼으로 호출.
 * 해당 사용자의 에이전트/메시지만 정리한다.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) return err(500, 'server_misconfigured');

  const authHeader = req.headers.get('authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!accessToken) return err(401, 'unauthorized');

  // 사용자 식별: anon 클라이언트로 토큰 검증.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return err(401, 'unauthorized');

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await runWatchdog(admin, userData.user.id);
  return NextResponse.json(result);
}
