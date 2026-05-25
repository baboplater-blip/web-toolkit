'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownAZ,
  Clock,
  Keyboard,
  LayoutGrid,
  ListOrdered,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolCard } from '@/components/tools/ToolCard';
import {
  CATEGORY_LABELS,
  filterTools,
  TOOLS,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools/registry';
import { useFavorites, useRecent } from '@/lib/hooks/useUsage';
import { cn } from '@/lib/utils';

const CATEGORIES: (ToolCategory | 'all')[] = [
  'all',
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

type SortKey = 'relevance' | 'name' | 'phase';
const SORT_LABELS: Record<SortKey, string> = {
  relevance: '기본',
  name: '이름순',
  phase: '신규순',
};

const SORT_STORAGE_KEY = 'webtoolkit:hub:sort';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
).replace(/\/$/, '');

const ITEM_LIST_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Web Toolkit 도구 목록',
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  numberOfItems: TOOLS.filter((t) => t.status === 'ready').length,
  itemListElement: TOOLS.filter((t) => t.status === 'ready').map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}${t.href}`,
    name: t.title,
  })),
};

export default function ToolsHubPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');
  const [showHelp, setShowHelp] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('relevance');

  const { favorites, toggle, isFavorite } = useFavorites();
  const recent = useRecent();

  const searchRef = useRef<HTMLInputElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);

  /* 카테고리별 ready 도구 개수 (배지에 표시) */
  const categoryCounts = useMemo(() => {
    const m = new Map<ToolCategory | 'all', number>();
    let total = 0;
    for (const t of TOOLS) {
      if (t.status !== 'ready') continue;
      total++;
      m.set(t.category, (m.get(t.category) ?? 0) + 1);
    }
    m.set('all', total);
    return m;
  }, []);

  /* 정렬 키 로드/저장 */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (saved === 'relevance' || saved === 'name' || saved === 'phase') {
      setSortKey(saved);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SORT_STORAGE_KEY, sortKey);
  }, [sortKey]);

  const tools = useMemo(() => {
    const result = filterTools(query, category);
    if (sortKey === 'name') {
      const c = new Intl.Collator('ko');
      return [...result].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
        return c.compare(a.title, b.title);
      });
    }
    if (sortKey === 'phase') {
      return [...result].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
        return b.phase - a.phase;
      });
    }
    return result;
  }, [query, category, sortKey]);
  const readyCount = tools.filter((t) => t.status === 'ready').length;
  const plannedCount = tools.length - readyCount;

  const isSearching = query.trim().length > 0;
  const isFiltered = category !== 'all';

  /* 즐겨찾기 도구 (검색·필터 없을 때만 노출) */
  const favoriteTools = useMemo<ToolMeta[]>(() => {
    if (isSearching || isFiltered) return [];
    if (favorites.size === 0) return [];
    const map = new Map(TOOLS.map((t) => [t.id, t]));
    return [...favorites]
      .map((id) => map.get(id))
      .filter((t): t is ToolMeta => t !== undefined && t.status === 'ready');
  }, [favorites, isSearching, isFiltered]);

  /* 최근 사용 도구 (즐겨찾기와 중복 제외) */
  const recentTools = useMemo<ToolMeta[]>(() => {
    if (isSearching || isFiltered) return [];
    if (recent.length === 0) return [];
    const map = new Map(TOOLS.map((t) => [t.id, t]));
    return recent
      .filter((e) => !favorites.has(e.id))
      .map((e) => map.get(e.id))
      .filter((t): t is ToolMeta => t !== undefined && t.status === 'ready')
      .slice(0, 8);
  }, [recent, favorites, isSearching, isFiltered]);

  /* 카테고리 그루핑 (검색·필터 없을 때만) */
  const grouped = useMemo(() => {
    if (isSearching || isFiltered) return null;
    const map = new Map<ToolCategory, ToolMeta[]>();
    for (const t of TOOLS) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    for (const [, list] of map) {
      if (sortKey === 'name') {
        const c = new Intl.Collator('ko');
        list.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
          return c.compare(a.title, b.title);
        });
      } else if (sortKey === 'phase') {
        list.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
          return b.phase - a.phase;
        });
      } else {
        list.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
          return a.phase - b.phase;
        });
      }
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as const,
    );
  }, [isSearching, isFiltered, sortKey]);

  /* 키보드 단축키 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === '/' && !inEditable) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (inEditable && document.activeElement === searchRef.current) {
          if (query) setQuery('');
          else searchRef.current?.blur();
          e.preventDefault();
        }
        if (showHelp) setShowHelp(false);
        return;
      }
      if (e.key === 'g' && !inEditable) {
        e.preventDefault();
        const idx = CATEGORIES.indexOf(category);
        const next = CATEGORIES[(idx + 1) % CATEGORIES.length];
        setCategory(next);
        requestAnimationFrame(() => {
          const rail = categoryRailRef.current;
          if (!rail) return;
          const activeBtn = rail.querySelector<HTMLButtonElement>(
            `button[data-cat="${next}"]`,
          );
          activeBtn?.scrollIntoView({
            inline: 'center',
            block: 'nearest',
            behavior: 'smooth',
          });
        });
        return;
      }
      if (e.key === '?' && !inEditable) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }
      // 1-9: 카테고리 점프
      if (!inEditable && /^[1-9]$/.test(e.key)) {
        const idx = Number(e.key);
        if (idx < CATEGORIES.length) {
          e.preventDefault();
          setCategory(CATEGORIES[idx]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [category, query, showHelp]);

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ITEM_LIST_JSON_LD) }}
      />
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center gap-2 px-4">
          <LayoutGrid className="h-5 w-5" />
          <h1 className="text-base font-semibold">도구</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {readyCount}개 사용 가능
          </span>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-label="키보드 단축키"
            title="키보드 단축키 (?)"
            className="hidden md:inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="도구 검색 — / 키로 빠르게 포커스"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                title="지우기"
                aria-label="검색어 지우기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div
            ref={categoryRailRef}
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          >
            {CATEGORIES.map((c) => {
              const count = categoryCounts.get(c) ?? 0;
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  data-cat={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'h-8 shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <span>{CATEGORY_LABELS[c]}</span>
                  <span
                    className={cn(
                      'text-[10px] tabular-nums rounded-full px-1.5 py-px',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ListOrdered className="h-3.5 w-3.5" />
              정렬:
              {(['relevance', 'name', 'phase'] as SortKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSortKey(k)}
                  className={cn(
                    'h-6 px-2 rounded-md border',
                    sortKey === k
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-background hover:bg-muted border-border',
                  )}
                >
                  {k === 'name' && <ArrowDownAZ className="inline h-3 w-3 mr-1" />}
                  {SORT_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showHelp && (
          <div className="rounded-xl border bg-card p-3 text-xs leading-relaxed text-muted-foreground md:max-w-md">
            <p className="mb-1.5 text-foreground font-medium">키보드 단축키</p>
            <ul className="space-y-1">
              <li>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
                <span className="ml-2">검색 박스로 포커스</span>
              </li>
              <li>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">g</kbd>
                <span className="ml-2">다음 카테고리로 점프</span>
              </li>
              <li>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">1</kbd>
                <span className="mx-1">~</span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">9</kbd>
                <span className="ml-2">카테고리 직접 선택</span>
              </li>
              <li>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                <span className="ml-2">검색 비우기 / 도움말 닫기</span>
              </li>
              <li>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">?</kbd>
                <span className="ml-2">이 도움말 토글</span>
              </li>
            </ul>
          </div>
        )}

        {favoriteTools.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                즐겨찾기
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {favoriteTools.length}개
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {favoriteTools.map((tool) => (
                <ToolCard
                  key={`fav-${tool.id}`}
                  tool={tool}
                  favorite={isFavorite(tool.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
          </section>
        )}

        {recentTools.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                최근 사용
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {recentTools.length}개
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {recentTools.map((tool) => (
                <ToolCard
                  key={`recent-${tool.id}`}
                  tool={tool}
                  favorite={isFavorite(tool.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
          </section>
        )}

        {tools.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center space-y-2">
            <p className="text-sm font-medium">검색 결과가 없습니다</p>
            <p className="text-[11px] text-muted-foreground">
              다른 키워드를 시도하거나, 카테고리 필터를 해제해 보세요. 한글·영문 모두 검색 가능합니다.
            </p>
            {(isSearching || isFiltered) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
                className="mt-2 inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : grouped ? (
          <div className="space-y-6">
            {grouped.map(([cat, list]) => (
              <section key={cat} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {list.filter((t) => t.status === 'ready').length}개 사용 가능
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {list.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      favorite={isFavorite(tool.id)}
                      onToggleFavorite={toggle}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                favorite={isFavorite(tool.id)}
                onToggleFavorite={toggle}
                query={isSearching ? query : ''}
              />
            ))}
          </div>
        )}

        {(isSearching || isFiltered) && tools.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            사용 가능 {readyCount}개 · 준비 중 {plannedCount}개
          </p>
        )}

        <p className="pt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          모든 도구는 브라우저 안에서 실행됩니다. 파일은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
