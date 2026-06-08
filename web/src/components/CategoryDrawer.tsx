'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolCategory,
} from '@/lib/tools/registry';
import { SUPER_CATEGORIES } from '@/lib/tools/super-categories';
import { cn } from '@/lib/utils';

/**
 * 카테고리 드로어 — 모바일 하단 탭바·데스크탑 레일의 "카테고리" 버튼이
 * `webtoolkit:open-category-drawer` 이벤트로 연다. CommandPalette 의
 * 이벤트 구독 패턴을 그대로 따른다.
 *
 * SUPER_CATEGORIES 를 순회해 슈퍼카테고리 헤더(아이콘+label+blurb) 아래에
 * 세부 카테고리 칩(라벨 + ready 도구 개수 배지)을 나열한다. 각 칩은
 * `/tools?category={cat}` 로 이동하며, 이동 시 드로어를 닫는다.
 */

/** 세부 카테고리별 ready 도구 개수 (모듈 1회 집계). */
const READY_COUNT_BY_CATEGORY: Record<ToolCategory, number> = (() => {
  const counts = {} as Record<ToolCategory, number>;
  for (const tool of TOOLS) {
    if (tool.status !== 'ready') continue;
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
  }
  return counts;
})();

export function CategoryDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('webtoolkit:open-category-drawer', openHandler);
    return () => {
      window.removeEventListener(
        'webtoolkit:open-category-drawer',
        openHandler,
      );
    };
  }, []);

  const totalReady = useMemo(
    () => TOOLS.filter((t) => t.status === 'ready').length,
    [],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          // 모바일: 하단 바텀시트 — 풀폭·하단 정렬·상단만 둥글게(한 손 조작 친화).
          'left-0 right-0 bottom-0 top-auto w-full max-w-none translate-x-0 translate-y-0',
          'max-h-[85vh] rounded-b-none rounded-t-2xl gap-0 p-0',
          // 데스크탑(sm+): 기존 중앙 상단 다이얼로그 형태 복원.
          'sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-[12vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:rounded-xl',
        )}
        aria-label="카테고리 둘러보기"
      >
        <DialogTitle className="border-b px-5 py-4">
          카테고리 둘러보기
        </DialogTitle>
        <DialogDescription className="sr-only">
          슈퍼카테고리별로 묶인 세부 카테고리를 선택해 해당 도구 목록으로
          이동합니다.
        </DialogDescription>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* 전체 도구 바로가기 */}
          <a
            href="/tools"
            onClick={() => setOpen(false)}
            className="mb-4 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                전체 도구
              </span>
              <span className="block text-xs text-muted-foreground">
                {totalReady}개 도구를 한눈에
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </a>

          <div className="space-y-5">
            {SUPER_CATEGORIES.map((sc) => {
              const SuperIcon = sc.icon;
              return (
                <section key={sc.key} aria-label={sc.label}>
                  <div className="mb-2 flex items-start gap-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br',
                        sc.accent,
                      )}
                    >
                      <SuperIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">
                        {sc.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {sc.blurb}
                      </p>
                    </div>
                  </div>

                  <ul className="flex flex-wrap gap-2 pl-[2.625rem]">
                    {sc.categories.map((cat) => {
                      const count = READY_COUNT_BY_CATEGORY[cat] ?? 0;
                      return (
                        <li key={cat}>
                          <a
                            href={`/tools?category=${cat}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <span>{CATEGORY_LABELS[cat]}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {count}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
