import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { CATEGORY_GUIDES_EN } from '@/lib/category-guide-content-en';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
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

const CATEGORY_LABELS_EN: Record<ToolCategory, string> = {
  image: 'Image',
  pdf: 'PDF',
  video: 'Video',
  gif: 'GIF',
  audio: 'Audio',
  docs: 'Documents',
  text: 'Text',
  dev: 'Developer',
  util: 'Utility',
  security: 'Security',
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
    return { title: 'Category not found — Web Toolkit' };
  }
  const guide = CATEGORY_GUIDES_EN[cat];
  const canonical = `/en/guide/category/${cat}`;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: [
      ...guide.keywords,
      CATEGORY_LABELS_EN[cat],
      'browser tools',
      'free',
      'online',
      'no upload',
    ],
    alternates: {
      canonical,
      languages: {
        'ko-KR': `/guide/category/${cat}`,
        en: canonical,
        ja: `/ja/guide/category/${cat}`,
        zh: `/zh/guide/category/${cat}`,
        'x-default': `/guide/category/${cat}`,
      },
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'website',
      siteName: 'Web Toolkit',
      locale: 'en_US',
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

export default async function EnglishCategoryGuidePage({ params }: PageProps) {
  const { cat } = await params;
  if (!isCategory(cat)) notFound();

  const guide = CATEGORY_GUIDES_EN[cat];
  const categoryLabel = CATEGORY_LABELS_EN[cat];
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/en` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/en/guide` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${categoryLabel} Guide`,
        item: `${SITE_URL}/en/guide/category/${cat}`,
      },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryLabel} Tools Collection`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${t.href}`,
      name: t.title,
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'en',
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
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'Web Toolkit', url: SITE_URL },
    url: `${SITE_URL}/en/guide/category/${cat}`,
    mainEntity: { '@id': `${SITE_URL}/en/guide/category/${cat}#tools` },
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
            href="/en/guide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="All guides"
            title="All guides"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">
            {categoryLabel} Tools Guide
          </h1>
          <span className="ml-auto text-[11px] text-muted-foreground">{tools.length}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/en" className="hover:text-foreground">Home</a>
          <span className="mx-1">/</span>
          <a href="/en/guide" className="hover:text-foreground">Guides</a>
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
              Browse {categoryLabel} tools
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/en/guide"
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              All guides
            </a>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What you can do
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
            All {categoryLabel} Tools
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {tools.length}
            </span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tools.map((t) => (
              <li key={t.id}>
                <a
                  href={t.href}
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
          <p className="text-[11px] text-muted-foreground pt-1">
            Tool pages are currently bilingual where possible; UI labels may still be
            in Korean. Most are icon-driven and language-agnostic.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">Frequently asked</h3>
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
            <h3 className="text-lg font-bold">Related guides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {related.map((rc) => (
                <a
                  key={rc}
                  href={`/en/guide/category/${rc}`}
                  className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium">
                      {CATEGORY_LABELS_EN[rc]} Guide
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {CATEGORY_GUIDES_EN[rc].metaDescription}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">
            Every {categoryLabel} tool here is free.
          </p>
          <a
            href={`/tools?category=${cat}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Start using
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            No signup · files never leave your browser.
          </p>
        </section>
      </main>
    </div>
  );
}
