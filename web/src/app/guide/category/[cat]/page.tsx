import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowRightLeft, BookOpen, CheckCircle2, Wrench } from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolCategory,
} from '@/lib/tools/registry';
import { CATEGORY_GUIDES } from '@/lib/category-guide-content';
import { CONVERSIONS, FORMATS, conversionCategory, conversionSlug } from '@/lib/convert-matrix';
import { USE_CASES } from '@/lib/use-cases';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const ALL_CATEGORIES: ToolCategory[] = [
  'pdf',
  'image',
  'video',
  'gif',
  'audio',
  'docs',
  'text',
  'dev',
  'util',
  'security',
  'ai',
];

export function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({ cat }));
}

interface PageProps {
  params: Promise<{ cat: string }>;
}

function isCategory(v: string): v is ToolCategory {
  return (ALL_CATEGORIES as string[]).includes(v);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cat } = await params;
  if (!isCategory(cat)) {
    return { title: '카테고리를 찾을 수 없습니다 — Web Toolkit' };
  }
  const guide = CATEGORY_GUIDES[cat];
  const canonical = `/guide/category/${cat}`;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: [...guide.keywords, CATEGORY_LABELS[cat], '브라우저 도구', '무료', '온라인'],
    alternates: {
      canonical,
      languages: {
        'ko-KR': canonical,
        en: `/en/guide/category/${cat}`,
        ja: `/ja/guide/category/${cat}`,
        'x-default': canonical,
      },
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'website',
      siteName: 'Web Toolkit',
      locale: 'ko_KR',
      url: canonical,
      images: [
        {
          url: `/og/${cat}.png`,
          width: 1200,
          height: 630,
          alt: guide.h1,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: [`/og/${cat}.png`],
    },
  };
}

export default async function CategoryGuidePage({ params }: PageProps) {
  const { cat } = await params;
  if (!isCategory(cat)) notFound();

  const guide = CATEGORY_GUIDES[cat];
  const categoryLabel = CATEGORY_LABELS[cat];
  const tools = TOOLS.filter((t) => t.status === 'ready' && t.category === cat).sort(
    (a, b) => a.phase - b.phase,
  );

  // 같은 라운드에서 보고 갈 만한 관련 카테고리 — 도메인 인접성 기준 매핑
  const RELATED_MAP: Record<ToolCategory, ToolCategory[]> = {
    pdf: ['image', 'docs', 'security'],
    image: ['pdf', 'ai', 'docs'],
    video: ['gif', 'audio', 'image'],
    gif: ['video', 'image', 'ai'],
    audio: ['video', 'docs', 'util'],
    docs: ['pdf', 'text', 'image'],
    text: ['docs', 'dev', 'util'],
    dev: ['text', 'util', 'security'],
    util: ['dev', 'text', 'security'],
    security: ['pdf', 'dev', 'util'],
    ai: ['image', 'video', 'gif'],
  };
  const related = RELATED_MAP[cat];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: '가이드', item: `${SITE_URL}/guide` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${categoryLabel} 가이드`,
        item: `${SITE_URL}/guide/category/${cat}`,
      },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryLabel} 도구 모음`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/guide/${t.id}`,
      name: t.title,
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: guide.h1,
    description: guide.metaDescription,
    inLanguage: 'ko-KR',
    isPartOf: { '@type': 'WebSite', name: 'Web Toolkit', url: SITE_URL },
    url: `${SITE_URL}/guide/category/${cat}`,
    mainEntity: { '@id': `${SITE_URL}/guide/category/${cat}#tools` },
  };

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-4">
          <a
            href="/guide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="가이드 목록"
            title="가이드 목록"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">
            {categoryLabel} 도구 가이드
          </h1>
          <span className="ml-auto text-[11px] text-muted-foreground">{tools.length}개</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/" className="hover:text-foreground">홈</a>
          <span className="mx-1">/</span>
          <a href="/guide" className="hover:text-foreground">가이드</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{categoryLabel}</span>
          <span className="mx-2 text-muted-foreground/60">·</span>
          <a
            href={`/en/guide/category/${cat}`}
            hrefLang="en"
            className="underline hover:text-foreground"
          >
            English
          </a>
        </nav>

        <section className="space-y-3">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {categoryLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{guide.h1}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {guide.intro}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={`/tools?category=${cat}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {categoryLabel} 도구 둘러보기
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/guide"
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              전체 가이드
            </a>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            이 카테고리의 핵심
          </h3>
          <ul className="space-y-1.5">
            {guide.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="tools" className="space-y-3">
          <h3 className="text-lg font-bold">
            {categoryLabel} 도구 전체
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {tools.length}개
            </span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tools.map((t) => (
              <li key={t.id}>
                <a
                  href={`/guide/${t.id}`}
                  className="block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">{t.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {t.description}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {(() => {
          const catConverts = CONVERSIONS.filter(
            (c) => conversionCategory(FORMATS[c.from], FORMATS[c.to]) === cat,
          ).slice(0, 8);
          const catUses = USE_CASES.filter((u) => u.category === cat);
          if (catConverts.length === 0 && catUses.length === 0) return null;
          return (
            <section className="space-y-4">
              {catConverts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />빠른 변환
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {catConverts.map((c) => {
                      const slug = conversionSlug(c);
                      return (
                        <a key={slug} href={`/convert/${slug}`} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors">
                          {FORMATS[c.from].label} → {FORMATS[c.to].label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              {catUses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Wrench className="h-3.5 w-3.5" aria-hidden />활용법
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {catUses.map((u) => (
                      <a key={u.slug} href={`/use/${u.slug}`} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium hover:border-primary transition-colors">
                        {u.h1.ko}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        <section className="space-y-3">
          <h3 className="text-lg font-bold">자주 묻는 질문</h3>
          <div className="space-y-2">
            {guide.faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <span className="font-medium text-sm">{f.q}</span>
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">함께 보면 좋은 가이드</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {related.map((rc) => (
                <a
                  key={rc}
                  href={`/guide/category/${rc}`}
                  className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium">
                      {CATEGORY_LABELS[rc]} 가이드
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {CATEGORY_GUIDES[rc].metaDescription}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">
            {categoryLabel} 카테고리의 모든 도구는 무료입니다.
          </p>
          <a
            href={`/tools?category=${cat}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            지금 사용하러 가기
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            회원가입 없이 즉시 사용 · 파일이 서버로 전송되지 않습니다.
          </p>
        </section>
      </main>
    </div>
  );
}
