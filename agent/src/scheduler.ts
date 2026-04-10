import type { SupabaseClient } from '@supabase/supabase-js';
import { log } from './logger';

const CHECK_INTERVAL_MS = 60_000; // 1분마다 확인

/**
 * 다음 실행 시간을 cron 표현식으로부터 계산.
 * 지원 형식: 분/시/요일 기반 (매시간, 매일, 매주)
 */
function calculateNextRun(cron: string): Date {
  const [min, hour, , , weekday] = cron.split(' ');
  const now = new Date();
  const next = new Date();

  if (hour === '*' && min !== '*') {
    // 매시간 N분: 다음 정각+N분
    next.setMinutes(parseInt(min), 0, 0);
    if (next <= now) next.setHours(next.getHours() + 1);
  } else if (hour !== '*' && weekday === '*') {
    // 매일 N시 M분
    next.setHours(parseInt(hour), parseInt(min), 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (weekday !== '*') {
    // 매주 N요일
    const targetDay = parseInt(weekday);
    next.setHours(parseInt(hour), parseInt(min), 0, 0);
    while (next.getDay() !== targetDay || next <= now) {
      next.setDate(next.getDate() + 1);
    }
    next.setHours(parseInt(hour), parseInt(min), 0, 0);
  } else {
    // 기본: 1시간 후
    next.setTime(now.getTime() + 60 * 60 * 1000);
  }

  return next;
}

/**
 * 실행 가능한 스케줄을 확인하고 메시지로 전환.
 * 기존 메시지 처리 플로우를 재사용한다.
 */
async function checkAndRun(supabase: SupabaseClient, agentId: string): Promise<void> {
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

    // 메시지 INSERT (기존 메시지 처리 플로우 재사용)
    // status를 'completed'로 설정하여 agent의 Realtime 구독이 선점할 수 있게 함
    const { error: insertError } = await supabase.from('messages').insert({
      agent_id: agentId,
      role: 'user',
      content: `[예약] ${schedule.prompt}`,
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
export function startScheduler(supabase: SupabaseClient, agentId: string): NodeJS.Timeout {
  log('스케줄러 시작');

  // 시작 직후 한 번 실행
  checkAndRun(supabase, agentId);

  const timer = setInterval(() => {
    checkAndRun(supabase, agentId);
  }, CHECK_INTERVAL_MS);

  return timer;
}
