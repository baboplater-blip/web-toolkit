import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { executeClaudeCommand, type PushCtx } from './executor';
import { startHeartbeat } from './heartbeat';
import { syncHarnesses } from './harness';
import { acquireLock, releaseLock } from './lock';
import { initLogger, log } from './logger';
import { startScheduler } from './scheduler';
import { createAuthedAgentClient } from './auth';
import { catchupPendingWork } from './catchup';
import { pushNotify } from './push-notify';
import { detectPrimaryNetwork, startWakeHelper } from './wake';

/** package.json 에서 에이전트 버전을 읽어 DB 기록·업데이트 경고에 사용. */
function readAgentVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
    return typeof pkg.version === 'string' && pkg.version.length > 0 ? pkg.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

const AGENT_VERSION = readAgentVersion();

// 환경변수 — Service Role Key 는 더 이상 필요 없음.
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const API_BASE_URL = process.env.API_BASE_URL!;
const AGENT_API_KEY = process.env.AGENT_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !API_BASE_URL || !AGENT_API_KEY) {
  console.error('필수 환경변수: SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL, AGENT_API_KEY');
  console.error('구형 .env (SUPABASE_SERVICE_KEY) 를 쓰고 있다면 재설치하세요.');
  process.exit(1);
}

// 구형 설치 호환 경고 (Service Role Key 가 여전히 남아 있다면 무시하고 계속 진행)
if (process.env.SUPABASE_SERVICE_KEY) {
  console.warn('[경고] SUPABASE_SERVICE_KEY 가 .env 에 남아 있습니다. 이제 사용되지 않으니 삭제를 권장합니다.');
}

acquireLock();

// 지수 백오프 재연결 상태
const BACKOFF_BASE = 1000;
const BACKOFF_MAX = 30_000;
let reconnectAttempts = 0;
function getBackoff(): number {
  const delay = Math.min(BACKOFF_BASE * Math.pow(2, reconnectAttempts), BACKOFF_MAX);
  reconnectAttempts++;
  return delay;
}

let currentChannel: RealtimeChannel | null = null;

// 동시 작업 큐
interface QueueItem {
  msgId: string;
  content: string;
  harnessPath: string | null;
  conversationId: string;
}
const MAX_QUEUE_DEPTH = 20;
const messageQueue: QueueItem[] = [];
let processing = false;

async function processQueue(
  client: SupabaseClient,
  agentId: string,
  userId: string,
  pushCtx: PushCtx,
): Promise<void> {
  if (processing || messageQueue.length === 0) return;
  processing = true;

  while (messageQueue.length > 0) {
    const item = messageQueue.shift()!;
    await client.from('agents').update({ status: 'busy' }).eq('id', agentId);
    await executeClaudeCommand(
      client,
      agentId,
      userId,
      item.msgId,
      item.content,
      item.harnessPath,
      item.conversationId,
      pushCtx,
    );
    if (messageQueue.length > 0) {
      log(`큐 남은 작업: ${messageQueue.length}개`);
    }
  }

  await client.from('agents').update({ status: 'online' }).eq('id', agentId);
  processing = false;
}

function subscribeMessages(
  client: SupabaseClient,
  agentId: string,
  userId: string,
  pushCtx: PushCtx,
  getFreshAccessToken: () => Promise<string>,
): RealtimeChannel {
  // 한 채널에서 에러/종료 이벤트가 여러 번 발화되어 재귀 재연결이 쌓이는 걸 방지.
  // supabase-js 의 removeChannel 이 CLOSED 를 다시 트리거할 수 있어, 이 플래그 없이는
  // `Maximum call stack size exceeded` 로 폭주한다.
  let handledTermination = false;
  const channel = client
    .channel(`agent-${agentId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `agent_id=eq.${agentId}`,
      },
      async (payload) => {
        const msg = payload.new as {
          id: string;
          role: string;
          content: string;
          harness_id: string | null;
          conversation_id: string | null;
          status: string;
        };

        if (msg.role !== 'user') return;
        if (!msg.conversation_id) {
          // 스키마 migration 전의 구형 메시지 — 무시
          return;
        }

        // 중복 처리 방지: status 선점
        const { data: claimed } = await client
          .from('messages')
          .update({ status: 'processing' } as Record<string, unknown>)
          .eq('id', msg.id)
          .eq('status', 'completed')
          .select('id');

        if (!claimed || claimed.length === 0) return;

        log(`메시지 수신: "${msg.content.substring(0, 50)}..."`);

        let harnessPath: string | null = null;
        if (msg.harness_id) {
          const { data: h } = await client
            .from('harnesses')
            .select('path')
            .eq('id', msg.harness_id)
            .single();
          if (h) harnessPath = h.path;
        }

        if (messageQueue.length >= MAX_QUEUE_DEPTH) {
          log(`큐 가득 참 (${MAX_QUEUE_DEPTH}개) — 메시지 거부`, 'warn');
          await client.from('messages').insert({
            agent_id: agentId,
            user_id: userId,
            conversation_id: msg.conversation_id,
            role: 'system',
            content: `⚠️ 작업 큐가 가득 찼습니다 (${MAX_QUEUE_DEPTH}개). 현재 작업이 완료된 후 다시 시도해주세요.`,
            status: 'completed',
          });
          return;
        }

        messageQueue.push({
          msgId: msg.id,
          content: msg.content,
          harnessPath,
          conversationId: msg.conversation_id,
        });
        processQueue(client, agentId, userId, pushCtx);
      },
    )
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0;
        handledTermination = false;
        log('Realtime 연결 성공');
        return;
      }
      if (status !== 'CHANNEL_ERROR' && status !== 'TIMED_OUT' && status !== 'CLOSED') return;
      if (handledTermination) return; // 이미 재연결 스케줄됨 — 중복 무시
      handledTermination = true;

      const delay = getBackoff();
      log(`Realtime 오류 (${status}). ${delay / 1000}초 후 재연결...`, 'warn');
      try {
        client.removeChannel(channel);
      } catch {}
      // 재연결 직전에 websocket 의 auth 를 최신 토큰으로 밀어 넣어 CLOSED 루프 차단.
      try {
        const fresh = await getFreshAccessToken();
        if (fresh) client.realtime.setAuth(fresh);
      } catch {}
      setTimeout(() => {
        currentChannel = subscribeMessages(client, agentId, userId, pushCtx, getFreshAccessToken);
      }, delay);
    });

  return channel;
}

function watchRestart(client: SupabaseClient, agentId: string) {
  setInterval(async () => {
    const { data } = await client
      .from('agents')
      .select('restart_requested')
      .eq('id', agentId)
      .single();

    if (data?.restart_requested) {
      log('웹에서 재시작 요청 수신. 재시작 중...', 'warn');
      await client.from('agents').update({ restart_requested: false }).eq('id', agentId);
      releaseLock();
      process.exit(0);
    }
  }, 2000);
}

async function main() {
  // 1) Supabase JWT 교환
  const auth = await createAuthedAgentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    apiBase: API_BASE_URL,
    apiKey: AGENT_API_KEY,
  });

  const { supabase, agentId, userId } = auth;

  // 2) 에이전트 메타 재확인 (이름·소유자 + 직전 상태)
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, user_id, status, last_heartbeat')
    .eq('id', agentId)
    .maybeSingle();

  if (error || !agent) {
    console.error('Agent 조회 실패 — 재설치가 필요할 수 있습니다.');
    releaseLock();
    process.exit(1);
  }

  // 이 에이전트가 "깨어난" 상태인지 판정:
  //   - DB 에 status='offline' 으로 기록됐거나
  //   - last_heartbeat 가 2분 이상 오래됐다면 크래시/파워 차단으로 봐도 무방
  const wasOffline = (() => {
    if (agent.status === 'offline') return true;
    if (!agent.last_heartbeat) return true;
    return Date.now() - new Date(agent.last_heartbeat).getTime() > 2 * 60 * 1000;
  })();

  initLogger(supabase, agent.id, userId);

  // ANTHROPIC_API_KEY 가 설정되어 있으면 BYOK 모드. 자식 claude 프로세스가 구독 대신 API 를 사용한다.
  const apiMode: 'byok' | 'max' = process.env.ANTHROPIC_API_KEY ? 'byok' : 'max';
  log(
    `"${agent.name}" 시작 (PID: ${process.pid}, 버전: ${AGENT_VERSION}, 모드: ${apiMode === 'byok' ? 'Anthropic API' : 'Claude Max 구독'})`,
  );

  // Primary NIC 감지 — WoL 타겟/Helper 모두에 필요. 실패해도 null 저장.
  const net = detectPrimaryNetwork();
  if (net.mac) log(`NIC: mac=${net.mac} ipv4=${net.ipv4}`);
  else log('NIC 감지 실패 — WoL 불가', 'warn');

  await supabase
    .from('agents')
    .update({
      status: 'online',
      last_heartbeat: new Date().toISOString(),
      api_mode: apiMode,
      agent_version: AGENT_VERSION,
      mac_address: net.mac,
      local_ip: net.ipv4,
    })
    .eq('id', agent.id);

  startHeartbeat(supabase, agent.id);
  await syncHarnesses(supabase, agent.id, userId);

  const pushCtx: PushCtx = {
    apiBase: auth.apiBase,
    getAccessToken: auth.getAccessToken,
    agentName: agent.name,
  };

  currentChannel = subscribeMessages(supabase, agent.id, userId, pushCtx, auth.getAccessToken);
  watchRestart(supabase, agent.id);
  startScheduler(supabase, agent.id, userId);

  // 나 자신이 online 이면 같은 서브넷의 오프라인 동료를 깨워주는 helper 역할도 수행.
  const stopWakeHelper = startWakeHelper(supabase, agent.id, net.ipv4, userId);

  // 오프라인 중 쌓인 작업 복구. subscribe 이후에 실행해 race 를 atomic claim 으로 안전 처리.
  const enqueue = (item: {
    msgId: string;
    content: string;
    harnessPath: string | null;
    conversationId: string;
  }) => {
    if (messageQueue.length >= MAX_QUEUE_DEPTH) {
      log(`catchup: 큐 가득 참 (${MAX_QUEUE_DEPTH}) — 나머지는 다음 기회에`, 'warn');
      return;
    }
    messageQueue.push(item);
  };
  const recovered = await catchupPendingWork(supabase, agent.id, enqueue);
  if (recovered > 0) {
    processQueue(supabase, agent.id, userId, pushCtx);
  }

  // 주기적 catchup — Realtime INSERT 이벤트가 조용히 유실되는 드문 상황에서 안전망.
  // 큐가 비어 있을 때만 실행해 큐가 동작 중인데 중복 클레임하는 걸 피한다.
  setInterval(async () => {
    if (processing || messageQueue.length > 0) return;
    try {
      const picked = await catchupPendingWork(supabase, agent.id, enqueue);
      if (picked > 0) {
        log(`주기 catchup: 놓친 메시지 ${picked}건 복구`, 'warn');
        processQueue(supabase, agent.id, userId, pushCtx);
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      log(`주기 catchup 실패: ${m}`, 'warn');
    }
  }, 60_000);

  // 이전 세션이 오프라인/크래시 상태였다면 복귀 알림. 사용자가 모바일에서 받는다.
  if (wasOffline) {
    const recoveryBody =
      recovered > 0
        ? `오프라인 중 쌓인 명령 ${recovered}건을 자동 실행합니다.`
        : '온라인 상태로 복귀했습니다.';
    pushNotify({
      apiBase: auth.apiBase,
      getAccessToken: auth.getAccessToken,
      title: `${agent.name} 깨어남`,
      body: recoveryBody,
      variant: 'info',
      agentId: agent.id,
      tag: `agent-wake-${agent.id}`,
    }).catch(() => {});
  }

  log('메시지 대기 중...');

  const cleanup = async () => {
    log('종료 중...');
    try {
      await supabase.from('agents').update({ status: 'offline' }).eq('id', agent.id);
    } catch {}
    stopWakeHelper();
    if (currentChannel) supabase.removeChannel(currentChannel);
    auth.stop();
    releaseLock();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

process.on('uncaughtException', (err) => {
  log(`미처리 예외: ${err.message}`, 'error');
});
process.on('unhandledRejection', (reason) => {
  log(`미처리 거부: ${reason}`, 'error');
});

main().catch((err) => {
  console.error('치명적 오류:', err);
  releaseLock();
  process.exit(1);
});
