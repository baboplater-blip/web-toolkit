'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRightLeft, Wrench, Scale } from 'lucide-react';
import { TOOLS } from '@/lib/tools/registry';
import { CONVERT_INDEX, COMPARE_INDEX, USECASE_INDEX } from '@/lib/search-index.generated';

/**
 * 도구 페이지 하단의 역링크 — 변환 매트릭스(/convert/*)와 활용법(/use/*)으로
 * 도구 페이지를 양방향 연결한다(내부 링크 그래프 강화).
 *
 * 현재 경로(pathname)에 해당하는 도구를 찾아, 그 도구를 쓰는 변환쌍·활용법이
 * 있으면 칩 목록을 렌더한다. 없으면 아무것도 렌더하지 않는다.
 */
export function ToolConvertLinks() {
  const pathname = usePathname();

  const { convertLinks, useLinks, compareLinks } = useMemo(() => {
    if (!pathname) return { convertLinks: [], useLinks: [], compareLinks: [] };
    const base = pathname.split('?')[0];
    const tool = TOOLS.find((t) => t.href === pathname);
    const convertLinks = tool
      ? CONVERT_INDEX.filter((e) => e.toolId === tool.id).map((e) => ({
          slug: e.slug,
          label: e.label,
        }))
      : [];
    const useLinks = USECASE_INDEX.filter((e) => e.stepHrefs.includes(base)).map((e) => ({
      slug: e.slug,
      label: e.h1,
    }));
    const compareLinks = tool
      ? COMPARE_INDEX.filter((e) => e.toolIds.includes(tool.id)).map((e) => ({
          slug: e.slug,
          label: e.h1,
        }))
      : [];
    return { convertLinks, useLinks, compareLinks };
  }, [pathname]);

  if (convertLinks.length === 0 && useLinks.length === 0 && compareLinks.length === 0) return null;

  return (
    <aside aria-label="관련 링크" className="mx-auto max-w-3xl px-4 pt-4 space-y-4">
      {convertLinks.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
            이 도구로 가능한 변환
          </h2>
          <div className="flex flex-wrap gap-2">
            {convertLinks.map((l) => (
              <a
                key={l.slug}
                href={`/convert/${l.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      )}
      {useLinks.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            이 도구를 쓰는 활용법
          </h2>
          <div className="flex flex-wrap gap-2">
            {useLinks.map((l) => (
              <a
                key={l.slug}
                href={`/use/${l.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      )}
      {compareLinks.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Scale className="h-3.5 w-3.5" aria-hidden="true" />
            관련 비교
          </h2>
          <div className="flex flex-wrap gap-2">
            {compareLinks.map((l) => (
              <a
                key={l.slug}
                href={`/compare/${l.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
