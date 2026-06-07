'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  Search,
  Star,
  Clock,
  CornerDownLeft,
  ArrowRightLeft,
  GitCompare,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
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
import { isChoseongQuery, toChoseong } from '@/lib/tools/search';
import { CONVERT_INDEX, COMPARE_INDEX, USECASE_INDEX } from '@/lib/search-index.generated';
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
const MAX_EXTRA = 6;

/** 팔레트가 다루는 모든 이동 대상의 공통 형태 (도구·변환·비교·활용법). */
type PaletteItem = {
  key: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type Section = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  items: PaletteItem[];
};

function toolToItem(t: ToolMeta): PaletteItem {
  return {
    key: `tool-${t.id}`,
    title: t.title,
    subtitle: t.description,
    href: t.href,
    icon: t.icon,
    badge: CATEGORY_LABELS[t.category],
  };
}

/** 변환·비교·활용법을 한 번만 인덱싱 (검색용 haystack 동봉). */
type ExtraEntry = PaletteItem & { hay: string; cho: string };

const EXTRA_CONVERTS: ExtraEntry[] = CONVERT_INDEX.map((e) => {
  const title = `${e.label} 변환`;
  const hay = `${title} ${e.slug} ${e.from} ${e.to} convert 변환`.toLowerCase();
  return {
    key: `cv-${e.slug}`,
    title,
    href: `/convert/${e.slug}`,
    icon: ArrowRightLeft,
    badge: '변환',
    hay,
    cho: toChoseong(hay),
  };
});

const EXTRA_COMPARES: ExtraEntry[] = COMPARE_INDEX.map((e) => {
  const hay = `${e.h1} ${e.slug} ${e.keywords.join(' ')} 비교 vs`.toLowerCase();
  return {
    key: `cmp-${e.slug}`,
    title: e.h1,
    href: `/compare/${e.slug}`,
    icon: GitCompare,
    badge: '비교',
    hay,
    cho: toChoseong(hay),
  };
});

const EXTRA_USECASES: ExtraEntry[] = USECASE_INDEX.map((e) => {
  const hay = `${e.h1} ${e.slug} ${e.keywords.join(' ')} 활용법`.toLowerCase();
  return {
    key: `uc-${e.slug}`,
    title: e.h1,
    subtitle: e.description,
    href: `/use/${e.slug}`,
    icon: Wrench,
    badge: '활용법',
    hay,
    cho: toChoseong(hay),
  };
});

/** 토큰 AND 매칭 — 부분일치 + 한글 초성. */
function matchEntry(e: ExtraEntry, tokens: string[]): boolean {
  return tokens.every(
    (tk) => e.hay.includes(tk) || (isChoseongQuery(tk) && e.cho.includes(tk)),
  );
}

function searchExtras(entries: ExtraEntry[], tokens: string[]): PaletteItem[] {
  if (tokens.length === 0) return [];
  return entries
    .filter((e) => matchEntry(e, tokens))
    .slice(0, MAX_EXTRA)
    .map(({ hay: _hay, cho: _cho, ...item }) => item);
}

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
      out.push({
        key: 'shortcuts',
        label: '바로가기',
        items: [
          { key: 'sc-convert', title: '파일 변환 모음', subtitle: 'PNG·JPG·WebP·HEIC·PDF…', href: '/convert', icon: ArrowRightLeft, badge: '변환' },
          { key: 'sc-compare', title: '도구 비교', subtitle: '헷갈리는 포맷·도구를 나란히', href: '/compare', icon: GitCompare, badge: '비교' },
          { key: 'sc-use', title: '활용법', subtitle: '자주 하는 작업을 단계별로', href: '/use', icon: Wrench, badge: '활용법' },
        ],
      });
      if (favTools.length > 0) {
        out.push({
          key: 'favorites',
          label: '즐겨찾기',
          icon: <Star className="h-3.5 w-3.5" />,
          items: favTools.map(toolToItem),
        });
      }
      if (recentTools.length > 0) {
        out.push({
          key: 'recent',
          label: '최근 사용',
          icon: <Clock className="h-3.5 w-3.5" />,
          items: recentTools.map(toolToItem),
        });
      }
      for (const cat of CATEGORY_ORDER) {
        const list = grouped.get(cat);
        if (!list || list.length === 0) continue;
        out.push({ key: cat, label: CATEGORY_LABELS[cat], items: list.map(toolToItem) });
      }
      return out;
    }

    // 검색 중: 도구 + 변환 + 비교 + 활용법 버킷
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    const out: Section[] = [];

    const toolResults = filterTools(trimmed, 'all')
      .filter((t) => t.status === 'ready')
      .slice(0, MAX_RESULTS)
      .map(toolToItem);
    if (toolResults.length > 0) {
      out.push({ key: 'tools', label: `도구 ${toolResults.length}개`, items: toolResults });
    }

    const convertResults = searchExtras(EXTRA_CONVERTS, tokens);
    if (convertResults.length > 0) {
      out.push({
        key: 'converts',
        label: '변환',
        icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
        items: convertResults,
      });
    }
    const compareResults = searchExtras(EXTRA_COMPARES, tokens);
    if (compareResults.length > 0) {
      out.push({
        key: 'compares',
        label: '비교',
        icon: <GitCompare className="h-3.5 w-3.5" />,
        items: compareResults,
      });
    }
    const useResults = searchExtras(EXTRA_USECASES, tokens);
    if (useResults.length > 0) {
      out.push({
        key: 'usecases',
        label: '활용법',
        icon: <Wrench className="h-3.5 w-3.5" />,
        items: useResults,
      });
    }
    return out;
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
    const el = list.querySelector<HTMLElement>(`[data-cmdk-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const navigateTo = useCallback((item: PaletteItem) => {
    setOpen(false);
    window.location.assign(item.href);
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
          이름·키워드로 도구·변환·비교·활용법을 검색하고 Enter 키로 이동합니다.
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
            placeholder="도구·변환·활용법 검색…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="검색"
            aria-autocomplete="list"
            aria-controls="cmdk-listbox"
            aria-activedescendant={
              flat[activeIndex] ? `cmdk-item-${flat[activeIndex].key}` : undefined
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
              {section.items.map((item) => {
                const idx = cursor++;
                const active = idx === activeIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    id={`cmdk-item-${item.key}`}
                    role="option"
                    aria-selected={active}
                    data-cmdk-index={idx}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => navigateTo(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    {item.badge && (
                      <span className="hidden shrink-0 rounded border bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
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
