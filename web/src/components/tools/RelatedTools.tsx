'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles, Workflow } from 'lucide-react';
import { TOOLS, type ToolMeta } from '@/lib/tools/registry';
import { getRelatedTools, RELATED_TOOLS } from '@/lib/guide-related';
import { useFavorites, useUsageStats } from '@/lib/hooks/useUsage';
import { ToolCard } from './ToolCard';

const WORKFLOW_COUNT = 4;
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
 *   섹션 0(있을 때): 큐레이션 워크플로 — `RELATED_TOOLS` 클러스터에서 실제로
 *     이어 쓰거나 비교하는 도구 (최대 4개). 같은 카테고리 휴리스틱보다 정확.
 *   섹션 1: 같은 카테고리에서 가져온 다른 도구 (최대 4개)
 *     - 신규(addedAt 14일 이내) 도구 우선, 그 다음 phase 오름차순
 *   섹션 2: 다른 카테고리에서 이 사용자가 자주 쓴 도구 + 인기 도구 (최대 3개)
 *     - usage 횟수 내림차순, 동률은 phase 오름차순
 *
 * 도구 페이지가 아니거나 추천할 도구가 없으면 아무것도 렌더하지 않음.
 * 추천 후보는 status='ready' 한정. 섹션 간 중복은 제거한다.
 */
export function RelatedTools() {
  const pathname = usePathname();
  const { isFavorite, toggle } = useFavorites();
  const usage = useUsageStats();

  const current = useMemo<ToolMeta | undefined>(() => {
    if (!pathname) return undefined;
    return TOOLS.find((t) => t.href === pathname);
  }, [pathname]);

  const { workflow, sameCat, crossCat } = useMemo(() => {
    if (!current) {
      return {
        workflow: [] as ToolMeta[],
        sameCat: [] as ToolMeta[],
        crossCat: [] as ToolMeta[],
      };
    }

    // 0) 큐레이션 클러스터가 있는 도구만 워크플로 섹션을 채운다(폴백 미사용 —
    //    아래 같은-카테고리 섹션과 중복되지 않게 큐레이션 전용으로 둔다).
    const workflow = RELATED_TOOLS[current.id]
      ? getRelatedTools(current, TOOLS, { limit: WORKFLOW_COUNT })
      : [];
    const shown = new Set<string>([current.id, ...workflow.map((t) => t.id)]);

    const allReady = TOOLS.filter(
      (t) => t.status === 'ready' && !shown.has(t.id),
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

    const sameCat = sameCatPool.slice(0, SAME_CATEGORY_COUNT);
    const sameCatIds = new Set(sameCat.map((t) => t.id));

    const crossCatPool = allReady
      .filter((t) => t.category !== current.category && !sameCatIds.has(t.id))
      .sort((a, b) => {
        const ua = usage[a.id] ?? 0;
        const ub = usage[b.id] ?? 0;
        if (ua !== ub) return ub - ua;
        return a.phase - b.phase;
      });

    return {
      workflow,
      sameCat,
      crossCat: crossCatPool.slice(0, CROSS_CATEGORY_COUNT),
    };
  }, [current, usage]);

  if (!current) return null;
  if (workflow.length === 0 && sameCat.length === 0 && crossCat.length === 0) return null;

  return (
    <aside
      aria-label="관련 도구"
      className="mx-auto max-w-3xl px-4 pt-4 space-y-5"
    >
      {workflow.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Workflow className="h-3.5 w-3.5" aria-hidden="true" />함께 쓰면 좋은 도구
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {workflow.map((t) => (
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
