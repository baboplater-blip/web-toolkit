'use client';

/**
 * 도구 사용 이력 localStorage 유틸. 즐겨찾기 + 최근 사용을 관리.
 *
 * 같은 탭의 변경은 CustomEvent 로 광역 브로드캐스트하고, 다른 탭은 storage
 * 이벤트로 자동 수신. SSR/정적 export 호환을 위해 window 가드 필수.
 */

const FAVS_KEY = 'webtoolkit/favorites/v1';
const RECENT_KEY = 'webtoolkit/recent/v1';
const STATS_KEY = 'webtoolkit/stats/v1';
const RECENT_LIMIT = 12;

const FAVS_EVENT = 'webtoolkit:favorites';
const RECENT_EVENT = 'webtoolkit:recent';
const STATS_EVENT = 'webtoolkit:stats';

export interface RecentEntry {
  id: string;
  ts: number;
}

function readArr<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function emit(event: string, detail: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

/* ---------- favorites ---------- */

export function getFavorites(): string[] {
  return readArr<string>(FAVS_KEY);
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): string[] {
  if (typeof window === 'undefined') return [];
  const cur = new Set(getFavorites());
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  const next = [...cur];
  localStorage.setItem(FAVS_KEY, JSON.stringify(next));
  emit(FAVS_EVENT, next);
  return next;
}

/* ---------- recent ---------- */

export function getRecent(): RecentEntry[] {
  return readArr<RecentEntry>(RECENT_KEY);
}

export function recordRecent(id: string): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  const now = Date.now();
  const existing = getRecent().filter((e) => e.id !== id);
  const next = [{ id, ts: now }, ...existing].slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  emit(RECENT_EVENT, next);
  incrementUsage(id);
  return next;
}

export function clearRecent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECENT_KEY);
  emit(RECENT_EVENT, []);
}

/* ---------- usage stats (도구별 사용 횟수) ---------- */

export type UsageStats = Record<string, number>;

export function getUsageStats(): UsageStats {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return typeof v === 'object' && v !== null ? (v as UsageStats) : {};
  } catch {
    return {};
  }
}

export function incrementUsage(id: string): UsageStats {
  if (typeof window === 'undefined') return {};
  const stats = getUsageStats();
  stats[id] = (stats[id] ?? 0) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  emit(STATS_EVENT, stats);
  return stats;
}

export function clearUsageStats(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STATS_KEY);
  emit(STATS_EVENT, {});
}

/* ---------- event names (hooks 에서 재사용) ---------- */

export const USAGE_EVENTS = {
  FAVORITES: FAVS_EVENT,
  RECENT: RECENT_EVENT,
  STATS: STATS_EVENT,
} as const;
