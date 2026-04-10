import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { executeClaudeCommand } from './executor';
import { startHeartbeat } from './heartbeat';
import { syncHarnesses } from './harness';
import { acquireLock, releaseLock } from './lock';
import { initLogger, log } from './logger';
import { startScheduler } from './scheduler';

// 환경변수
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const AGENT_API_KEY = process.env.AGENT_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !AGENT_API_KEY) {
  console.error('필수 환경변수: SUPABASE_URL, SUPABASE_SERVICE_KEY, AGENT_API_KEY');
  process.exit(1);
}

// 싱글 인스턴스 잠금
acquireLock();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 지수 백오프
const BACKOFF_BASE = 1000;
const BACKOFF_MAX = 30_000;
let reconnectAttempts = 0;

function getBackoff(): number {
  const delay = Math.min(BACKOFF_BASE * Math.pow(2, reconnectAttempts), BACKOFF_MAX);
  reconnectAttempts++;
  return delay;
}

let currentChannel: RealtimeChannel | null = null;

function subscribeMessages(client: SupabaseClient, agentId: string): RealtimeChannel {
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
          status: string;
        };

        if (msg.role !== 'user') return;

        // 중복 처리 방지: 선점
        const { data: claimed } = await client
          .from('messages')
          .update({ status: 'processing' } as any)
          .eq('id', msg.id)
          .eq('status', 'completed')
          .select('id');

        if (!claimed || claimed.length === 0) return;

        log(`메시지 수신: "${msg.content.substring(0, 50)}..."`);

        await client.from('agents').update({ status: 'busy' }).eq('id', agentId);

        // 하네스 경로 조회
        let harnessPath: string | null = null;
        if (msg.harness_id) {
          const { data: h } = await client
            .from('harnesses')
            .select('path')
            .eq('id', msg.harness_id)
            .single();
          if (h) harnessPath = h.path;
        }

        await executeClaudeCommand(client, agentId, msg.id, msg.content, harnessPath);

        await client.from('agents').update({ status: 'online' }).eq('id', agentId);
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0;
        log('Realtime 연결 성공');
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const delay = getBackoff();
        log(`Realtime 오류 (${status}). ${delay / 1000}초 후 재연결...`, 'warn');
        client.removeChannel(channel);
        setTimeout(() => {
          currentChannel = subscribeMessages(client, agentId);
        }, delay);
      }
    });

  return channel;
}

// 웹 재시작 감지: 2초마다 restart_requested 확인
function watchRestart(client: SupabaseClient, agentId: string) {
  setInterval(async () => {
    const { data } = await client
      .from('agents')
      .select('restart_requested')
      .eq('id', agentId)
      .single();

    if (data?.restart_requested) {
      log('웹에서 재시작 요청 수신. 재시작 중...', 'warn');
      await client
        .from('agents')
        .update({ restart_requested: false })
        .eq('id', agentId);

      // 프로세스 재시작 (pm2가 자동 재시작하거나, 직접 재시작)
      releaseLock();
      process.exit(0);
    }
  }, 2000);
}

async function main() {
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key', AGENT_API_KEY)
    .single();

  if (error || !agent) {
    console.error('Agent 인증 실패. API 키를 확인하세요.');
    releaseLock();
    process.exit(1);
  }

  // 로거 초기화
  initLogger(supabase, agent.id);

  log(`"${agent.name}" 시작 (PID: ${process.pid})`);

  await supabase
    .from('agents')
    .update({ status: 'online', last_heartbeat: new Date().toISOString() })
    .eq('id', agent.id);

  startHeartbeat(supabase, agent.id);
  await syncHarnesses(supabase, agent.id);

  currentChannel = subscribeMessages(supabase, agent.id);
  watchRestart(supabase, agent.id);
  startScheduler(supabase, agent.id);

  log('메시지 대기 중...');

  // 종료 정리
  const cleanup = async () => {
    log('종료 중...');
    await supabase.from('agents').update({ status: 'offline' }).eq('id', agent.id);
    if (currentChannel) supabase.removeChannel(currentChannel);
    releaseLock();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// 전역 예외 처리
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
