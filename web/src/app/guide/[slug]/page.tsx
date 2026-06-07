import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolMeta,
} from '@/lib/tools/registry';
import { buildGuide } from '@/lib/guide-content';
import { hasEnCopy } from '@/lib/en-tools';
import { SponsoredTip } from '@/components/SponsoredTip';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

/**
 * 정적 export 환경에서 123개 도구 가이드를 빌드 시점에 prerender.
 * Next.js App Router 의 generateStaticParams 가 모든 경로를 미리 생성한다.
 */
export function generateStaticParams() {
  return TOOLS.filter((t) => t.status === 'ready').map((t) => ({ slug: t.id }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findTool(slug: string): Promise<ToolMeta | undefined> {
  return TOOLS.find((t) => t.id === slug && t.status === 'ready');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await findTool(slug);
  if (!tool) {
    return { title: '가이드를 찾을 수 없습니다 — Web Toolkit' };
  }
  const guide = buildGuide(tool);
  const canonical = `/guide/${tool.id}`;
  const enGuide = hasEnCopy(tool.id) ? `/en/guide/${tool.id}` : undefined;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: [
      ...(tool.keywords ?? []),
      '사용법',
      '가이드',
      '튜토리얼',
      'how to',
      '무료',
    ],
    alternates: {
      canonical,
      languages: {
        'ko-KR': canonical,
        ...(enGuide ? { en: enGuide } : {}),
        'x-default': canonical,
      },
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ko_KR',
      url: canonical,
      images: [
        {
          url: `/og/tools/${tool.id}.png`,
          width: 1200,
          height: 630,
          alt: `${tool.title} 가이드`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: [`/og/tools/${tool.id}.png`],
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await findTool(slug);
  if (!tool) notFound();

  const guide = buildGuide(tool);
  const categoryLabel = CATEGORY_LABELS[tool.category];

  // 관련 도구 추천 (같은 카테고리 3개)
  const related = TOOLS.filter(
    (t) => t.status === 'ready' && t.category === tool.category && t.id !== tool.id,
  )
    .sort((a, b) => a.phase - b.phase)
    .slice(0, 4);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.metaTitle,
    description: guide.metaDescription,
    inLanguage: 'ko-KR',
    datePublished: tool.addedAt ?? '2026-05-01',
    dateModified: new Date().toISOString().slice(0, 10),
    author: {
      '@type': 'Organization',
      name: 'Web Toolkit',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Web Toolkit',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/guide/${tool.id}`,
    image: `${SITE_URL}/og/tools/${tool.id}.png`,
    about: {
      '@type': 'WebApplication',
      name: tool.title,
      url: `${SITE_URL}${tool.href}`,
    },
  };

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
        item: `${SITE_URL}/guide/category/${tool.category}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: tool.title,
        item: `${SITE_URL}/guide/${tool.id}`,
      },
    ],
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

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
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
            {tool.title} 가이드
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/" className="hover:text-foreground">홈</a>
          <span className="mx-1">/</span>
          <a href="/guide" className="hover:text-foreground">가이드</a>
          <span className="mx-1">/</span>
          <a
            href={`/guide/category/${tool.category}`}
            className="hover:text-foreground"
          >
            {categoryLabel}
          </a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{tool.title}</span>
          {hasEnCopy(tool.id) && (
            <>
              <span className="mx-2 text-muted-foreground/60">·</span>
              <a
                href={`/en/guide/${tool.id}`}
                hrefLang="en"
                className="underline hover:text-foreground"
              >
                English
              </a>
            </>
          )}
        </nav>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {categoryLabel}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            {tool.title} 사용 방법
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {guide.intro}
          </p>
          <a
            href={tool.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            지금 사용하기
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            핵심 기능
          </h3>
          <ul className="space-y-1.5">
            {guide.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">단계별 사용법</h3>
          <ol className="space-y-3">
            {guide.steps.map((s, i) => (
              <li
                key={i}
                id={`step${i + 1}`}
                className="rounded-xl border bg-card p-4 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold text-base">{s.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-9">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

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
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">관련 도구</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((t) => (
                <a
                  key={t.id}
                  href={`/guide/${t.id}`}
                  className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">{t.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {t.description}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <SponsoredTip toolId={tool.id} category={tool.category} />

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">
            {tool.title}을(를) 지금 바로 사용해 보세요.
          </p>
          <a
            href={tool.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            도구 열기
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
