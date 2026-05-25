'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListChecks,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolMeta,
} from '@/lib/tools/registry';
import { cn } from '@/lib/utils';

/**
 * 도구 페이지 하단에 자동으로 표시되는 네비게이션.
 *
 *   ← 이전 도구  |  같은 카테고리 (드롭다운)  |  다음 도구 →
 *
 * `usePathname()` 으로 현재 경로를 잡아 registry 에서 찾는다.
 * `/tools` 자체나 registry 에 없는 경로면 아무것도 렌더하지 않음.
 */
export function ToolNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 + Esc 키로 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const current = useMemo<ToolMeta | undefined>(() => {
    if (!pathname) return undefined;
    return TOOLS.find((t) => t.href === pathname);
  }, [pathname]);

  const siblings = useMemo<ToolMeta[]>(() => {
    if (!current) return [];
    return TOOLS.filter((t) => t.category === current.category && t.status === 'ready');
  }, [current]);

  if (!current) return null;
  if (siblings.length <= 1) return null;

  const idx = siblings.findIndex((t) => t.id === current.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <nav
      aria-label="도구 네비게이션"
      className="mx-auto max-w-3xl px-4 pb-8 pt-2"
    >
      <div className="rounded-xl border bg-card p-2 flex items-center gap-2">
        <a
          href={prev ? prev.href : '#'}
          aria-disabled={!prev}
          tabIndex={prev ? 0 : -1}
          className={cn(
            'flex items-center gap-1.5 h-9 px-2.5 rounded-md text-xs flex-1 min-w-0',
            prev ? 'hover:bg-muted' : 'opacity-40 pointer-events-none',
          )}
          title={prev ? prev.title : '이전 도구 없음'}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] text-muted-foreground">이전</p>
            <p className="truncate font-medium">{prev ? prev.title : '—'}</p>
          </div>
        </a>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-md text-[11px] bg-background hover:bg-muted border"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
            aria-label={`같은 카테고리 도구 (${CATEGORY_LABELS[current.category]} ${idx + 1}/${siblings.length})`}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{CATEGORY_LABELS[current.category]}</span>
            <span>
              {idx + 1}/{siblings.length}
            </span>
          </button>
          {menuOpen && (
            <div
              role="listbox"
              aria-label={`${CATEGORY_LABELS[current.category]} 도구 목록`}
              className="absolute right-0 bottom-full mb-2 w-64 max-h-80 overflow-y-auto rounded-lg border bg-popover shadow-lg z-20"
            >
              <div className="sticky top-0 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b bg-popover">
                {CATEGORY_LABELS[current.category]} ({siblings.length}개)
              </div>
              <ul className="py-1">
                {siblings.map((t) => (
                  <li key={t.id}>
                    <a
                      href={t.href}
                      role="option"
                      aria-selected={t.id === current.id}
                      aria-current={t.id === current.id ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted',
                        t.id === current.id && 'bg-primary/10 text-foreground font-medium',
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{t.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="border-t p-1">
                <a
                  href="/tools"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  전체 도구 허브
                </a>
              </div>
            </div>
          )}
        </div>

        <a
          href={next ? next.href : '#'}
          aria-disabled={!next}
          tabIndex={next ? 0 : -1}
          className={cn(
            'flex items-center gap-1.5 h-9 px-2.5 rounded-md text-xs flex-1 min-w-0 justify-end',
            next ? 'hover:bg-muted' : 'opacity-40 pointer-events-none',
          )}
          title={next ? next.title : '다음 도구 없음'}
        >
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] text-muted-foreground">다음</p>
            <p className="truncate font-medium">{next ? next.title : '—'}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}
