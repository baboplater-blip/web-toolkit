/**
 * Core Web Vitals — privacy-first, browser-only RUM.
 *
 * Mission constraint: no server, no API routes, nothing uploaded. So instead
 * of beaconing field data to an analytics backend, we keep a small rolling
 * window of samples in localStorage (per visitor, per device). The /admin
 * page reads the aggregate (p75 per metric) so the operator can spot real-user
 * regressions that synthetic Lighthouse runs miss.
 *
 * No PII is stored — only metric name, value, rating and the path. Each metric
 * keeps at most MAX_SAMPLES most-recent samples.
 */

export type CwvMetricName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

export interface CwvSample {
  /** metric value (ms, or unitless for CLS) */
  v: number;
  /** 'good' | 'needs-improvement' | 'poor' */
  r: string;
  /** pathname (no query/hash) */
  p: string;
  /** epoch ms */
  t: number;
}

export type CwvStore = Partial<Record<CwvMetricName, CwvSample[]>>;

const STORAGE_KEY = 'webtoolkit/cwv/v1';
const MAX_SAMPLES = 50;

/** "good" thresholds (Google CWV). LCP/FCP/TTFB/INP in ms, CLS unitless. */
export const CWV_GOOD: Record<CwvMetricName, number> = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
};

/** "needs improvement" upper bounds; above = poor. */
export const CWV_POOR: Record<CwvMetricName, number> = {
  LCP: 4000,
  INP: 500,
  CLS: 0.25,
  FCP: 3000,
  TTFB: 1800,
};

export const CWV_METRICS: CwvMetricName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

function read(): CwvStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CwvStore) : {};
  } catch {
    return {};
  }
}

export function recordSample(name: CwvMetricName, sample: CwvSample): void {
  try {
    const store = read();
    const list = store[name] ?? [];
    list.push(sample);
    // keep the most recent MAX_SAMPLES
    store[name] = list.slice(-MAX_SAMPLES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota — ignore */
  }
}

export function readStore(): CwvStore {
  return read();
}

export function clearStore(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 75th percentile of a numeric array (Google's field-data percentile). */
export function p75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(0.75 * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function ratingFor(name: CwvMetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= CWV_GOOD[name]) return 'good';
  if (value <= CWV_POOR[name]) return 'needs-improvement';
  return 'poor';
}

export interface CwvAggregate {
  name: CwvMetricName;
  p75: number | null;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  count: number;
}

export function aggregate(store: CwvStore): CwvAggregate[] {
  return CWV_METRICS.map((name) => {
    const samples = store[name] ?? [];
    const value = p75(samples.map((s) => s.v));
    return {
      name,
      p75: value,
      rating: value === null ? null : ratingFor(name, value),
      count: samples.length,
    };
  });
}

/** Format a metric value for display (CLS unitless, others ms→ms/s). */
export function formatMetric(name: CwvMetricName, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}
