import { affiliatesFor } from '@/lib/affiliates';

/**
 * 가이드 페이지 전용 제휴(스폰서) 추천. 설정이 비어 있으면 null 을 반환해
 * 아무것도 렌더하지 않는다(기본 OFF). 노출 시 항상 '스폰서'를 명시하고
 * 링크는 rel="sponsored nofollow"(SEO·신뢰 안전)로 연다. 도구 작업영역에는 쓰지 않는다.
 */
export function SponsoredTip({ toolId, category }: { toolId: string; category: string }) {
  const offers = affiliatesFor(toolId, category);
  if (offers.length === 0) return null;

  return (
    <section
      aria-label="스폰서 추천"
      className="rounded-xl border border-dashed bg-muted/30 p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          스폰서
        </span>
        <span className="text-[11px] text-muted-foreground">파트너 추천 · 외부 링크</span>
      </div>
      <ul className="space-y-1.5">
        {offers.map((o) => (
          <li key={o.href}>
            <a
              href={o.href}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="group block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
            >
              <span className="text-sm font-medium group-hover:text-primary">{o.label}</span>
              <span className="mt-0.5 block text-[12px] text-muted-foreground">{o.blurb}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
