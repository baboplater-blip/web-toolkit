'use client';

import { useMemo, useState } from 'react';
import { CloudOff, LayoutGrid, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TOOLS, type ToolCategory, type ToolMeta } from '@/lib/tools/registry';
import { EN_TOOLS } from '@/lib/en-tools';
import { isOfflineCapable } from '@/lib/offline-tools';
import { cn } from '@/lib/utils';

/**
 * English interactive catalog (client).
 *
 * Static export prerenders this component's initial render (state = "all", no
 * query) into the page HTML, so the full tool list stays crawlable for SEO.
 * Search and category filtering hydrate on top. Tools with curated English
 * copy link to their /en/tools/{id} page (and show the English name + EN
 * badge); the rest link to the Korean tool page.
 */

const CATEGORY_LABELS_EN: Record<ToolCategory | 'all', string> = {
  all: 'All',
  image: 'Image',
  pdf: 'PDF',
  video: 'Video',
  gif: 'GIF',
  audio: 'Audio',
  docs: 'Documents',
  text: 'Text',
  dev: 'Developer',
  util: 'Utility',
  security: 'Security',
  ai: 'AI',
};

const CATEGORIES: (ToolCategory | 'all')[] = [
  'all',
  'pdf',
  'image',
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
  'pdf',
  'image',
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

/** English-aware search: matches English copy first, then Korean registry fields. */
function matches(tool: ToolMeta, q: string): boolean {
  if (!q) return true;
  const en = EN_TOOLS[tool.id];
  const haystack = [
    en?.name,
    en?.tagline,
    en?.description,
    ...(en?.keywords ?? []),
    tool.title,
    tool.description,
    ...(tool.keywords ?? []),
    tool.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  // every whitespace-separated term must appear
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

interface EnToolsCatalogProps {
  readyCount: number;
}

export function EnToolsCatalog({ readyCount }: EnToolsCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');

  const ready = useMemo(() => TOOLS.filter((t) => t.status === 'ready'), []);

  const filtered = useMemo(() => {
    const q = query.trim();
    return ready.filter(
      (t) => (category === 'all' || t.category === category) && matches(t, q),
    );
  }, [ready, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, ToolMeta[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    for (const list of map.values()) list.sort((a, b) => a.phase - b.phase);
    return map;
  }, [filtered]);

  const enCount = useMemo(
    () => ready.filter((t) => EN_TOOLS[t.id]).length,
    [ready],
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-4">
          <a
            href="/en"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Back to landing"
            title="Back"
          >
            <LayoutGrid className="h-4 w-4" />
          </a>
          <h1 className="text-base font-semibold">All Tools</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtered.length} / {readyCount}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <section className="rounded-xl border bg-card p-4 text-sm space-y-2">
          <p>
            Browse all <strong>{readyCount}</strong> browser tools. Tools marked{' '}
            <span className="inline-flex items-center rounded bg-primary/10 px-1 text-[10px] font-medium text-primary align-middle">
              EN
            </span>{' '}
            ({enCount}) have full English pages; the rest open the Korean tool
            page (mostly icon-driven and language-agnostic).
          </p>
          <p className="text-muted-foreground text-[12px]">
            Read step-by-step guides at{' '}
            <a href="/en/guide" className="text-primary underline">
              /en/guide
            </a>{' '}
            or compare tools at{' '}
            <a href="/en/compare" className="text-primary underline">
              /en/compare
            </a>
            . Favorites &amp; keyboard shortcuts live on the{' '}
            <a href="/tools" className="text-primary underline">
              main hub
            </a>
            .
          </p>
        </section>

        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools — e.g. pdf, qr, compress, base64…"
            aria-label="Search tools"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary hover:text-foreground text-muted-foreground',
              )}
            >
              {CATEGORY_LABELS_EN[c]}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            No tools match “{query}”.{' '}
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
              className="text-primary underline"
            >
              Reset
            </button>
          </div>
        ) : (
          CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => {
            const list = grouped.get(cat)!;
            return (
              <section key={cat} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold flex items-baseline gap-2">
                    {CATEGORY_LABELS_EN[cat]}
                    <span className="text-xs font-normal text-muted-foreground">
                      {list.length}
                    </span>
                  </h2>
                  <a
                    href={`/en/guide/category/${cat}`}
                    className="text-[11px] text-primary hover:underline shrink-0"
                  >
                    Read {CATEGORY_LABELS_EN[cat]} guide →
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {list.map((t) => {
                    const en = EN_TOOLS[t.id];
                    return (
                      <a
                        key={t.id}
                        href={en ? `/en/tools/${t.id}` : t.href}
                        hrefLang={en ? 'en' : 'ko'}
                        className="group rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <t.icon
                            className="h-4 w-4 text-primary shrink-0"
                            aria-hidden
                          />
                          <span className="text-sm font-medium truncate">
                            {en ? en.name : t.title}
                          </span>
                          {isOfflineCapable(t.id) && (
                            <CloudOff
                              className="ml-auto h-3 w-3 shrink-0 text-sky-600 dark:text-sky-400"
                              aria-label="Works offline"
                            />
                          )}
                          {en && (
                            <span
                              className={cn(
                                'shrink-0 rounded bg-primary/10 px-1 text-[10px] font-medium text-primary',
                                !isOfflineCapable(t.id) && 'ml-auto',
                              )}
                            >
                              EN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {en ? en.tagline : t.description}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        <footer className="text-center text-xs text-muted-foreground space-y-2 pt-6 border-t">
          <p>All processing happens in your browser. Files never uploaded.</p>
          <p>
            <a href="/tools" hrefLang="ko" className="underline hover:text-foreground">
              한국어 인터랙티브 허브로 이동
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
