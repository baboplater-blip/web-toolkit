import { affiliatesFor, pickAffiliateText, type AffiliateLocale } from '@/lib/affiliates';

/** 로케일별 라벨/캡션 — '추천'은 명확히 표기해 신뢰 유지. */
const LABELS: Record<AffiliateLocale, { badge: string; caption: string; aria: string }> = {
  ko: { badge: '추천', caption: '파트너 추천 · 외부 링크', aria: '추천 리소스' },
  en: { badge: 'Sponsored', caption: 'Partner recommendation · external link', aria: 'Sponsored recommendation' },
  ja: { badge: 'PR', caption: 'パートナーのおすすめ · 外部リンク', aria: 'おすすめリソース' },
  zh: { badge: '推荐', caption: '合作伙伴推荐 · 外部链接', aria: '推荐资源' },
};

/**
 * 가이드 페이지 전용 제휴(추천) 카드. 비침투적 — 가이드 하단에만 둔다.
 *
 * `affiliates.ts` 항목이 모두 active=false 거나 href 가 비어 있으면 `affiliatesFor`
 * 가 빈 배열을 돌려주므로 null 을 반환해 **아무것도 렌더하지 않는다(기본 OFF)**.
 * 노출 시 항상 '추천/스폰서'를 명시하고 링크는 rel="sponsored nofollow"(SEO·신뢰
 * 안전)로 연다. 도구 작업영역에는 절대 쓰지 않는다.
 */
export function SponsoredTip({
  toolId,
  category,
  locale = 'ko',
}: {
  toolId: string;
  category: string;
  locale?: AffiliateLocale;
}) {
  const offers = affiliatesFor(toolId, category);
  if (offers.length === 0) return null;

  const t = LABELS[locale];

  return (
    <section
      aria-label={t.aria}
      className="rounded-xl border border-dashed bg-muted/30 p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {t.badge}
        </span>
        <span className="text-[11px] text-muted-foreground">{t.caption}</span>
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
              <span className="text-sm font-medium group-hover:text-primary">
                {pickAffiliateText(o.label, locale)}
              </span>
              <span className="mt-0.5 block text-[12px] text-muted-foreground">
                {pickAffiliateText(o.blurb, locale)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
