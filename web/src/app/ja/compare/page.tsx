import type { Metadata } from 'next';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { COMPARES_JA } from '@/lib/ja-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'ツール比較 — 何を選べばいい？',
  description:
    'PNG vs JPG、HEIC vs JPG、MD5 vs SHA-256 など、迷いやすいフォーマット・ツールを並べて比較。アップロードなしでブラウザですぐ変換・計算。',
  keywords: ['フォーマット 比較', 'png jpg', 'webp png', 'md5 sha256', 'ツール 比較', '違い'],
  alternates: {
    canonical: '/ja/compare',
    languages: { 'ko-KR': '/compare', en: '/en/compare', ja: '/ja/compare', zh: '/zh/compare', 'x-default': '/compare' },
  },
  openGraph: {
    title: 'ツール比較 — Web Toolkit',
    description: '迷いやすいフォーマット・ツールを、実用的な比較で選べます。',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ja_JP',
    url: '/ja/compare',
    images: [{ url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit comparisons' }],
  },
};

const ITEMLIST_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'ツール比較',
  numberOfItems: COMPARES_JA.length,
  itemListElement: COMPARES_JA.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/ja/compare/${c.slug}`,
    name: c.h1,
  })),
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/ja` },
    { '@type': 'ListItem', position: 2, name: '比較', item: `${SITE_URL}/ja/compare` },
  ],
};

export default function CompareIndexJa() {
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
            href="/ja"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="トップへ戻る"
            title="戻る"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <GitCompare className="h-5 w-5" />
          <h1 className="text-base font-semibold">ツール比較</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">{COMPARES_JA.length}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <section className="rounded-xl border bg-card p-4 text-sm">
          <p>
            どのツールやフォーマットを選べばいいか迷ったら、これらの実用的な比較がトレードオフを説明し、最適なツールへ案内します。すべて無料・ブラウザのみ。
          </p>
        </section>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPARES_JA.map((c) => (
            <li key={c.slug}>
              <a
                href={`/ja/compare/${c.slug}`}
                className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors space-y-2 h-full"
              >
                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <h2 className="text-base font-bold">{c.h1}</h2>
                </div>
                <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">{c.description}</p>
              </a>
            </li>
          ))}
        </ul>

        <footer className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>
            <a href="/ja/tools" className="underline hover:text-foreground">
              すべてのツール
            </a>{' '}
            ·{' '}
            <a href="/ja/guide" className="underline hover:text-foreground">
              ガイド
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
