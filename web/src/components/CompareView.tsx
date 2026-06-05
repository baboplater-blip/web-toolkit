/**
 * 비교("X vs Y") 페이지 공용 뷰 (서버 컴포넌트, 순수 프레젠테이션).
 * /compare/{slug} (ko) 와 /en/compare/{slug} (en) 가 함께 사용한다.
 */

import { ArrowLeft, ArrowRight, ArrowRightLeft, Check, GitCompare, Minus, Wrench } from 'lucide-react';
import type { Compare, CompareOption } from '@/lib/en-compares';

type Lang = 'ko' | 'en';

interface OtherCompare {
  slug: string;
  h1: string;
  description: string;
}

interface Props {
  compare: Compare;
  lang: Lang;
  siteUrl: string;
  categoryLabel: string;
  /** options 와 평행한 CTA href 배열 */
  optionHrefs: Array<string | undefined>;
  /** 관련 변환 매트릭스 (slug + 라벨) */
  relatedConverts: Array<{ slug: string; label: string }>;
  otherCompares: OtherCompare[];
}

export function CompareView({
  compare: cmp,
  lang,
  siteUrl,
  categoryLabel,
  optionHrefs,
  relatedConverts,
  otherCompares,
}: Props) {
  const ko = lang === 'ko';
  const base = ko ? '/compare' : '/en/compare';
  const home = ko ? '/' : '/en';
  const convertBase = ko ? '/convert' : '/en/convert';
  const allToolsHref = ko ? '/tools' : '/en/tools';
  const canonical = `${siteUrl}${base}/${cmp.slug}`;

  const L = ko
    ? {
        home: '홈', compare: '비교', all: '모든 비교',
        best: '추천 상황: ', open: (n: string) => `${n} 열기`,
        verdict: '어느 쪽을 써야 하나', faq: '자주 묻는 질문',
        more: '다른 비교', converts: '바로 변환하기', browseAll: '모든 도구 보기',
      }
    : {
        home: 'Home', compare: 'Compare', all: 'All comparisons',
        best: 'Best for: ', open: (n: string) => `Open ${n}`,
        verdict: 'Which should you use?', faq: 'Frequently asked',
        more: 'More comparisons', converts: 'Convert now', browseAll: 'Browse all tools',
      };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cmp.title,
    description: cmp.description,
    inLanguage: ko ? 'ko' : 'en',
    author: { '@type': 'Organization', name: 'Web Toolkit', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'Web Toolkit', url: siteUrl },
    mainEntityOfPage: canonical,
    image: `${siteUrl}/og/${cmp.category}.png`,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${siteUrl}${home}` },
      { '@type': 'ListItem', position: 2, name: L.compare, item: `${siteUrl}${base}` },
      { '@type': 'ListItem', position: 3, name: cmp.h1, item: canonical },
    ],
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: ko ? 'ko' : 'en',
    mainEntity: cmp.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const OptionCard = ({ opt, i }: { opt: CompareOption; i: number }) => {
    const href = optionHrefs[i];
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3 flex flex-col">
        <h3 className="text-lg font-bold">{opt.label}</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">{L.best}</span>
          {opt.best}
        </p>
        <ul className="space-y-1">
          {opt.pros.map((p, j) => (
            <li key={j} className="flex items-start gap-2 text-[13px]">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
          {opt.cons.map((c, j) => (
            <li key={`c${j}`} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <Minus className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        {href && (
          <a
            href={href}
            className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Wrench className="h-4 w-4" />
            {L.open(opt.label)}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href={base} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label={L.all} title={L.all}>
            <ArrowLeft className="h-4 w-4" />
          </a>
          <GitCompare className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{cmp.h1}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href={home} className="hover:text-foreground">{L.home}</a>
          <span className="mx-1">/</span>
          <a href={base} className="hover:text-foreground">{L.compare}</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{cmp.h1}</span>
        </nav>

        <section className="space-y-3">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {categoryLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{cmp.h1}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{cmp.intro}</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cmp.options.map((opt, i) => (
            <OptionCard key={i} opt={opt} i={i} />
          ))}
        </section>

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{L.verdict}</h3>
          <p className="text-sm leading-relaxed">{cmp.verdict}</p>
        </section>

        {relatedConverts.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">{L.converts}</h3>
            <div className="flex flex-wrap gap-2">
              {relatedConverts.map((r) => (
                <a
                  key={r.slug}
                  href={`${convertBase}/${r.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                  {r.label}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-lg font-bold">{L.faq}</h3>
          <div className="space-y-2">
            {cmp.faqs.map((f, i) => (
              <details key={i} className="group rounded-xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <span className="font-medium text-sm">{f.q}</span>
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {otherCompares.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">{L.more}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherCompares.map((o) => (
                <a key={o.slug} href={`${base}/${o.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">{o.h1}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{o.description}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="text-center">
          <a href={allToolsHref} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            {L.browseAll}
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>
    </div>
  );
}
