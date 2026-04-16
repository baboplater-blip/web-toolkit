'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CATEGORY_LABELS,
  filterTools,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools/registry';

const CATEGORIES: (ToolCategory | 'all')[] = ['all', 'image', 'pdf', 'security', 'ai'];

function ToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;
  const isPlanned = tool.status === 'planned';

  const inner = (
    <div
      className={`group relative rounded-xl border bg-card p-4 h-full flex flex-col gap-2 transition-all ${
        isPlanned
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-primary hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        {isPlanned && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
            준비 중
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold leading-tight">{tool.title}</h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 flex-1">
        {tool.description}
      </p>
      <span className="text-[10px] text-muted-foreground mt-auto">
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

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="대시보드로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <LayoutGrid className="h-5 w-5" />
            <h1 className="font-semibold text-base">도구</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-4">
        {/* 검색 + 카테고리 필터 */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="도구 검색 (압축, 합치기, OCR…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9 h-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                title="지우기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 h-7 px-3 text-xs rounded-full border transition-colors ${
                  category === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 요약 */}
        <p className="text-[11px] text-muted-foreground">
          사용 가능 {readyCount}개 · 준비 중 {plannedCount}개
        </p>

        {/* 카드 그리드 */}
        {tools.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-4 leading-relaxed">
          모든 도구는 브라우저 안에서 실행됩니다. 파일은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
