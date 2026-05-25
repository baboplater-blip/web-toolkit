'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolMeta,
} from '@/lib/tools/registry';
import { cn } from '@/lib/utils';

const NEW_BADGE_DAYS = 14;

function isRecentlyAdded(addedAt: string | undefined): boolean {
  if (!addedAt) return false;
  const t = Date.parse(addedAt);
  if (Number.isNaN(t)) return false;
  const days = (Date.now() - t) / 86_400_000;
  return days >= 0 && days < NEW_BADGE_DAYS;
}

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
  const listRef = useRef<HTMLUListElement>(null);

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

  const idx = current ? siblings.findIndex((t) => t.id === current.id) : -1;
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  // Alt+←/→ 단축키로 이전/다음 도구 이동 (입력 필드에서는 비활성)
  useEffect(() => {
    if (!current) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      const inEditable =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (inEditable) return;
      if (e.key === 'ArrowLeft' && prev) {
        e.preventDefault();
        window.location.href = prev.href;
      } else if (e.key === 'ArrowRight' && next) {
        e.preventDefault();
        window.location.href = next.href;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, prev, next]);

  // 메뉴 열릴 때 현재 도구 항목으로 자동 스크롤
  useEffect(() => {
    if (!menuOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'center' });
    }
  }, [menuOpen]);

  if (!current) return null;
  if (siblings.length <= 1) return null;

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
          title={prev ? `${prev.title} (Alt+←)` : '이전 도구 없음'}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] text-muted-foreground">이전</p>
            <p className="truncate font-medium flex items-center gap-1">
              <span className="truncate">{prev ? prev.title : '—'}</span>
              {prev && isRecentlyAdded(prev.addedAt) && (
                <Sparkles
                  className="h-2.5 w-2.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="NEW"
                />
              )}
            </p>
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
              <ul className="py-1" ref={listRef}>
                {siblings.map((t) => {
                  const isNew = isRecentlyAdded(t.addedAt);
                  return (
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
                        <span className="truncate flex-1">{t.title}</span>
                        {isNew && (
                          <span
                            className="shrink-0 inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 py-px text-[9px] font-semibold text-emerald-700 dark:text-emerald-400"
                            title="최근 추가"
                          >
                            <Sparkles className="h-2 w-2" aria-hidden />
                            NEW
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
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
          title={next ? `${next.title} (Alt+→)` : '다음 도구 없음'}
        >
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] text-muted-foreground">다음</p>
            <p className="truncate font-medium flex items-center justify-end gap-1">
              {next && isRecentlyAdded(next.addedAt) && (
                <Sparkles
                  className="h-2.5 w-2.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="NEW"
                />
              )}
              <span className="truncate">{next ? next.title : '—'}</span>
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}
