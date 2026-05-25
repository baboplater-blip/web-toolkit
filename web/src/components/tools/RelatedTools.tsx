'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles } from 'lucide-react';
import { TOOLS, type ToolMeta } from '@/lib/tools/registry';
import { useFavorites, useUsageStats } from '@/lib/hooks/useUsage';
import { ToolCard } from './ToolCard';

const SAME_CATEGORY_COUNT = 4;
const CROSS_CATEGORY_COUNT = 3;
const RECENT_DAYS = 14;

function isRecent(addedAt: string | undefined): boolean {
  if (!addedAt) return false;
  const t = Date.parse(addedAt);
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) / 86_400_000 < RECENT_DAYS;
}

/**
 * 도구 페이지 하단에 표시되는 관련 도구 그리드.
 *
 *   섹션 1: 같은 카테고리에서 가져온 다른 도구 (최대 4개)
 *     - 신규(addedAt 14일 이내) 도구 우선, 그 다음 phase 오름차순
 *   섹션 2: 다른 카테고리에서 이 사용자가 자주 쓴 도구 + 인기 도구 (최대 3개)
 *     - usage 횟수 내림차순, 동률은 phase 오름차순
 *
 * 도구 페이지가 아니거나 추천할 도구가 없으면 아무것도 렌더하지 않음.
 * 추천 후보는 status='ready' 한정.
 */
export function RelatedTools() {
  const pathname = usePathname();
  const { isFavorite, toggle } = useFavorites();
  const usage = useUsageStats();

  const current = useMemo<ToolMeta | undefined>(() => {
    if (!pathname) return undefined;
    return TOOLS.find((t) => t.href === pathname);
  }, [pathname]);

  const { sameCat, crossCat } = useMemo(() => {
    if (!current) return { sameCat: [] as ToolMeta[], crossCat: [] as ToolMeta[] };

    const allReady = TOOLS.filter(
      (t) => t.status === 'ready' && t.id !== current.id,
    );

    const sameCatPool = allReady
      .filter((t) => t.category === current.category)
      .sort((a, b) => {
        // 최근 추가된 도구 우선
        const ar = isRecent(a.addedAt) ? 1 : 0;
        const br = isRecent(b.addedAt) ? 1 : 0;
        if (ar !== br) return br - ar;
        return a.phase - b.phase;
      });

    const crossCatPool = allReady
      .filter((t) => t.category !== current.category)
      .sort((a, b) => {
        const ua = usage[a.id] ?? 0;
        const ub = usage[b.id] ?? 0;
        if (ua !== ub) return ub - ua;
        return a.phase - b.phase;
      });

    return {
      sameCat: sameCatPool.slice(0, SAME_CATEGORY_COUNT),
      crossCat: crossCatPool.slice(0, CROSS_CATEGORY_COUNT),
    };
  }, [current, usage]);

  if (!current) return null;
  if (sameCat.length === 0 && crossCat.length === 0) return null;

  return (
    <aside
      aria-label="관련 도구"
      className="mx-auto max-w-3xl px-4 pt-4 space-y-5"
    >
      {sameCat.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />이 카테고리 다른 도구
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {sameCat.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                favorite={isFavorite(t.id)}
                onToggleFavorite={toggle}
                showCategory={false}
              />
            ))}
          </div>
        </section>
      )}

      {crossCat.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />이런 도구도 있어요
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {crossCat.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                favorite={isFavorite(t.id)}
                onToggleFavorite={toggle}
              />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
