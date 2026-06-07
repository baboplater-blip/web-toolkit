'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownAZ,
  Clock,
  Flame,
  Keyboard,
  LayoutGrid,
  ListOrdered,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolCard } from '@/components/tools/ToolCard';
import { ReorderableFavorites } from '@/components/tools/ReorderableFavorites';
import {
  CATEGORY_LABELS,
  filterTools,
  TOOLS,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools/registry';
import { SUPER_CATEGORIES } from '@/lib/tools/super-categories';
import { useFavorites, useRecent, useUsageStats } from '@/lib/hooks/useUsage';
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

type SortKey = 'relevance' | 'name' | 'newest' | 'popular' | 'phase';
const SORT_LABELS: Record<SortKey, string> = {
  relevance: '기본',
  name: '이름순',
  newest: 'NEW',
  popular: '인기',
  phase: '우선순위',
};

/** addedAt → 비교용 timestamp (없으면 0 — 가장 오래된 것으로 취급) */
function addedTime(t: ToolMeta): number {
  if (!t.addedAt) return 0;
  const ms = Date.parse(t.addedAt);
  return Number.isNaN(ms) ? 0 : ms;
}

function sortBy(
  list: ToolMeta[],
  key: SortKey,
  usage: Record<string, number>,
): ToolMeta[] {
  if (key === 'relevance') {
    // filterTools 가 이미 정렬해 주지만, 카테고리 그룹별 호출에서도 일관성 유지.
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
      return a.phase - b.phase;
    });
  }
  if (key === 'name') {
    const c = new Intl.Collator('ko');
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
      return c.compare(a.title, b.title);
    });
  }
  if (key === 'phase') {
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
      return a.phase - b.phase;
    });
  }
  if (key === 'newest') {
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
      return addedTime(b) - addedTime(a);
    });
  }
  // popular
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
    const ua = usage[a.id] ?? 0;
    const ub = usage[b.id] ?? 0;
    if (ua !== ub) return ub - ua;
    return a.phase - b.phase;
  });
}

const SORT_STORAGE_KEY = 'webtoolkit:hub:sort';

const VALID_CATEGORIES = new Set<ToolCategory | 'all'>([
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
]);

function readUrlState(): { category: ToolCategory | 'all'; query: string } {
  if (typeof window === 'undefined') return { category: 'all', query: '' };
  const sp = new URLSearchParams(window.location.search);
  const cat = sp.get('category');
  const q = sp.get('q') ?? '';
  const validCat = cat && VALID_CATEGORIES.has(cat as ToolCategory | 'all')
    ? (cat as ToolCategory | 'all')
    : 'all';
  return { category: validCat, query: q };
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

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

  const { favorites, order: favoriteOrder, toggle, reorder, isFavorite } = useFavorites();
  const recent = useRecent();
  const usage = useUsageStats();

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

  /* URL → 상태 (mount + popstate 시) */
  useEffect(() => {
    const sync = () => {
      const { category: c, query: q } = readUrlState();
      setCategory(c);
      setQuery(q);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  /* 상태 → URL 동기화 (replaceState — 새 history 항목 안 만듦) */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (category === 'all') sp.delete('category');
    else sp.set('category', category);
    if (!query.trim()) sp.delete('q');
    else sp.set('q', query.trim());
    const next = sp.toString();
    const target = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
    if (target !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, '', target);
    }
  }, [category, query]);

  /* 정렬 키 로드/저장 */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (
      saved === 'relevance' ||
      saved === 'name' ||
      saved === 'newest' ||
      saved === 'popular' ||
      saved === 'phase'
    ) {
      setSortKey(saved);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SORT_STORAGE_KEY, sortKey);
  }, [sortKey]);

  const tools = useMemo(
    () => sortBy(filterTools(query, category), sortKey, usage),
    [query, category, sortKey, usage],
  );
  const readyCount = tools.filter((t) => t.status === 'ready').length;
  const plannedCount = tools.length - readyCount;

  const isSearching = query.trim().length > 0;
  const isFiltered = category !== 'all';

  /* 즐겨찾기 도구 (검색·필터 없을 때만 노출) */
  const favoriteTools = useMemo<ToolMeta[]>(() => {
    if (isSearching || isFiltered) return [];
    if (favoriteOrder.length === 0) return [];
    const map = new Map(TOOLS.map((t) => [t.id, t]));
    return favoriteOrder
      .map((id) => map.get(id))
      .filter((t): t is ToolMeta => t !== undefined && t.status === 'ready');
  }, [favoriteOrder, isSearching, isFiltered]);

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

  /* 인기 도구 (usage 상위, 즐겨찾기·최근에 이미 있는 도구는 제외) */
  const popularTools = useMemo<ToolMeta[]>(() => {
    if (isSearching || isFiltered) return [];
    const entries = Object.entries(usage)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
    if (entries.length === 0) return [];
    const excluded = new Set<string>([
      ...favorites,
      ...recentTools.map((t) => t.id),
    ]);
    const map = new Map(TOOLS.map((t) => [t.id, t]));
    return entries
      .filter(([id]) => !excluded.has(id))
      .map(([id]) => map.get(id))
      .filter((t): t is ToolMeta => t !== undefined && t.status === 'ready')
      .slice(0, 6);
  }, [usage, favorites, recentTools, isSearching, isFiltered]);

  /* 카테고리 그루핑 (검색·필터 없을 때만) */
  const grouped = useMemo(() => {
    if (isSearching || isFiltered) return null;
    const map = new Map<ToolCategory, ToolMeta[]>();
    for (const t of TOOLS) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    for (const [cat, list] of map) {
      map.set(cat, sortBy(list, sortKey, usage));
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as const,
    );
  }, [isSearching, isFiltered, sortKey, usage]);

  /* 슈퍼카테고리로 한 번 더 묶기 (브라우즈 뷰 가독성) */
  const superGrouped = useMemo(() => {
    if (!grouped) return null;
    const byCat = new Map(grouped);
    return SUPER_CATEGORIES.map((sc) => ({
      sc,
      entries: sc.categories
        .filter((c) => byCat.has(c))
        .map((c) => [c, byCat.get(c)!] as const),
    })).filter((g) => g.entries.length > 0);
  }, [grouped]);

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
              className="h-10 pl-9 pr-9" aria-label="도구 검색 — / 키로 빠르게 포커스" />
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
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap">
              <ListOrdered className="h-3.5 w-3.5" />
              정렬:
              {(
                ['relevance', 'newest', 'popular', 'name', 'phase'] as SortKey[]
              ).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSortKey(k)}
                  className={cn(
                    'h-6 px-2 rounded-md border inline-flex items-center',
                    sortKey === k
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-background hover:bg-muted border-border',
                  )}
                  aria-pressed={sortKey === k}
                >
                  {k === 'name' && <ArrowDownAZ className="h-3 w-3 mr-1" />}
                  {k === 'newest' && <Sparkles className="h-3 w-3 mr-1" />}
                  {k === 'popular' && <Flame className="h-3 w-3 mr-1" />}
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
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘</kbd>
                <span className="mx-0.5">/</span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
                <span className="mx-0.5">+</span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
                <span className="ml-2">어디서나 검색 팔레트 열기</span>
              </li>
              <li>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
                <span className="ml-2">검색 박스로 포커스 (허브)</span>
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
                {favoriteTools.length > 1 ? '드래그로 순서 변경 · ' : ''}
                {favoriteTools.length}개
              </span>
            </div>
            <ReorderableFavorites
              tools={favoriteTools}
              onReorder={reorder}
              onRemove={toggle}
            />
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

        {popularTools.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                자주 쓰는 도구
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {popularTools.length}개
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {popularTools.map((tool) => (
                <ToolCard
                  key={`pop-${tool.id}`}
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
        ) : superGrouped ? (
          <div className="space-y-10">
            {superGrouped.map(({ sc, entries }) => {
              const SuperIcon = sc.icon;
              const superTotal = entries.reduce(
                (n, [, list]) => n + list.filter((t) => t.status === 'ready').length,
                0,
              );
              return (
                <div key={sc.key} className="space-y-5">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <SuperIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2 className="text-sm font-bold">{sc.label}</h2>
                    <span className="hidden text-[11px] text-muted-foreground sm:inline">
                      {sc.blurb}
                    </span>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {superTotal}개
                    </span>
                  </div>
                  {entries.map(([cat, list]) => (
                    <section key={cat} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {CATEGORY_LABELS[cat]}
                        </h3>
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
              );
            })}
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

        <p className="pt-4 text-center text-[12px] leading-relaxed text-muted-foreground">
          <a href="/convert" className="font-medium text-primary hover:underline">
            파일 변환 모음 →
          </a>{' '}
          PNG·JPG·WebP·HEIC·PDF 간 변환을 한 곳에서.{' '}
          <a href="/compare" className="font-medium text-primary hover:underline">
            도구 비교 →
          </a>{' '}
          헷갈리는 포맷·도구를 나란히.{' '}
          <a href="/use" className="font-medium text-primary hover:underline">
            활용법 →
          </a>{' '}
          자주 하는 작업을 단계별로.
        </p>

        <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          모든 도구는 브라우저 안에서 실행됩니다. 파일은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
