'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { clearErrors, readErrors, type ErrorSample } from '@/lib/error-tracking';
import { cn } from '@/lib/utils';

/**
 * Admin panel: real-user JavaScript errors captured on this device.
 * Privacy-first — redacted signatures live only in this browser's localStorage,
 * nothing is sent off-device (see lib/error-tracking.ts).
 *
 * 하이드레이션 안전: 초기 렌더는 빈 목록(결정적)·기본 정렬이고, 마운트 후
 * useEffect 에서만 readErrors() 로 localStorage 를 읽는다(자체 try/catch — 시크릿 모드 안전).
 */

type SortKey = 'recent' | 'count' | 'path';

const SORT_LABELS: Record<SortKey, string> = {
  recent: '최근 발생순',
  count: '횟수순',
  path: '경로순',
};

function timeAgo(t: number): string {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}초 전`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function ErrorStats() {
  const [rows, setRows] = useState<ErrorSample[]>([]);
  const [sort, setSort] = useState<SortKey>('recent');
  const [pathFilter, setPathFilter] = useState('');

  function load() {
    setRows(readErrors());
  }

  useEffect(() => {
    // 마운트 후 localStorage 읽기(하이드레이션 안전). 의도된 1회 주입.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function reset() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('이 브라우저에 저장된 에러 기록을 모두 비울까요?')
    ) {
      return;
    }
    clearErrors();
    load();
  }

  // 경로 필터 + 정렬은 화면 표시용 파생 상태 — 원본 데이터는 그대로 둔다.
  const visible = useMemo(() => {
    const q = pathFilter.trim().toLowerCase();
    const filtered = q ? rows.filter((e) => e.p.toLowerCase().includes(q)) : rows;
    const sorted = [...filtered];
    if (sort === 'count') sorted.sort((a, b) => b.c - a.c || b.t - a.t);
    else if (sort === 'path') sorted.sort((a, b) => a.p.localeCompare(b.p) || b.t - a.t);
    else sorted.sort((a, b) => b.t - a.t);
    return sorted;
  }, [rows, sort, pathFilter]);

  const totalOccurrences = rows.reduce((sum, r) => sum + r.c, 0);
  // 필터 적용 후 보이는 시그니처가 가진 횟수 합 — 필터 중일 때 맥락 제공.
  const visibleOccurrences = visible.reduce((sum, r) => sum + r.c, 0);

  // 경로 필터 자동완성용 고유 경로 목록.
  const paths = useMemo(
    () => [...new Set(rows.map((e) => e.p))].sort(),
    [rows],
  );

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          JS 에러 (이 기기 · 무PII)
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
            aria-label="데이터 비우기"
            title="데이터 비우기"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-4 text-[12px] text-muted-foreground">
          수집된 에러가 없습니다. 도구 사용 중 발생하는 JS 예외·미처리 Promise 거부가
          redaction(이메일·URL·긴 숫자 제거) 후 이 브라우저에만 누적됩니다 (서버 전송 없음).
        </p>
      ) : (
        <>
          {/* 정렬 + 경로 필터 컨트롤 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border bg-card p-0.5">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] font-medium transition-colors',
                    sort === k
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                  aria-pressed={sort === k}
                >
                  {SORT_LABELS[k]}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              placeholder="경로 필터 (예: /tools/pdf)"
              list="error-paths"
              className="h-7 flex-1 min-w-[140px] rounded-md border bg-background px-2 text-[11px]"
              aria-label="경로 필터"
            />
            <datalist id="error-paths">
              {paths.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {pathFilter && (
              <button
                type="button"
                onClick={() => setPathFilter('')}
                className="text-[11px] text-primary hover:underline"
              >
                필터 해제
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-card p-4 text-[12px] text-muted-foreground">
              &ldquo;{pathFilter}&rdquo; 경로와 일치하는 에러가 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((e, i) => (
                <li key={`${e.n}-${e.p}-${e.l}-${i}`} className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                      {e.n}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-700 dark:text-rose-400">
                        ×{e.c}
                      </span>
                      {timeAgo(e.t)}
                    </span>
                  </div>
                  <p className="text-[12px] break-words">{e.m}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums break-all">
                    {e.p}
                    {e.s && ` · ${e.s}`}
                    {e.l && `:${e.l}`}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] text-muted-foreground">
            {pathFilter ? (
              <>
                필터 {visible.length}개 시그니처 · {visibleOccurrences}회 / 전체 {rows.length}개 ·{' '}
                {totalOccurrences}회 · 이 브라우저에만 저장됩니다.
              </>
            ) : (
              <>
                총 {totalOccurrences}회 · 시그니처 {rows.length}개(최근 40개 보관) · 이 브라우저에만
                저장됩니다.
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}
