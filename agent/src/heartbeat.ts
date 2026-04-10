import type { SupabaseClient } from '@supabase/supabase-js';
import { hostname, platform, cpus, totalmem } from 'os';

const HEARTBEAT_INTERVAL = 30_000; // 30초

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
    .then(() => console.log('[하트비트] 시스템 정보 등록 완료'));

  // 주기적 하트비트
  const timer = setInterval(async () => {
    const { error } = await supabase
      .from('agents')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', agentId);

    if (error) {
      console.error('[하트비트] 업데이트 실패:', error.message);
    }
  }, HEARTBEAT_INTERVAL);

  // 종료 시 정리
  process.on('SIGINT', () => clearInterval(timer));
  process.on('SIGTERM', () => clearInterval(timer));

  console.log(`[하트비트] ${HEARTBEAT_INTERVAL / 1000}초 간격 시작`);
}
