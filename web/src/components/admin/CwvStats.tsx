'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Trash2 } from 'lucide-react';
import {
  aggregate,
  clearStore,
  formatMetric,
  readStore,
  CWV_GOOD,
  CWV_POOR,
  type CwvAggregate,
  type CwvMetricName,
} from '@/lib/cwv';
import { cn } from '@/lib/utils';

/**
 * Admin panel: real-user Core Web Vitals (p75) collected on this device.
 * Privacy-first RUM — data lives only in this browser's localStorage.
 *
 * 하이드레이션 안전: 초기 렌더는 빈 rows(결정적)이고, 마운트 후 useEffect 에서만
 * localStorage 를 읽어 채운다(readStore 는 자체 try/catch — 시크릿 모드 안전).
 */

const RATING_CLS: Record<string, string> = {
  good: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
  'needs-improvement': 'text-amber-700 dark:text-amber-400 bg-amber-500/10',
  poor: 'text-rose-700 dark:text-rose-400 bg-rose-500/10',
};

/** 막대(p75 바)용 진한 색 — 등급별. */
const RATING_BAR: Record<string, string> = {
  good: 'bg-emerald-500',
  'needs-improvement': 'bg-amber-500',
  poor: 'bg-rose-500',
};

/** 등급 한국어 라벨. */
const RATING_LABEL: Record<string, string> = {
  good: '좋음',
  'needs-improvement': '개선 필요',
  poor: '나쁨',
};

const METRIC_HINT: Record<string, string> = {
  LCP: 'Largest Contentful Paint',
  INP: 'Interaction to Next Paint',
  CLS: 'Cumulative Layout Shift',
  FCP: 'First Contentful Paint',
  TTFB: 'Time to First Byte',
};

/** "좋음 ≤ X" 임계값 안내 문자열. */
function goodThresholdLabel(name: CwvMetricName): string {
  return `좋음 ≤ ${formatMetric(name, CWV_GOOD[name])}`;
}

export function CwvStats() {
  const [rows, setRows] = useState<CwvAggregate[]>([]);

  function load() {
    setRows(aggregate(readStore()));
  }

  useEffect(() => {
    // 마운트 후 localStorage 읽기(하이드레이션 안전). 의도된 1회 주입.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            {rows.map((r) => {
              // p75 를 "나쁨" 경계 기준 비율로 환산해 막대를 채운다(0~100%, 100%=poor 경계).
              const fill =
                r.p75 === null
                  ? 0
                  : Math.min(100, Math.round((r.p75 / CWV_POOR[r.name]) * 100));
              return (
                <div key={r.name} className="rounded-lg border bg-card p-3 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-semibold" title={METRIC_HINT[r.name]}>
                      {r.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      n={r.count}
                    </span>
                  </div>
                  <div className="text-base font-bold tabular-nums">
                    {r.p75 === null ? '—' : formatMetric(r.name, r.p75)}
                  </div>
                  {r.rating ? (
                    <>
                      <span
                        className={cn(
                          'inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                          RATING_CLS[r.rating],
                        )}
                      >
                        {RATING_LABEL[r.rating]}
                      </span>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        title={`p75 ${formatMetric(r.name, r.p75!)} / 나쁨 경계 ${formatMetric(
                          r.name,
                          CWV_POOR[r.name],
                        )}`}
                      >
                        <div
                          className={cn('h-full rounded-full', RATING_BAR[r.rating])}
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="inline-block text-[10px] text-muted-foreground">
                      표본 없음
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground">{goodThresholdLabel(r.name)}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            총 {total}개 샘플 · 지표별 최근 50개까지 보관 · 이 브라우저에만 저장됩니다(서버 전송 없음).
          </p>
        </>
      )}
    </section>
  );
}
