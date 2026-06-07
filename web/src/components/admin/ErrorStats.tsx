'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { clearErrors, readErrors, type ErrorSample } from '@/lib/error-tracking';

/**
 * Admin panel: real-user JavaScript errors captured on this device.
 * Privacy-first — redacted signatures live only in this browser's localStorage,
 * nothing is sent off-device (see lib/error-tracking.ts).
 */

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

  function load() {
    // 최근 발생 순으로 정렬해 보여준다.
    setRows([...readErrors()].sort((a, b) => b.t - a.t));
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    clearErrors();
    load();
  }

  const total = rows.reduce((sum, r) => sum + r.c, 0);

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
            aria-label="초기화"
            title="초기화"
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
          <ul className="space-y-2">
            {rows.map((e, i) => (
              <li key={`${e.n}-${e.l}-${i}`} className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    {e.n}
                  </span>
                  <span className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                    {e.c > 1 && <span className="rounded bg-rose-500/10 px-1.5 py-0.5">×{e.c}</span>}
                    {timeAgo(e.t)}
                  </span>
                </div>
                <p className="text-[12px] break-words">{e.m}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {e.p}
                  {e.s && ` · ${e.s}`}
                  {e.l && `:${e.l}`}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground">
            총 {total}회 · 시그니처 {rows.length}개(최근 40개 보관) · 이 브라우저에만 저장됩니다.
          </p>
        </>
      )}
    </section>
  );
}
