import type { SupabaseClient } from '@supabase/supabase-js';
import { log } from './logger';
import { nextCronRun } from './cron-parser';

const CHECK_INTERVAL_MS = 60_000; // 1분마다 확인

/**
 * cron 표현식에서 다음 실행 시각 계산.
 * 파싱 실패 시 1시간 뒤로 폴백 (스케줄러가 계속 살아있도록).
 */
function calculateNextRun(cron: string): Date {
  try {
    return nextCronRun(cron);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`cron 파싱 실패 ("${cron}"): ${msg} — 1시간 뒤로 폴백`, 'warn');
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}

/**
 * 실행 가능한 스케줄을 확인하고 메시지로 전환.
 * 기존 메시지 처리 플로우를 재사용한다.
 */
async function checkAndRun(supabase: SupabaseClient, agentId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();

  // enabled=true이고 next_run이 현재 시점 이전인 스케줄 조회
  const { data: dueSchedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('agent_id', agentId)
    .eq('enabled', true)
    .lte('next_run', now);

  if (error) {
    log(`스케줄 조회 실패: ${error.message}`, 'error');
    return;
  }

  if (!dueSchedules || dueSchedules.length === 0) return;

  for (const schedule of dueSchedules) {
    log(`예약 실행: "${schedule.prompt.substring(0, 50)}..." (cron: ${schedule.cron_expression})`);

    // 매 실행마다 전용 대화를 하나 새로 만들어 그 안에 메시지를 넣는다 (이전 실행과 섞이지 않도록).
    const title = `[예약] ${schedule.prompt.replace(/\s+/g, ' ').slice(0, 40)}`;
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ agent_id: agentId, user_id: userId, title })
      .select('id')
      .single();

    if (convErr || !conv) {
      log(`예약 대화 생성 실패: ${convErr?.message}`, 'error');
      continue;
    }

    // 메시지 INSERT (기존 메시지 처리 플로우 재사용)
    // status를 'completed'로 설정하여 agent의 Realtime 구독이 선점할 수 있게 함
    const { error: insertError } = await supabase.from('messages').insert({
      agent_id: agentId,
      user_id: userId,
      conversation_id: conv.id,
      role: 'user',
      content: schedule.prompt,
      status: 'completed',
    });

    if (insertError) {
      log(`예약 메시지 생성 실패: ${insertError.message}`, 'error');
      continue;
    }

    // last_run 업데이트, next_run 재계산
    const nextRun = calculateNextRun(schedule.cron_expression);
    await supabase
      .from('schedules')
      .update({
        last_run: now,
        next_run: nextRun.toISOString(),
      })
      .eq('id', schedule.id);

    log(`다음 실행: ${nextRun.toLocaleString('ko-KR')}`);
  }
}

/**
 * 스케줄러를 시작한다. 1분 간격으로 대기 중인 스케줄을 확인한다.
 * 반환된 타이머 ID로 clearInterval로 중단 가능.
 */
export function startScheduler(supabase: SupabaseClient, agentId: string, userId: string): NodeJS.Timeout {
  log('스케줄러 시작');

  // 시작 직후 한 번 실행
  checkAndRun(supabase, agentId, userId);

  const timer = setInterval(() => {
    checkAndRun(supabase, agentId, userId);
  }, CHECK_INTERVAL_MS);

  return timer;
}
