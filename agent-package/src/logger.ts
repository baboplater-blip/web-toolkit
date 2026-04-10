import type { SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _agentId: string | null = null;
const _buffer: { level: string; message: string }[] = [];
let _flushTimer: NodeJS.Timeout | null = null;

export function initLogger(supabase: SupabaseClient, agentId: string) {
  _supabase = supabase;
  _agentId = agentId;
}

/** 로그를 콘솔 + Supabase에 동시 기록 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const prefix = level === 'error' ? '[오류]' : level === 'warn' ? '[경고]' : '[정보]';
  console.log(`${prefix} ${message}`);

  if (_supabase && _agentId) {
    _buffer.push({ level, message });
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(flush, 1000);
}

async function flush() {
  _flushTimer = null;
  if (!_supabase || !_agentId || _buffer.length === 0) return;

  const rows = _buffer.splice(0, _buffer.length).map((entry) => ({
    agent_id: _agentId,
    level: entry.level,
    message: entry.message,
  }));

  await _supabase.from('agent_logs').insert(rows).then(({ error }) => {
    if (error) console.error('[로거] DB 전송 실패:', error.message);
  });

  // 오래된 로그 정리 (최근 200개만 유지)
  await _supabase
    .from('agent_logs')
    .delete()
    .eq('agent_id', _agentId!)
    .lt(
      'created_at',
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );
}
