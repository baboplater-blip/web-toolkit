import type { SupabaseClient } from '@supabase/supabase-js';
import { hostname, platform, cpus, totalmem } from 'os';
import { log } from './logger';

const HEARTBEAT_INTERVAL = 30_000; // 30초
const MAX_CONSECUTIVE_FAILURES = 3;

export function startHeartbeat(supabase: SupabaseClient, agentId: string) {
  const systemInfo = {
    hostname: hostname(),
    platform: platform(),
    cpu: cpus()[0]?.model ?? 'unknown',
    cores: cpus().length,
    totalMemory: `${Math.round(totalmem() / 1024 / 1024 / 1024)}GB`,
  };

  // 초기 시스템 정보 업데이트
  supabase
    .from('agents')
    .update({ system_info: systemInfo })
    .eq('id', agentId)
    .then(() => log('시스템 정보 등록 완료'));

  let consecutiveFailures = 0;

  // 주기적 하트비트
  const timer = setInterval(async () => {
    const { error } = await supabase
      .from('agents')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', agentId);

    if (error) {
      consecutiveFailures++;
      log(`하트비트 실패 (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${error.message}`, 'warn');

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        log('하트비트 연속 실패 — 연결 복구 시도', 'warn');
        // 상태를 online으로 강제 재설정 시도
        const { error: recoveryError } = await supabase
          .from('agents')
          .update({
            status: 'online',
            last_heartbeat: new Date().toISOString(),
          })
          .eq('id', agentId);

        if (!recoveryError) {
          log('하트비트 복구 성공');
          consecutiveFailures = 0;
        } else {
          log(`하트비트 복구 실패: ${recoveryError.message}`, 'error');
        }
      }
    } else {
      if (consecutiveFailures > 0) {
        log(`하트비트 정상 복귀 (${consecutiveFailures}회 실패 후)`);
      }
      consecutiveFailures = 0;
    }
  }, HEARTBEAT_INTERVAL);

  // 종료 시 정리
  process.on('SIGINT', () => clearInterval(timer));
  process.on('SIGTERM', () => clearInterval(timer));

  log(`하트비트 ${HEARTBEAT_INTERVAL / 1000}초 간격 시작`);
}
