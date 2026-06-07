import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { CATEGORY_GUIDES_ZH } from '@/lib/category-guide-content-zh';
import { ZH_TOOLS, hasZhCopy } from '@/lib/zh-tools';

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

const CATEGORY_LABELS_ZH: Record<ToolCategory, string> = {
  image: '图片',
  pdf: 'PDF',
  video: '视频',
  gif: 'GIF',
  audio: '音频',
  docs: '文档',
  text: '文本',
  dev: '开发者',
  util: '实用工具',
  security: '安全',
  ai: 'AI',
};

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
    return { title: '未找到分类 — Web Toolkit' };
  }
  const guide = CATEGORY_GUIDES_ZH[cat];
  const canonical = `/zh/guide/category/${cat}`;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: [
      ...guide.keywords,
      CATEGORY_LABELS_ZH[cat],
      '浏览器 工具',
      '免费',
      '在线',
      '无需上传',
    ],
    alternates: {
      canonical,
      languages: {
        'ko-KR': `/guide/category/${cat}`,
        en: `/en/guide/category/${cat}`,
        ja: `/ja/guide/category/${cat}`,
        zh: canonical,
        'x-default': `/guide/category/${cat}`,
      },
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'website',
      siteName: 'Web Toolkit',
      locale: 'zh_CN',
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

export default async function ChineseCategoryGuidePage({ params }: PageProps) {
  const { cat } = await params;
  if (!isCategory(cat)) notFound();

  const guide = CATEGORY_GUIDES_ZH[cat];
  const categoryLabel = CATEGORY_LABELS_ZH[cat];
  const tools = TOOLS.filter((t) => t.status === 'ready' && t.category === cat).sort(
    (a, b) => a.phase - b.phase,
  );

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

  // Resolve the best link target for a tool card.
  // zh-copy tools get the dedicated /zh/tools/{id} landing; the rest fall back
  // to the Korean tool page (icon-driven, language-agnostic).
  const toolHref = (id: string, koHref: string) =>
    hasZhCopy(id) ? `/zh/tools/${id}` : koHref;
  const toolName = (id: string, koTitle: string) =>
    hasZhCopy(id) ? ZH_TOOLS[id]!.name : koTitle;
  const toolTagline = (id: string, koDesc: string) =>
    hasZhCopy(id) ? ZH_TOOLS[id]!.tagline : koDesc;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/zh` },
      { '@type': 'ListItem', position: 2, name: '指南', item: `${SITE_URL}/zh/guide` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${categoryLabel} 指南`,
        item: `${SITE_URL}/zh/guide/category/${cat}`,
      },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryLabel} 工具一览`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${toolHref(t.id, t.href)}`,
      name: toolName(t.id, t.title),
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'zh',
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
    inLanguage: 'zh',
    isPartOf: { '@type': 'WebSite', name: 'Web Toolkit', url: SITE_URL },
    url: `${SITE_URL}/zh/guide/category/${cat}`,
    mainEntity: { '@id': `${SITE_URL}/zh/guide/category/${cat}#tools` },
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
            href="/zh/guide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="全部指南"
            title="全部指南"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">
            {categoryLabel} 工具指南
          </h1>
          <span className="ml-auto text-[11px] text-muted-foreground">{tools.length}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/zh" className="hover:text-foreground">首页</a>
          <span className="mx-1">/</span>
          <a href="/zh/guide" className="hover:text-foreground">指南</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{categoryLabel}</span>
          <span className="mx-2 text-muted-foreground/60">·</span>
          <a
            href={`/guide/category/${cat}`}
            hrefLang="ko"
            className="underline hover:text-foreground"
          >
            한국어
          </a>
          <span className="mx-1 text-muted-foreground/60">·</span>
          <a
            href={`/en/guide/category/${cat}`}
            hrefLang="en"
            className="underline hover:text-foreground"
          >
            English
          </a>
          <span className="mx-1 text-muted-foreground/60">·</span>
          <a
            href={`/ja/guide/category/${cat}`}
            hrefLang="ja"
            className="underline hover:text-foreground"
          >
            日本語
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
              href="/zh/tools"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              查看{categoryLabel}工具
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/zh/guide"
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              全部指南
            </a>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            这个分类能做什么
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
            {categoryLabel} 工具一览
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {tools.length}
            </span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tools.map((t) => (
              <li key={t.id}>
                <a
                  href={toolHref(t.id, t.href)}
                  className="block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">
                      {toolName(t.id, t.title)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {toolTagline(t.id, t.description)}
                  </p>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground pt-1">
            工具页面在可行范围内支持多语言。部分界面标签可能仍为韩文，但多数以图标为主，与语言无关。
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">常见问题</h3>
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
            <h3 className="text-lg font-bold">相关指南</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {related.map((rc) => (
                <a
                  key={rc}
                  href={`/zh/guide/category/${rc}`}
                  className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium">
                      {CATEGORY_LABELS_ZH[rc]} 指南
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {CATEGORY_GUIDES_ZH[rc].metaDescription}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">
            这里的{categoryLabel}工具全部免费。
          </p>
          <a
            href="/zh/tools"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            试用一下
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            无需注册 · 文件不会离开浏览器。
          </p>
        </section>
      </main>
    </div>
  );
}
