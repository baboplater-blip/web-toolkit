import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Wrench } from 'lucide-react';
import { TOOLS, type ToolCategory, type ToolMeta } from '@/lib/tools/registry';
import { JA_TOOLS, JA_TOOL_IDS, getJaCopy } from '@/lib/ja-tools';
import { hasEnCopy } from '@/lib/en-tools';
import { buildGuideJa } from '@/lib/guide-content-ja';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_JA: Record<ToolCategory, string> = {
  image: '画像',
  pdf: 'PDF',
  video: '動画',
  gif: 'GIF',
  audio: '音声',
  docs: '文書',
  text: 'テキスト',
  dev: '開発者向け',
  util: 'ユーティリティ',
  security: 'セキュリティ',
  ai: 'AI',
};

/** Curated Japanese guides only — IDs that have bespoke Japanese copy. */
export function generateStaticParams() {
  return JA_TOOL_IDS.filter((id) =>
    TOOLS.some((t) => t.id === id && t.status === 'ready'),
  ).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findTool(slug: string): ToolMeta | undefined {
  if (!getJaCopy(slug)) return undefined;
  return TOOLS.find((t) => t.id === slug && t.status === 'ready');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  const ja = getJaCopy(slug);
  if (!tool || !ja) {
    return { title: 'ガイドが見つかりません — Web Toolkit' };
  }
  const guide = buildGuideJa(tool, ja);
  const canonical = `/ja/guide/${tool.id}`;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: [...ja.keywords, '使い方', 'チュートリアル', 'ガイド', '無料', 'アップロード不要'],
    alternates: {
      canonical,
      languages: {
        'ko-KR': `/guide/${tool.id}`,
        en: hasEnCopy(tool.id) ? `/en/guide/${tool.id}` : '/en/guide',
        ja: canonical,
        'x-default': `/guide/${tool.id}`,
      },
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ja_JP',
      url: canonical,
      images: [
        { url: `/og/tools/${tool.id}.png`, width: 1200, height: 630, alt: `${ja.name} ガイド` },
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

export default async function JapaneseGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const tool = findTool(slug);
  const ja = getJaCopy(slug);
  if (!tool || !ja) notFound();

  const guide = buildGuideJa(tool, ja);
  const categoryLabel = CATEGORY_LABELS_JA[tool.category];

  // Related = other curated Japanese tools in the same category.
  const related = TOOLS.filter(
    (t) =>
      t.status === 'ready' &&
      t.category === tool.category &&
      t.id !== tool.id &&
      JA_TOOLS[t.id],
  )
    .sort((a, b) => a.phase - b.phase)
    .slice(0, 4);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.metaTitle,
    description: guide.metaDescription,
    inLanguage: 'ja',
    datePublished: tool.addedAt ?? '2026-05-01',
    dateModified: new Date().toISOString().slice(0, 10),
    author: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/ja/guide/${tool.id}`,
    image: `${SITE_URL}/og/tools/${tool.id}.png`,
    about: { '@type': 'WebApplication', name: ja.name, url: `${SITE_URL}${tool.href}` },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/ja` },
      { '@type': 'ListItem', position: 2, name: 'ガイド', item: `${SITE_URL}/ja/guide` },
      { '@type': 'ListItem', position: 3, name: ja.name, item: `${SITE_URL}/ja/guide/${tool.id}` },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'ja',
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
            href="/ja/guide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="すべてのガイド"
            title="すべてのガイド"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">
            {ja.name} ガイド
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/ja" className="hover:text-foreground">ホーム</a>
          <span className="mx-1">/</span>
          <a href="/ja/guide" className="hover:text-foreground">ガイド</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{ja.name}</span>
          <span className="mx-2 text-muted-foreground/60">·</span>
          <a
            href={`/guide/${tool.id}`}
            hrefLang="ko"
            className="underline hover:text-foreground"
          >
            한국어
          </a>
        </nav>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {categoryLabel}
            </span>
            <a
              href={`/ja/tools/${tool.id}`}
              className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              ツールページ
            </a>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            {ja.name}の使い方
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {guide.intro}
          </p>
          <a
            href={tool.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            ツールを開く
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            主な特長
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
          <h3 className="text-lg font-bold">手順</h3>
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
          <h3 className="text-lg font-bold">よくある質問</h3>
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

        {related.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">関連ガイド</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((t) => {
                const rc = JA_TOOLS[t.id]!;
                return (
                  <a
                    key={t.id}
                    href={`/ja/guide/${t.id}`}
                    className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                      <span className="text-sm font-medium truncate">{rc.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {rc.tagline}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>
        ) : (
          <section>
            <a
              href="/ja/guide"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <BookOpen className="h-4 w-4" />
              すべてのガイドを見る
            </a>
          </section>
        )}

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">{ja.name}を試してみませんか？</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={tool.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Wrench className="h-4 w-4" />
              ツールを開く
            </a>
            <a
              href={`/ja/tools/${tool.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              ツール概要
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground">
            登録不要・ファイルはブラウザの外に出ません。
          </p>
        </section>
      </main>
    </div>
  );
}
