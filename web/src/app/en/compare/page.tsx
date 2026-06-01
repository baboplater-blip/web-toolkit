import type { Metadata } from 'next';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { COMPARES } from '@/lib/en-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Tool Comparisons — Web Toolkit',
  description:
    'Plain-English comparisons to pick the right tool or format: PNG vs JPG, HEIC vs JPG, merge vs split PDF, MD5 vs SHA-256 and more.',
  alternates: {
    canonical: '/en/compare',
    languages: { en: '/en/compare', 'x-default': '/en/compare' },
  },
  openGraph: {
    title: 'Tool Comparisons — Web Toolkit',
    description: 'Pick the right tool or format with quick, practical comparisons.',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'en_US',
    url: '/en/compare',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit comparisons' },
    ],
  },
};

const ITEMLIST_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Tool Comparisons',
  numberOfItems: COMPARES.length,
  itemListElement: COMPARES.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/en/compare/${c.slug}`,
    name: c.h1,
  })),
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/en` },
    { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/en/compare` },
  ],
};

export default function CompareIndexPage() {
  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ITEMLIST_JSON_LD) }}
      />
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
          <GitCompare className="h-5 w-5" />
          <h1 className="text-base font-semibold">Tool Comparisons</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {COMPARES.length}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <section className="rounded-xl border bg-card p-4 text-sm">
          <p>
            Not sure which tool or format to pick? These quick, practical
            comparisons explain the trade-offs and point you to the right tool —
            all free and browser-only.
          </p>
        </section>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPARES.map((c) => (
            <li key={c.slug}>
              <a
                href={`/en/compare/${c.slug}`}
                className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors space-y-2 h-full"
              >
                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <h2 className="text-base font-bold">{c.h1}</h2>
                </div>
                <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
                  {c.description}
                </p>
              </a>
            </li>
          ))}
        </ul>

        <footer className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>
            <a href="/en/tools" className="underline hover:text-foreground">
              All tools
            </a>{' '}
            ·{' '}
            <a href="/en/guide" className="underline hover:text-foreground">
              Guides
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
