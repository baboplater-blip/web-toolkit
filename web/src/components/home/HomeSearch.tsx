'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Search, CornerDownLeft, ArrowRight } from 'lucide-react';
import { filterTools, CATEGORY_LABELS, type ToolMeta } from '@/lib/tools/registry';

const MAX_SUGGESTIONS = 7;

/**
 * 홈 히어로의 즉시 검색 박스 + 자동완성 제안.
 *
 * 타이핑하면 퍼지 검색(filterTools, 한글 초성 포함)으로 상위 후보를 드롭다운에
 * 즉시 노출한다. 이전에는 "도구 둘러보기" 버튼을 눌러 /tools 로 가야만 검색이
 * 가능했다 — cold-start 전환 손실을 없애는 게 목적.
 *
 *   ↑↓  후보 이동   ·   Enter  선택(없으면 전체 검색)   ·   Esc  닫기/비우기
 */
export function HomeSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo<ToolMeta[]>(() => {
    const q = query.trim();
    if (q.length === 0) return [];
    return filterTools(q, 'all')
      .filter((t) => t.status === 'ready')
      .slice(0, MAX_SUGGESTIONS);
  }, [query]);

  const showPanel = open && query.trim().length > 0;

  /* 외부 클릭 시 패널 닫기 */
  useEffect(() => {
    if (!showPanel) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showPanel]);

  /* 활성 항목 viewport 안으로 */
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const goToSearch = () => {
    const q = query.trim();
    window.location.assign(q ? `/tools?q=${encodeURIComponent(q)}` : '/tools');
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = active >= 0 ? suggestions[active] : undefined;
      if (sel) window.location.assign(sel.href);
      else goToSearch();
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
        setActive(-1);
      } else {
        inputRef.current?.blur();
      }
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative mx-auto mt-8 max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="무엇을 하고 싶으세요? 예: PDF 합치기, 배경 제거…"
          aria-label="도구 검색"
          aria-expanded={showPanel}
          aria-controls="home-search-suggest"
          role="combobox"
          aria-autocomplete="list"
          className="h-12 w-full rounded-xl border bg-card/80 py-3.5 pl-12 pr-28 text-sm shadow-sm outline-none backdrop-blur transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={goToSearch}
          className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          검색
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {showPanel && (
        <div
          id="home-search-suggest"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover text-left shadow-lg"
        >
          {suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              일치하는 도구가 없습니다. <kbd className="rounded border bg-muted px-1">Enter</kbd> 로 전체 검색
            </div>
          ) : (
            <ul ref={listRef} role="listbox" aria-label="도구 제안" className="max-h-72 overflow-y-auto p-1.5">
              {suggestions.map((t, i) => {
                const Icon = t.icon;
                const sel = i === active;
                return (
                  <li key={t.id} data-idx={i} role="option" aria-selected={sel}>
                    <a
                      href={t.href}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        sel ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{t.title}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {t.description}
                        </span>
                      </span>
                      <span className="hidden shrink-0 rounded border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                        {CATEGORY_LABELS[t.category]}
                      </span>
                      {sel && (
                        <CornerDownLeft
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={goToSearch}
            className="flex w-full items-center justify-center gap-1.5 border-t bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            “{query.trim()}” 전체 결과 보기
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
