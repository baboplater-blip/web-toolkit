import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
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

  // 5. 새 메시지 대기 (Realtime 구독)
  const channel = supabase
    .channel(`agent-${agent.id}-messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `agent_id=eq.${agent.id}`,
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

        console.log(`[메시지 수신] ${message.content.substring(0, 50)}...`);

        // Agent 상태를 busy로 변경
        await supabase
          .from('agents')
          .update({ status: 'busy' })
          .eq('id', agent.id);

        // 하네스 경로 조회
        let harnessPath: string | null = null;
        if (message.harness_id) {
          const { data: harness } = await supabase
            .from('harnesses')
            .select('path')
            .eq('id', message.harness_id)
            .single();
          if (harness) harnessPath = harness.path;
        }

        // Claude 실행 및 응답 스트리밍
        await executeClaudeCommand(supabase, agent.id, message.id, message.content, harnessPath);

        // Agent 상태를 online으로 복원
        await supabase
          .from('agents')
          .update({ status: 'online' })
          .eq('id', agent.id);
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime] 구독 상태: ${status}`);
    });

  // 종료 시 정리
  const cleanup = async () => {
    console.log('\n[Agent] 종료 중...');
    await supabase
      .from('agents')
      .update({ status: 'offline' })
      .eq('id', agent.id);
    supabase.removeChannel(channel);
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('[Agent] 메시지 대기 중...');
}

main().catch((err) => {
  console.error('[Agent] 치명적 오류:', err);
  process.exit(1);
});
