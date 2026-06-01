'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Trash2 } from 'lucide-react';
import {
  aggregate,
  clearStore,
  formatMetric,
  readStore,
  type CwvAggregate,
} from '@/lib/cwv';
import { cn } from '@/lib/utils';

/**
 * Admin panel: real-user Core Web Vitals (p75) collected on this device.
 * Privacy-first RUM — data lives only in this browser's localStorage.
 */

const RATING_CLS: Record<string, string> = {
  good: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
  'needs-improvement': 'text-amber-700 dark:text-amber-400 bg-amber-500/10',
  poor: 'text-rose-700 dark:text-rose-400 bg-rose-500/10',
};

const METRIC_HINT: Record<string, string> = {
  LCP: 'Largest Contentful Paint',
  INP: 'Interaction to Next Paint',
  CLS: 'Cumulative Layout Shift',
  FCP: 'First Contentful Paint',
  TTFB: 'Time to First Byte',
};

export function CwvStats() {
  const [rows, setRows] = useState<CwvAggregate[]>([]);

  function load() {
    setRows(aggregate(readStore()));
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    clearStore();
    load();
  }

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" aria-hidden />
          Core Web Vitals (이 기기 실측 p75)
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={load}
            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
            aria-label="새로고침"
            title="새로고침"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground"
            aria-label="초기화"
            title="초기화"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </h2>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-4 text-[12px] text-muted-foreground">
          아직 수집된 샘플이 없습니다. 사이트를 둘러보면 이 기기의 LCP·INP·CLS·FCP·TTFB
          가 localStorage 에 누적됩니다 (서버 전송 없음).
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {rows.map((r) => (
              <div key={r.name} className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-semibold" title={METRIC_HINT[r.name]}>
                    {r.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">n={r.count}</span>
                </div>
                <div className="text-base font-bold tabular-nums">
                  {r.p75 === null ? '—' : formatMetric(r.name, r.p75)}
                </div>
                {r.rating && (
                  <span
                    className={cn(
                      'inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                      RATING_CLS[r.rating],
                    )}
                  >
                    {r.rating}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            총 {total}개 샘플 · 지표별 최근 50개까지 보관 · 이 브라우저에만 저장됩니다.
          </p>
        </>
      )}
    </section>
  );
}
