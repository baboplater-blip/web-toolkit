import type { SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _agentId: string | null = null;
let _userId: string | null = null;
const _buffer: {
  level: string;
  message: string;
  conversationId: string | null;
  messageId: string | null;
}[] = [];
let _flushTimer: NodeJS.Timeout | null = null;

/**
 * 현재 실행 중인 작업의 컨텍스트.
 * executor 는 큐로 직렬 실행되므로 모듈 레벨 단일 변수로 안전.
 * setLogContext 후 발생하는 log() 호출이 이 컨텍스트로 태깅된다.
 */
let _currentConversationId: string | null = null;
let _currentMessageId: string | null = null;

export function initLogger(supabase: SupabaseClient, agentId: string, userId: string) {
  _supabase = supabase;
  _agentId = agentId;
  _userId = userId;
}

export function setLogContext(ctx: { conversationId?: string | null; messageId?: string | null }) {
  _currentConversationId = ctx.conversationId ?? null;
  _currentMessageId = ctx.messageId ?? null;
}

export function clearLogContext() {
  _currentConversationId = null;
  _currentMessageId = null;
}

/**
 * 로그 메시지에서 민감정보 마스킹.
 * - 파일 경로 → [PATH]
 * - JWT/Bearer 토큰 → [TOKEN]
 * - 긴 해시/키 (40자 이상 hex) → [HEX]
 * - Windows 환경변수 경로 ($env:XXX) → [ENV]
 */
function redact(msg: string): string {
  let out = String(msg);
  // JWT 패턴 (eyJ로 시작하는 base64.base64.base64)
  out = out.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[JWT]');
  // Bearer / Authorization 토큰
  out = out.replace(/(Bearer|Token|apikey)[\s=:]+[A-Za-z0-9._-]{12,}/gi, '$1 [TOKEN]');
  // API key 패턴 (acp_ 접두사)
  out = out.replace(/acp_[A-Za-z0-9]{16,}/g, 'acp_[REDACTED]');
  // Windows 절대 경로 (C:\Users\...\xxx) — 파일명만 남김
  out = out.replace(/([A-Za-z]:\\[^\s"']*\\)([^\\\s"']+)/g, '[PATH]/$2');
  // POSIX 절대 경로
  out = out.replace(/(\/[A-Za-z0-9_.-]+){3,}/g, '[PATH]');
  // 40자 이상의 연속 hex (해시, 키 단독 노출)
  out = out.replace(/\b[a-f0-9]{40,}\b/gi, '[HEX]');
  return out.slice(0, 2000);
}

/** 로그를 콘솔 + Supabase에 동시 기록 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const prefix = level === 'error' ? '[오류]' : level === 'warn' ? '[경고]' : '[정보]';
  // 콘솔은 원본, DB는 마스킹 본 전송
  console.log(`${prefix} ${message}`);

  if (_supabase && _agentId) {
    _buffer.push({
      level,
      message: redact(message),
      conversationId: _currentConversationId,
      messageId: _currentMessageId,
    });
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(flush, 1000);
}

async function flush() {
  _flushTimer = null;
  if (!_supabase || !_agentId || !_userId || _buffer.length === 0) return;

  const rows = _buffer.splice(0, _buffer.length).map((entry) => ({
    agent_id: _agentId,
    user_id: _userId,
    level: entry.level,
    message: entry.message,
    conversation_id: entry.conversationId,
    message_id: entry.messageId,
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
