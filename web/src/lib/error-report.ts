'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * 가벼운 에러 트래킹 — Sentry 같은 외부 서비스 대신 Supabase `client_errors` 테이블에 직접 적재.
 *
 * 설계:
 *   - 과도한 호출 방지: 메시지+스택 해시 기반 쿨다운 (60초 내 동일 에러는 건너뜀)
 *   - 로그인 상태면 user_id 기록, 익명이면 NULL 로 남김 (RLS 허용 범위)
 *   - 네트워크 실패해도 조용히 무시 (에러 보고가 또 다른 에러를 일으키면 안 됨)
 */

type Source = 'web' | 'server' | 'sw';

interface ReportArgs {
  error: unknown;
  source?: Source;
  context?: Record<string, unknown>;
  level?: 'error' | 'warn';
}

const recentlyReported = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function fingerprint(err: unknown): string {
  if (err instanceof Error) {
    const first = err.stack?.split('\n')[1]?.trim() ?? '';
    return `${err.name}:${err.message.slice(0, 80)}:${first.slice(0, 80)}`;
  }
  return String(err).slice(0, 200);
}

function extractMessage(err: unknown): { message: string; stack: string | null } {
  if (err instanceof Error) {
    return { message: err.message || err.name, stack: err.stack ?? null };
  }
  if (typeof err === 'string') return { message: err, stack: null };
  try {
    return { message: JSON.stringify(err).slice(0, 500), stack: null };
  } catch {
    return { message: 'unknown error', stack: null };
  }
}

export async function reportError(args: ReportArgs): Promise<void> {
  try {
    const fp = fingerprint(args.error);
    const now = Date.now();
    const lastSeen = recentlyReported.get(fp);
    if (lastSeen && now - lastSeen < COOLDOWN_MS) return;
    recentlyReported.set(fp, now);
    // 맵이 너무 커지지 않게 주기적 정리
    if (recentlyReported.size > 200) {
      for (const [k, v] of recentlyReported) {
        if (now - v > COOLDOWN_MS * 2) recentlyReported.delete(k);
      }
    }

    const { message, stack } = extractMessage(args.error);
    const supabase = createClient();
    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {}

    const payload = {
      user_id: userId,
      source: args.source ?? 'web',
      level: args.level ?? 'error',
      message: message.slice(0, 2000),
      stack: stack ? stack.slice(0, 8000) : null,
      context: args.context ? (args.context as Record<string, unknown>) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
      url: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : null,
    };
    await supabase.from('client_errors').insert(payload);
  } catch {
    // 에러 보고 실패는 조용히 무시
  }
}

/**
 * 브라우저 전역 에러 핸들러 설치. 앱 부트 시 한 번만 호출.
 */
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;
  // 중복 설치 방지
  const w = window as Window & { __acpErrorHandlersInstalled?: boolean };
  if (w.__acpErrorHandlersInstalled) return;
  w.__acpErrorHandlersInstalled = true;

  window.addEventListener('error', (ev) => {
    reportError({
      error: ev.error ?? new Error(ev.message),
      source: 'web',
      context: { filename: ev.filename, lineno: ev.lineno, colno: ev.colno },
    });
  });

  window.addEventListener('unhandledrejection', (ev) => {
    reportError({
      error: ev.reason,
      source: 'web',
      context: { kind: 'unhandledrejection' },
    });
  });
}
