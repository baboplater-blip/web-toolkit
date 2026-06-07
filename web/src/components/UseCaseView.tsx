/**
 * 유스케이스 페이지 공용 뷰 (서버 컴포넌트, 순수 프레젠테이션).
 * /use/{slug} (ko) 와 /en/use/{slug} (en) 가 함께 사용한다. HowTo 스키마 포함.
 */

import { ArrowLeft, ArrowRight, ArrowRightLeft, GitCompare, Wrench } from 'lucide-react';
import type { Lang, UseCase } from '@/lib/use-cases';

interface ChipLink {
  slug: string;
  label: string;
}

interface Props {
  uc: UseCase;
  lang: Lang;
  siteUrl: string;
  categoryLabel: string;
  relatedConverts: ChipLink[];
  relatedCompares: ChipLink[];
  others: Array<{ slug: string; title: string; description: string }>;
}

export function UseCaseView({ uc, lang, siteUrl, categoryLabel, relatedConverts, relatedCompares, others }: Props) {
  const ko = lang === 'ko';
  const ja = lang === 'ja';
  const base = ko ? '/use' : ja ? '/ja/use' : '/en/use';
  const home = ko ? '/' : ja ? '/ja' : '/en';
  const convertBase = ko ? '/convert' : ja ? '/ja/convert' : '/en/convert';
  const compareBase = ko ? '/compare' : ja ? '/ja/compare' : '/en/compare';
  const allToolsHref = ko ? '/tools' : ja ? '/ja/tools' : '/en/tools';
  const canonical = `${siteUrl}${base}/${uc.slug}`;

  const L = ko
    ? {
        home: '홈', use: '활용법', all: '모든 활용법',
        steps: '따라하기', open: '도구 열기',
        converts: '관련 변환', compares: '관련 비교', faq: '자주 묻는 질문',
        more: '다른 활용법', browseAll: '모든 도구 보기',
        privacy: '업로드 없음 · 브라우저에서 처리 · 무료',
      }
    : ja
      ? {
          home: 'ホーム', use: '活用法', all: 'すべての活用法',
          steps: '手順', open: 'ツールを開く',
          converts: '関連する変換', compares: '関連する比較', faq: 'よくある質問',
          more: '他の活用法', browseAll: 'すべてのツールを見る',
          privacy: 'アップロードなし · ブラウザで処理 · 無料',
        }
      : {
        home: 'Home', use: 'Guides', all: 'All guides',
        steps: 'Steps', open: 'Open tool',
        converts: 'Related conversions', compares: 'Related comparisons', faq: 'Frequently asked',
        more: 'More guides', browseAll: 'Browse all tools',
        privacy: 'No upload · Runs in your browser · Free',
      };

  const inLanguage = ko ? 'ko' : ja ? 'ja' : 'en';
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: uc.h1[lang] ?? uc.h1.en,
    description: uc.description[lang] ?? uc.description.en,
    inLanguage,
    step: uc.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name[lang] ?? s.name.en,
      text: s.text[lang] ?? s.text.en,
      url: `${siteUrl}${s.href}`,
    })),
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage,
    mainEntity: uc.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q[lang] ?? f.q.en,
      acceptedAnswer: { '@type': 'Answer', text: f.a[lang] ?? f.a.en },
    })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${siteUrl}${home}` },
      { '@type': 'ListItem', position: 2, name: L.use, item: `${siteUrl}${base}` },
      { '@type': 'ListItem', position: 3, name: uc.h1[lang] ?? uc.h1.en, item: canonical },
    ],
  };

  return (
    <div className="min-h-dvh bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href={base} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label={L.all} title={L.all}>
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Wrench className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{uc.h1[lang] ?? uc.h1.en}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href={home} className="hover:text-foreground">{L.home}</a>
          <span className="mx-1">/</span>
          <a href={base} className="hover:text-foreground">{L.use}</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{uc.h1[lang] ?? uc.h1.en}</span>
        </nav>

        <section className="space-y-3">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{categoryLabel}</span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{uc.h1[lang] ?? uc.h1.en}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{uc.intro[lang] ?? uc.intro.en}</p>
          <p className="text-[11px] text-muted-foreground">{L.privacy}</p>
        </section>

        {/* 단계 */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold">{L.steps}</h3>
          <ol className="space-y-3">
            {uc.steps.map((s, i) => (
              <li key={i} className="rounded-xl border bg-card p-4 flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="font-semibold text-sm">{s.name[lang] ?? s.name.en}</div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{s.text[lang] ?? s.text.en}</p>
                  <a
                    href={s.href}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    {L.open}
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {(relatedConverts.length > 0 || relatedCompares.length > 0) && (
          <section className="space-y-3">
            {relatedConverts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{L.converts}</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedConverts.map((r) => (
                    <a key={r.slug} href={`${convertBase}/${r.slug}`} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                      {r.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {relatedCompares.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{L.compares}</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedCompares.map((r) => (
                    <a key={r.slug} href={`${compareBase}/${r.slug}`} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors">
                      <GitCompare className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                      {r.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-lg font-bold">{L.faq}</h3>
          <div className="space-y-2">
            {uc.faqs.map((f, i) => (
              <details key={i} className="group rounded-xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <span className="font-medium text-sm">{f.q[lang] ?? f.q.en}</span>
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{f.a[lang] ?? f.a.en}</p>
              </details>
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">{L.more}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {others.map((o) => (
                <a key={o.slug} href={`${base}/${o.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">{o.title}</span>
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
