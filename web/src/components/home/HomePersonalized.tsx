'use client';

import { useMemo } from 'react';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { TOOLS, type ToolMeta } from '@/lib/tools/registry';
import { useFavorites, useRecent } from '@/lib/hooks/useUsage';

/**
 * 홈 상단의 개인화 위젯 — 즐겨찾기·최근 사용 도구를 바로 노출한다.
 *
 * 클라이언트 전용(localStorage). 첫 방문자나 데이터가 없으면 null 을 반환해
 * 아무것도 렌더하지 않으므로 SSR HTML 에는 포함되지 않는다(레이아웃 흔들림 없음).
 */
export function HomePersonalized() {
  const { order } = useFavorites();
  const recent = useRecent();

  const byId = useMemo(() => new Map(TOOLS.map((t) => [t.id, t])), []);

  const favTools = useMemo<ToolMeta[]>(
    () =>
      order
        .map((id) => byId.get(id))
        .filter((t): t is ToolMeta => !!t && t.status === 'ready')
        .slice(0, 8),
    [order, byId],
  );

  const recentTools = useMemo<ToolMeta[]>(() => {
    const favSet = new Set(favTools.map((t) => t.id));
    return recent
      .filter((r) => !favSet.has(r.id))
      .map((r) => byId.get(r.id))
      .filter((t): t is ToolMeta => !!t && t.status === 'ready')
      .slice(0, 6);
  }, [recent, favTools, byId]);

  if (favTools.length === 0 && recentTools.length === 0) return null;

  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {favTools.length > 0 && (
          <Row
            icon={<Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />}
            title="내 즐겨찾기"
            tools={favTools}
          />
        )}
        {recentTools.length > 0 && (
          <Row
            icon={<Clock className="h-3.5 w-3.5" />}
            title="최근 사용"
            tools={recentTools}
          />
        )}
      </div>
    </section>
  );
}

function Row({
  icon,
  title,
  tools,
}: {
  icon: React.ReactNode;
  title: string;
  tools: ToolMeta[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          {title}
        </h2>
        <a href="/tools" className="text-[11px] text-primary hover:underline">
          전체 도구 <ArrowRight className="inline h-3 w-3" aria-hidden="true" />
        </a>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <a
              key={t.id}
              href={t.href}
              className="group flex w-36 shrink-0 flex-col gap-1.5 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate text-xs font-semibold">{t.title}</span>
              <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                {t.description}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
