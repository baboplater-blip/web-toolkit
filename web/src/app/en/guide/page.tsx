import type { Metadata } from 'next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { CATEGORY_GUIDES_EN } from '@/lib/category-guide-content-en';
import { EN_TOOLS, EN_TOOL_IDS } from '@/lib/en-tools';

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

const CATEGORY_ORDER: ToolCategory[] = [
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

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const READY_COUNT = TOOLS.filter((t) => t.status === 'ready').length;

export const metadata: Metadata = {
  title: 'Tool Guides — Web Toolkit',
  description: `Step-by-step guides for ${READY_COUNT}+ free browser tools. PDF, image, video, audio, OCR, and AI — how to pick the right tool and the right options.`,
  alternates: {
    canonical: '/en/guide',
    languages: {
      'ko-KR': '/guide',
      en: '/en/guide',
      'x-default': '/guide',
    },
  },
  openGraph: {
    title: 'Tool Guides — Web Toolkit',
    description: `Step-by-step guides for ${READY_COUNT}+ free browser tools.`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'en_US',
    url: '/en/guide',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit guides' },
    ],
  },
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/en` },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/en/guide` },
  ],
};

export default function EnglishGuideIndexPage() {
  const readyTools = TOOLS.filter((t) => t.status === 'ready');
  const grouped = new Map<ToolCategory, typeof readyTools>();
  for (const t of readyTools) {
    const arr = grouped.get(t.category) ?? [];
    arr.push(t);
    grouped.set(t.category, arr);
  }
  for (const list of grouped.values()) list.sort((a, b) => a.phase - b.phase);

  const readyIds = new Set(readyTools.map((t) => t.id));
  const popularGuides = EN_TOOL_IDS.filter((id) => readyIds.has(id));

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-4">
          <a
            href="/en"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Back to landing"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-base font-semibold">Tool Guides</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {readyTools.length} tools
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <section className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-sm leading-relaxed">
            Pick a category to read a focused guide on how its tools work, what
            options matter, and which one fits your case best.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Want to skip ahead?{' '}
            <a href="/en/tools" className="text-primary underline">
              All tools catalog
            </a>{' '}
            ·{' '}
            <a href="/guide" hrefLang="ko" className="underline hover:text-foreground">
              한국어 가이드
            </a>
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => {
            const list = grouped.get(cat)!;
            const guide = CATEGORY_GUIDES_EN[cat];
            return (
              <a
                key={cat}
                href={`/en/guide/category/${cat}`}
                className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors space-y-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold">
                    {CATEGORY_LABELS_EN[cat]} Guide
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {list.length} tools
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
                  {guide.metaDescription}
                </p>
              </a>
            );
          })}
        </section>

        {popularGuides.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Popular tool guides</h2>
            <p className="text-[12px] text-muted-foreground">
              Step-by-step English guides for the most-searched tools.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {popularGuides.map((id) => {
                const en = EN_TOOLS[id]!;
                return (
                  <li key={id}>
                    <a
                      href={`/en/guide/${id}`}
                      className="block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                    >
                      <span className="text-sm font-medium">{en.name}</span>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {en.tagline}
                      </p>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>All tools run in your browser. Files never uploaded.</p>
        </footer>
      </main>
    </div>
  );
}
