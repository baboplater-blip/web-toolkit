'use client';

import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { basename } from '@/lib/tools/folder-batch';

export interface BatchProgressPanelProps {
  done: number;
  total: number;
  current: string;
  onCancel: () => void;
  /** 헤더 라벨 — 기본 "처리 중" */
  label?: string;
  /** 취소 요청됨 — 버튼 비활성 + "취소 중..." 표시 */
  cancelling?: boolean;
}

/**
 * 폴더/파일 일괄 처리 진행률 + 취소 버튼.
 * AbortController 와 함께 사용 — 도구 페이지에서 ctrl.abort() 를 onCancel 에 연결.
 */
export function BatchProgressPanel({
  done,
  total,
  current,
  onCancel,
  label = '처리 중',
  cancelling = false,
}: BatchProgressPanelProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const display = current ? basename(current) : '';

  return (
    <div
      className="rounded-xl border bg-card p-3 space-y-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            {label}
          </span>
          <span className="text-xs tabular-nums shrink-0">
            {done}/{total}
          </span>
          {display && (
            <span
              className="text-[11px] text-muted-foreground truncate font-mono"
              title={current}
            >
              {display}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={onCancel}
          disabled={cancelling}
          aria-label="처리 취소"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          {cancelling ? '취소 중...' : '취소'}
        </Button>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
