'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  CATEGORY_LABELS,
  filterTools,
  TOOLS,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools/registry';
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

function ToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;
  const isPlanned = tool.status === 'planned';

  const inner = (
    <div
      className={cn(
        'group relative flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-all',
        isPlanned
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:-translate-y-0.5 hover:border-primary hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {isPlanned && (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            준비 중
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold leading-tight">{tool.title}</h3>
      <p className="line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
        {tool.description}
      </p>
      <span className="mt-auto text-[11px] text-muted-foreground">
        {CATEGORY_LABELS[tool.category]}
      </span>
    </div>
  );

  if (isPlanned) return inner;
  return <Link href={tool.href}>{inner}</Link>;
}

export default function ToolsHubPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');

  const tools = useMemo(() => filterTools(query, category), [query, category]);
  const readyCount = tools.filter((t) => t.status === 'ready').length;
  const plannedCount = tools.length - readyCount;

  const isSearching = query.trim().length > 0;
  const isFiltered = category !== 'all';

  // 검색/필터 미적용 시에만 카테고리 섹션 그루핑 사용
  const grouped = useMemo(() => {
    if (isSearching || isFiltered) return null;
    const map = new Map<ToolCategory, ToolMeta[]>();
    for (const t of TOOLS) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    // 각 카테고리 내 ready 우선 정렬
    for (const [, list] of map) {
      list.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
        return a.phase - b.phase;
      });
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as const,
    );
  }, [isSearching, isFiltered]);

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-4">
          <LayoutGrid className="h-5 w-5" />
          <h1 className="text-base font-semibold">도구</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {readyCount}개 사용 가능
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="도구 검색 (압축, 합치기, OCR…)"
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

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'h-8 shrink-0 rounded-full border px-3 text-xs transition-colors',
                  category === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {tools.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {(isSearching || isFiltered) && (
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
