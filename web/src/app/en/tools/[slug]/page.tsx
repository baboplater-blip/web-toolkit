import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GitCompare,
  Lock,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { TOOLS, type ToolCategory, type ToolMeta } from '@/lib/tools/registry';
import { EN_TOOLS, EN_TOOL_IDS, getEnCopy } from '@/lib/en-tools';
import { hasJaCopy } from '@/lib/ja-tools';
import { hasZhCopy } from '@/lib/zh-tools';
import { comparesForTool } from '@/lib/en-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

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
  return EN_TOOL_IDS.filter((id) =>
    TOOLS.some((t) => t.id === id && t.status === 'ready'),
  ).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findTool(slug: string): ToolMeta | undefined {
  if (!getEnCopy(slug)) return undefined;
  return TOOLS.find((t) => t.id === slug && t.status === 'ready');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  const en = getEnCopy(slug);
  if (!tool || !en) {
    return { title: 'Tool not found — Web Toolkit' };
  }
  const canonical = `/en/tools/${tool.id}`;
  const title = `${en.name} — Free Online, No Upload`;
  const description = `${en.description} Free, no signup, runs entirely in your browser.`.slice(
    0,
    155,
  );
  return {
    title,
    description,
    keywords: [...en.keywords, 'free', 'online', 'no upload', 'browser tool', 'no signup'],
    alternates: {
      canonical,
      languages: {
        'ko-KR': tool.href,
        en: canonical,
        ...(hasJaCopy(tool.id) ? { ja: `/ja/tools/${tool.id}` } : {}),
        ...(hasZhCopy(tool.id) ? { zh: `/zh/tools/${tool.id}` } : {}),
        'x-default': canonical,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Web Toolkit',
      locale: 'en_US',
      url: canonical,
      images: [
        { url: `/og/tools/${tool.id}.png`, width: 1200, height: 630, alt: en.name },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/tools/${tool.id}.png`],
    },
  };
}

const WHY_USE: ReadonlyArray<{ icon: typeof Zap; title: string; body: string }> = [
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'Everything runs in your browser with Web Workers and WebAssembly. Your data is never uploaded to a server.',
  },
  {
    icon: Zap,
    title: 'Instant & free',
    body: 'No signup, no installation, no usage limits. Open the page and start working immediately.',
  },
  {
    icon: Lock,
    title: 'Works offline',
    body: 'Once loaded it keeps working without a connection, and you can install it as a PWA to your home screen.',
  },
  {
    icon: Sparkles,
    title: 'Mobile-ready',
    body: 'Designed mobile-first and verified on iOS Safari and Android Chrome — full functionality on any device.',
  },
];

export default async function EnglishToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = findTool(slug);
  const en = getEnCopy(slug);
  if (!tool || !en) notFound();

  const categoryLabel = CATEGORY_LABELS_EN[tool.category];

  const related = TOOLS.filter(
    (t) =>
      t.status === 'ready' &&
      t.category === tool.category &&
      t.id !== tool.id &&
      EN_TOOLS[t.id],
  )
    .sort((a, b) => a.phase - b.phase)
    .slice(0, 4);

  const compares = comparesForTool(tool.id);

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: en.name,
    description: en.description,
    url: `${SITE_URL}/en/tools/${tool.id}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    inLanguage: 'en',
    browserRequirements: 'Requires a modern web browser with JavaScript.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    image: `${SITE_URL}/og/tools/${tool.id}.png`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/en` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/en/tools` },
      { '@type': 'ListItem', position: 3, name: en.name, item: `${SITE_URL}/en/tools/${tool.id}` },
    ],
  };

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a
            href="/en/tools"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="All tools"
            title="All tools"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <tool.icon className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{en.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/en" className="hover:text-foreground">Home</a>
          <span className="mx-1">/</span>
          <a href="/en/tools" className="hover:text-foreground">Tools</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{en.name}</span>
          <span className="mx-2 text-muted-foreground/60">·</span>
          <a href={tool.href} hrefLang="ko" className="underline hover:text-foreground">
            한국어
          </a>
        </nav>

        <section className="space-y-4">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {categoryLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            {en.name} — free, in your browser
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {en.tagline} {en.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={tool.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Wrench className="h-4 w-4" />
              Open the tool
            </a>
            <a
              href={`/en/guide/${tool.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <BookOpen className="h-4 w-4" />
              How-to guide
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground">
            No signup · no upload · files never leave your device.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WHY_USE.map((w, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <w.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <h3 className="text-sm font-semibold">{w.title}</h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{w.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What you can search for
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {en.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {k}
              </span>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Looking for step-by-step instructions and answers to common
            questions?{' '}
            <a href={`/en/guide/${tool.id}`} className="text-primary underline">
              Read the {en.name} guide
            </a>
            .
          </p>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">More {categoryLabel} tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((t) => {
                const rc = EN_TOOLS[t.id]!;
                return (
                  <a
                    key={t.id}
                    href={`/en/tools/${t.id}`}
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
        )}

        {compares.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">Compare</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {compares.map((c) => (
                <a
                  key={c.slug}
                  href={`/en/compare/${c.slug}`}
                  className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">{c.h1}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {c.description}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">Use {en.name} now — it's free.</p>
          <a
            href={tool.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open the tool
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            Browser-only · files never uploaded.
          </p>
        </section>
      </main>
    </div>
  );
}
