/**
 * Error tracking — privacy-first, browser-only (Phase δ).
 *
 * Mission constraint: no server, no API routes, nothing uploaded. So instead of
 * beaconing exceptions to an error backend (Sentry etc.), we keep a small
 * rolling window of *redacted* error signatures in localStorage. The /admin
 * page reads the aggregate so the operator can spot real-user crashes that
 * synthetic checks miss — without any data leaving the device.
 *
 * PII safety: we never store user input or file contents. Messages are
 * redacted (emails, long digit runs, data:/blob: URLs, query strings stripped)
 * and truncated. Sources keep only the script basename, not full URLs. Identical
 * signatures are de-duplicated with a count + last-seen timestamp.
 */

export interface ErrorSample {
  /** redacted, truncated message */
  m: string;
  /** error name (TypeError, …) or 'Error' / 'unhandledrejection' */
  n: string;
  /** script basename (no origin/query) */
  s: string;
  /** line:col, when known */
  l: string;
  /** pathname where it happened (no query/hash) */
  p: string;
  /** occurrence count for this signature */
  c: number;
  /** first seen (epoch ms) */
  f: number;
  /** last seen (epoch ms) */
  t: number;
}

const STORAGE_KEY = 'webtoolkit/errors/v1';
const MAX_SIGNATURES = 40;
const MSG_MAX = 200;

/** Cross-origin script errors and known-benign noise we deliberately drop. */
const IGNORE = [
  /^Script error\.?$/i,
  /ResizeObserver loop/i,
  /Non-Error promise rejection captured/i,
];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Strip anything that could carry PII or break grouping. */
export function redactMessage(raw: string): string {
  let msg = String(raw ?? '');
  msg = msg
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>') // emails
    .replace(/\b(?:blob|data):[^\s"')]+/gi, '<url>') // blob:/data: URLs
    .replace(/https?:\/\/[^\s"')]+/gi, (u) => u.split('?')[0]) // strip query from URLs
    .replace(/\?[^\s"')]+/g, '') // bare query strings
    .replace(/\b\d{6,}\b/g, '<num>'); // long digit runs (ids, card-ish)
  if (msg.length > MSG_MAX) msg = msg.slice(0, MSG_MAX) + '…';
  return msg.trim();
}

/** Keep only the script basename — drop origin, path and query. */
function basename(source: string): string {
  if (!source) return '';
  try {
    const u = new URL(source, 'http://x');
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || u.pathname;
  } catch {
    return source.split('/').pop()?.split('?')[0] ?? source;
  }
}

export function readErrors(): ErrorSample[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ErrorSample[]) : [];
  } catch {
    return [];
  }
}

export function clearErrors(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota/security errors */
  }
}

export interface RawError {
  message: string;
  name?: string;
  source?: string;
  lineno?: number;
  colno?: number;
}

/** Record one error occurrence, de-duplicated by signature. */
export function recordError(raw: RawError): void {
  if (!isBrowser()) return;
  const message = redactMessage(raw.message);
  if (!message || IGNORE.some((re) => re.test(message))) return;

  const name = (raw.name || 'Error').slice(0, 40);
  const s = basename(raw.source || '');
  const l = raw.lineno ? `${raw.lineno}:${raw.colno ?? 0}` : '';
  const p =
    typeof window !== 'undefined' ? window.location.pathname : '/';
  const now = Date.now();

  const list = readErrors();
  const sig = `${name}|${message}|${s}|${l}|${p}`;
  const existing = list.find(
    (e) => `${e.n}|${e.m}|${e.s}|${e.l}|${e.p}` === sig,
  );

  if (existing) {
    existing.c += 1;
    existing.t = now;
  } else {
    list.push({ m: message, n: name, s, l, p, c: 1, f: now, t: now });
  }

  // Keep the most-recently-seen MAX_SIGNATURES signatures.
  list.sort((a, b) => b.t - a.t);
  const trimmed = list.slice(0, MAX_SIGNATURES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota/security errors */
  }
}

/**
 * 활성 구독자 수. 한 번에 한 쌍의 리스너만 붙도록 refcount 로 관리한다.
 * boolean 싱글톤은 cleanup 이 모듈 플래그를 영구히 false 로 되돌려, StrictMode
 * 더블 마운트나 재마운트 후 추적이 죽어버리는 문제가 있었다. refcount 는
 * mount→unmount→mount 를 정확히 견딘다(0→1 에서 설치, 1→0 에서 해제).
 */
let refCount = 0;
let teardownListeners: (() => void) | null = null;

/** Install global error + unhandledrejection listeners (refcounted). */
export function initErrorTracking(): () => void {
  if (!isBrowser()) return () => {};

  refCount += 1;
  // 이미 설치돼 있으면 카운트만 올리고, 해제 시 카운트만 내린다.
  if (refCount > 1) {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      decrementRefCount();
    };
  }

  const onError = (event: ErrorEvent) => {
    recordError({
      message: event.message || event.error?.message || 'Unknown error',
      name: event.error?.name,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';
    recordError({
      message,
      name: reason instanceof Error ? reason.name : 'unhandledrejection',
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  teardownListeners = () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    teardownListeners = null;
  };

  let released = false;
  return () => {
    if (released) return;
    released = true;
    decrementRefCount();
  };
}

/** 구독자 수를 줄이고, 마지막 구독자가 떠나면 실제 리스너를 해제한다. */
function decrementRefCount(): void {
  if (refCount === 0) return;
  refCount -= 1;
  if (refCount === 0 && teardownListeners) {
    teardownListeners();
  }
}
