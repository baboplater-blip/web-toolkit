import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { executeClaudeCommand } from './executor';
import { startHeartbeat } from './heartbeat';
import { syncHarnesses } from './harness';

// 환경변수 로드
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const AGENT_API_KEY = process.env.AGENT_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !AGENT_API_KEY) {
  console.error('필수 환경변수가 설정되지 않았습니다:');
  console.error('  SUPABASE_URL, SUPABASE_SERVICE_KEY, AGENT_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- 자동 복구: 지수 백오프 ---
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;
let reconnectAttempts = 0;

function getBackoffDelay(): number {
  const delay = Math.min(
    BACKOFF_BASE_MS * Math.pow(2, reconnectAttempts),
    BACKOFF_MAX_MS
  );
  reconnectAttempts++;
  return delay;
}

function resetBackoff(): void {
  reconnectAttempts = 0;
}

/** 메시지 구독 채널을 생성하고 반환 */
function subscribeMessages(
  client: SupabaseClient,
  agentId: string
): RealtimeChannel {
  const channel = client
    .channel(`agent-${agentId}-messages-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `agent_id=eq.${agentId}`,
      },
      async (payload) => {
        const message = payload.new as {
          id: string;
          role: string;
          content: string;
          harness_id: string | null;
          status: string;
        };

        // user 메시지만 처리
        if (message.role !== 'user') return;

        // 중복 처리 방지: status를 'completed' → 'processing'으로 선점 시도
        // 다른 인스턴스가 먼저 선점했으면 0행 업데이트 → 스킵
        const { data: claimed } = await client
          .from('messages')
          .update({ status: 'processing' } as any)
          .eq('id', message.id)
          .eq('status', 'completed')
          .select('id');

        if (!claimed || claimed.length === 0) {
          console.log(`[스킵] 이미 처리 중인 메시지: ${message.id}`);
          return;
        }

        console.log(`[메시지 수신] ${message.content.substring(0, 50)}...`);

        // Agent 상태를 busy로 변경
        await client
          .from('agents')
          .update({ status: 'busy' })
          .eq('id', agentId);

        // 하네스 경로 조회
        let harnessPath: string | null = null;
        if (message.harness_id) {
          const { data: harness } = await client
            .from('harnesses')
            .select('path')
            .eq('id', message.harness_id)
            .single();
          if (harness) harnessPath = harness.path;
        }

        // Claude 실행 및 응답 스트리밍
        await executeClaudeCommand(client, agentId, message.id, message.content, harnessPath);

        // Agent 상태를 online으로 복원
        await client
          .from('agents')
          .update({ status: 'online' })
          .eq('id', agentId);
      }
    )
    .subscribe((status, err) => {
      console.log(`[Realtime] 구독 상태: ${status}`);

      if (status === 'SUBSCRIBED') {
        resetBackoff();
        console.log('[Realtime] 연결 성공');
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const delay = getBackoffDelay();
        console.error(
          `[Realtime] 연결 오류 (${status}). ${delay / 1000}초 후 재연결 시도... (시도 #${reconnectAttempts})`,
          err ?? ''
        );

        // 기존 채널 정리 후 재구독
        client.removeChannel(channel);
        setTimeout(() => {
          console.log('[Realtime] 재연결 시도...');
          currentChannel = subscribeMessages(client, agentId);
        }, delay);
      }
    });

  return channel;
}

let currentChannel: RealtimeChannel | null = null;

async function main() {
  // 1. Agent 인증 및 정보 조회
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key', AGENT_API_KEY)
    .single();

  if (error || !agent) {
    console.error('Agent 인증 실패. API 키를 확인하세요.');
    process.exit(1);
  }

  console.log(`[Agent] "${agent.name}" 시작 (ID: ${agent.id})`);

  // 2. 온라인 상태로 변경
  await supabase
    .from('agents')
    .update({ status: 'online', last_heartbeat: new Date().toISOString() })
    .eq('id', agent.id);

  // 3. 하트비트 시작 (30초 간격)
  startHeartbeat(supabase, agent.id);

  // 4. 하네스 목록 동기화
  await syncHarnesses(supabase, agent.id);

  // 5. 새 메시지 대기 (Realtime 구독 + 자동 재연결)
  currentChannel = subscribeMessages(supabase, agent.id);

  // 종료 시 정리
  const cleanup = async () => {
    console.log('\n[Agent] 종료 중...');
    await supabase
      .from('agents')
      .update({ status: 'offline' })
      .eq('id', agent.id);
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('[Agent] 메시지 대기 중...');
}

// --- 자동 복구: 전역 예외 처리 ---
process.on('uncaughtException', (err) => {
  console.error('[Agent] 미처리 예외:', err);
  // 프로세스를 죽이지 않고 로깅만 수행
  // 치명적 오류(메모리 부족 등)가 아닌 한 계속 실행
});

process.on('unhandledRejection', (reason) => {
  console.error('[Agent] 미처리 Promise 거부:', reason);
});

main().catch((err) => {
  console.error('[Agent] 치명적 오류:', err);
  process.exit(1);
});
