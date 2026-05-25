'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Search, Star, Clock, CornerDownLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useFavorites, useRecent } from '@/lib/hooks/useUsage';
import {
  CATEGORY_LABELS,
  filterTools,
  TOOLS,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools/registry';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER: ToolCategory[] = [
  'image',
  'pdf',
  'video',
  'gif',
  'audio',
  'docs',
  'text',
  'dev',
  'util',
  'security',
  'ai',
];

const MAX_RESULTS = 40;

type Section = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  items: ToolMeta[];
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { favorites } = useFavorites();
  const recent = useRecent();

  /* 글로벌 단축키 + 커스텀 이벤트 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const openHandler = () => setOpen(true);
    window.addEventListener('keydown', handler);
    window.addEventListener('webtoolkit:open-palette', openHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('webtoolkit:open-palette', openHandler);
    };
  }, []);

  /* 열릴 때 검색어/포커스 초기화 */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    // 다음 프레임에 포커스 (Dialog 마운트 후)
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  /* 검색·정렬·섹션 구성 */
  const sections = useMemo<Section[]>(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      const toolById = new Map(TOOLS.map((t) => [t.id, t]));
      const favTools = [...favorites]
        .map((id) => toolById.get(id))
        .filter((t): t is ToolMeta => !!t && t.status === 'ready');

      const recentTools = recent
        .filter((r) => !favorites.has(r.id))
        .map((r) => toolById.get(r.id))
        .filter((t): t is ToolMeta => !!t && t.status === 'ready')
        .slice(0, 8);

      const usedIds = new Set([
        ...favTools.map((t) => t.id),
        ...recentTools.map((t) => t.id),
      ]);

      const grouped = new Map<ToolCategory, ToolMeta[]>();
      for (const t of TOOLS) {
        if (t.status !== 'ready') continue;
        if (usedIds.has(t.id)) continue;
        const arr = grouped.get(t.category) ?? [];
        arr.push(t);
        grouped.set(t.category, arr);
      }
      for (const [, list] of grouped) {
        list.sort((a, b) => a.phase - b.phase);
      }

      const out: Section[] = [];
      if (favTools.length > 0) {
        out.push({
          key: 'favorites',
          label: '즐겨찾기',
          icon: <Star className="h-3.5 w-3.5" />,
          items: favTools,
        });
      }
      if (recentTools.length > 0) {
        out.push({
          key: 'recent',
          label: '최근 사용',
          icon: <Clock className="h-3.5 w-3.5" />,
          items: recentTools,
        });
      }
      for (const cat of CATEGORY_ORDER) {
        const list = grouped.get(cat);
        if (!list || list.length === 0) continue;
        out.push({
          key: cat,
          label: CATEGORY_LABELS[cat],
          items: list,
        });
      }
      return out;
    }

    // 검색 중: 단일 섹션 (관련성 순)
    const results = filterTools(trimmed, 'all')
      .filter((t) => t.status === 'ready')
      .slice(0, MAX_RESULTS);
    if (results.length === 0) return [];
    return [{ key: 'results', label: `결과 ${results.length}개`, items: results }];
  }, [query, favorites, recent]);

  /* 평탄화된 인덱스 (키보드 네비용) */
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(Math.max(0, flat.length - 1));
  }, [flat.length, activeIndex]);

  /* 활성 항목을 viewport 안으로 스크롤 */
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(
      `[data-cmdk-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const navigateTo = useCallback((tool: ToolMeta) => {
    setOpen(false);
    // SPA 라우팅 대신 정적 export 호환을 위해 a href 동일하게 location.assign
    window.location.assign(tool.href);
  }, []);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (flat.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flat.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const t = flat[activeIndex];
        if (t) navigateTo(t);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(flat.length - 1);
      }
    },
    [flat, activeIndex, navigateTo],
  );

  /* 섹션 평탄화 인덱스 매핑 */
  let cursor = 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[12vh] max-w-xl translate-y-0 gap-0 p-0 md:top-[18vh]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">도구 검색</DialogTitle>
        <DialogDescription className="sr-only">
          이름·키워드로 도구를 검색하고 Enter 키로 이동합니다.
        </DialogDescription>

        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="도구 검색…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="도구 검색"
            aria-autocomplete="list"
            aria-controls="cmdk-listbox"
            aria-activedescendant={
              flat[activeIndex] ? `cmdk-item-${flat[activeIndex].id}` : undefined
            }
          />
          <kbd className="hidden h-5 select-none items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          id="cmdk-listbox"
          role="listbox"
          aria-label="검색 결과"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {sections.length === 0 && (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              검색 결과 없음
            </div>
          )}

          {sections.map((section) => (
            <div key={section.key} className="mb-2 last:mb-0">
              <div className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {section.icon}
                <span>{section.label}</span>
              </div>
              {section.items.map((tool) => {
                const idx = cursor++;
                const active = idx === activeIndex;
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    id={`cmdk-item-${tool.id}`}
                    role="option"
                    aria-selected={active}
                    data-cmdk-index={idx}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => navigateTo(tool)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{tool.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                    <span className="hidden shrink-0 rounded border bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
                      {CATEGORY_LABELS[tool.category]}
                    </span>
                    {active && (
                      <CornerDownLeft
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1">↑</kbd>
              <kbd className="rounded border bg-background px-1">↓</kbd>
              이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1">↵</kbd>
              선택
            </span>
          </div>
          <span className="hidden md:inline">
            <kbd className="rounded border bg-background px-1">⌘</kbd>
            <kbd className="ml-1 rounded border bg-background px-1">K</kbd> 어디서나
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
