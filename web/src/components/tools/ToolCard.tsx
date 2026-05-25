'use client';

import { Star } from 'lucide-react';
import { CATEGORY_LABELS, type ToolMeta } from '@/lib/tools/registry';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  tool: ToolMeta;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  showCategory?: boolean;
  /** 검색어 — 카드 안 매치 부분을 강조 표시 */
  query?: string;
}

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(qLower, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={idx}
        className="rounded-sm bg-amber-200/70 text-foreground dark:bg-amber-400/30"
      >
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return parts;
}

export function ToolCard({
  tool,
  favorite,
  onToggleFavorite,
  showCategory = true,
  query = '',
}: ToolCardProps) {
  const Icon = tool.icon;
  const isPlanned = tool.status === 'planned';

  const inner = (
    <div
      className={cn(
        'group relative flex h-full flex-col gap-2 rounded-xl border bg-card p-3 sm:p-4 transition-all',
        isPlanned
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:-translate-y-0.5 hover:border-primary hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
          {isPlanned && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              준비 중
            </span>
          )}
          {!isPlanned && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(tool.id);
              }}
              aria-pressed={favorite}
              aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                favorite
                  ? 'text-amber-500 hover:bg-amber-500/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Star
                className={cn('h-4 w-4', favorite && 'fill-current')}
                aria-hidden
              />
            </button>
          )}
        </div>
      </div>
      <h3 className="text-sm font-semibold leading-tight">
        {highlight(tool.title, query)}
      </h3>
      <p className="line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
        {highlight(tool.description, query)}
      </p>
      {showCategory && (
        <span className="mt-auto text-[11px] text-muted-foreground">
          {CATEGORY_LABELS[tool.category]}
        </span>
      )}
    </div>
  );

  if (isPlanned) return inner;
  return <a href={tool.href}>{inner}</a>;
}
