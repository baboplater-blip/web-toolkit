'use client';

import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToolHeaderProps {
  /** 도구 제목 (H1) */
  title: string;
  /** 초기화 핸들러 — 있으면 우측에 "초기화" 버튼 표시 */
  onReset?: () => void;
  /** 헤더 바 내부 폭 — 페이지 본문 max-w 와 맞춘다 (기본 max-w-3xl) */
  widthClass?: string;
  /** 우측 추가 액션 (초기화 버튼 왼쪽) */
  children?: ReactNode;
}

/**
 * 도구 페이지 공통 상단 헤더 — sticky + "도구 목록으로" 뒤로가기 + 제목 + (선택) 초기화.
 *
 * 헤더가 없던 간이형 도구에 일관된 내비게이션·초기화 동선을 부여하기 위한 공용 컴포넌트.
 * 페이지는 `<div className="min-h-dvh bg-background">` 로 감싸고 이 헤더를 본문 위에 둔다.
 * 표준형 도구(이미 sticky 헤더 보유)는 교체하지 않는다.
 */
export function ToolHeader({ title, onReset, widthClass = 'max-w-3xl', children }: ToolHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={cn('mx-auto flex items-center justify-between gap-2 px-4 py-3', widthClass)}>
        <div className="flex min-w-0 items-center gap-2">
          <a
            href="/tools"
            aria-label="도구 목록"
            title="도구 목록"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
        </div>
        {(children || onReset) && (
          <div className="flex shrink-0 items-center gap-1">
            {children}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                title="초기화"
                className="inline-flex h-8 items-center rounded-md border px-2.5 text-xs hover:bg-muted"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                초기화
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
