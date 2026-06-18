'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, type ToolCategory } from '@/lib/tools/registry';
import { useUsageStats, useRecent } from '@/lib/hooks/useUsage';

/**
 * Admin panel: 인기 도구 랭킹 (이 브라우저 localStorage 기반).
 *
 * usage.ts 의 도구별 사용 횟수(stats)와 최근 사용(recent) 데이터를 읽어
 * Top N 도구·카테고리 분포를 보여준다. 서버 집계가 아니라 이 브라우저에서
 * 어드민 본인이 사용한 카운트다.
 *
 * 하이드레이션 안전: 데이터는 모두 useUsageStats/useRecent 훅이 마운트 후
 * useEffect 로 localStorage 를 읽어 채우므로, 초기 SSR 렌더는 빈 상태로
 * 결정적이다(서버/클라이언트 불일치 없음).
 */

const TOP_N = 12;

function timeAgo(t: number): string {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}초 전`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function PopularToolsPanel() {
  const stats = useUsageStats();
  const recent = useRecent();

  const toolById = useMemo(() => new Map(TOOLS.map((t) => [t.id, t])), []);

  const ranked = useMemo(() => {
    return Object.entries(stats)
      .map(([id, count]) => ({ tool: toolById.get(id), count }))
      .filter((e): e is { tool: (typeof TOOLS)[number]; count: number } => !!e.tool)
      .sort((a, b) => b.count - a.count);
  }, [stats, toolById]);

  const totalUsage = useMemo(
    () => ranked.reduce((sum, r) => sum + r.count, 0),
    [ranked],
  );
  const maxCount = ranked.length > 0 ? ranked[0].count : 0;

  // 카테고리별 사용 횟수 분포 (사용 횟수 기준).
  const categoryDist = useMemo(() => {
    const byCat = new Map<ToolCategory, number>();
    for (const { tool, count } of ranked) {
      byCat.set(tool.category, (byCat.get(tool.category) ?? 0) + count);
    }
    return [...byCat.entries()]
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count);
  }, [ranked]);

  const lastRecent = recent[0];

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          인기 도구 랭킹 (이 브라우저)
        </span>
        <span className="text-[10px] font-normal normal-case tabular-nums">
          총 {totalUsage.toLocaleString()}회
        </span>
      </h2>

      {ranked.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-4 text-[12px] text-muted-foreground">
          아직 사용 기록이 없습니다. 도구를 사용하면 이 브라우저의 localStorage 에
          도구별 사용 횟수가 누적됩니다 (서버 전송·수집 없음).
        </p>
      ) : (
        <div className="rounded-lg border bg-card p-3 space-y-4">
          {/* 카테고리 분포 */}
          {categoryDist.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                카테고리 분포
              </p>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {categoryDist.map(({ cat, count }, i) => (
                  <div
                    key={cat}
                    className={
                      [
                        'bg-sky-500',
                        'bg-violet-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-rose-500',
                        'bg-cyan-500',
                        'bg-fuchsia-500',
                        'bg-lime-500',
                        'bg-orange-500',
                        'bg-teal-500',
                        'bg-indigo-500',
                      ][i % 11]
                    }
                    style={{ width: `${(count / totalUsage) * 100}%` }}
                    title={`${CATEGORY_LABELS[cat]}: ${count}회`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                {categoryDist.map(({ cat, count }, i) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums"
                  >
                    <span
                      className={
                        [
                          'bg-sky-500',
                          'bg-violet-500',
                          'bg-emerald-500',
                          'bg-amber-500',
                          'bg-rose-500',
                          'bg-cyan-500',
                          'bg-fuchsia-500',
                          'bg-lime-500',
                          'bg-orange-500',
                          'bg-teal-500',
                          'bg-indigo-500',
                        ][i % 11] + ' h-2 w-2 rounded-sm'
                      }
                    />
                    {CATEGORY_LABELS[cat]} {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top N 도구 막대 랭킹 */}
          <ul className="space-y-1">
            {ranked.slice(0, TOP_N).map(({ tool, count }, i) => (
              <li key={tool.id} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-4 text-right text-[10px] tabular-nums text-muted-foreground shrink-0">
                      {i + 1}
                    </span>
                    <tool.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">{tool.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {CATEGORY_LABELS[tool.category]}
                    </span>
                  </span>
                  <span className="text-xs font-semibold tabular-nums shrink-0">{count}</span>
                </div>
                <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {ranked.length > TOP_N && (
            <p className="text-[10px] text-muted-foreground">
              상위 {TOP_N}개만 표시 · 사용 기록 도구 {ranked.length}종
            </p>
          )}

          {lastRecent && toolById.get(lastRecent.id) && (
            <p className="text-[11px] text-muted-foreground">
              마지막 사용: {toolById.get(lastRecent.id)!.title} · {timeAgo(lastRecent.ts)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
