import type { Metadata } from 'next';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { COMPARES_ZH } from '@/lib/zh-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

export const metadata: Metadata = {
  title: '工具对比 — 该选哪个？',
  description:
    'PNG vs JPG、HEIC vs JPG、MD5 vs SHA-256 等，把容易混淆的格式与工具并排对比。无需上传，在浏览器中即可转换与计算。',
  keywords: ['格式 对比', 'png jpg', 'webp png', 'md5 sha256', '工具 对比', '区别'],
  alternates: {
    canonical: '/zh/compare',
    languages: { 'ko-KR': '/compare', en: '/en/compare', ja: '/ja/compare', zh: '/zh/compare', 'x-default': '/compare' },
  },
  openGraph: {
    title: '工具对比 — Web Toolkit',
    description: '把容易混淆的格式与工具，用实用的对比帮你选择。',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'zh_CN',
    url: '/zh/compare',
    images: [{ url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit comparisons' }],
  },
};

const ITEMLIST_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: '工具对比',
  numberOfItems: COMPARES_ZH.length,
  itemListElement: COMPARES_ZH.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/zh/compare/${c.slug}`,
    name: c.h1,
  })),
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/zh` },
    { '@type': 'ListItem', position: 2, name: '对比', item: `${SITE_URL}/zh/compare` },
  ],
};

export default function CompareIndexZh() {
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
            href="/zh"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="返回首页"
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <GitCompare className="h-5 w-5" />
          <h1 className="text-base font-semibold">工具对比</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">{COMPARES_ZH.length}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <section className="rounded-xl border bg-card p-4 text-sm">
          <p>
            不确定该选哪个工具或格式时，这些实用对比会解释各自的取舍，并引导你找到最合适的工具。全部免费、仅在浏览器中运行。
          </p>
        </section>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPARES_ZH.map((c) => (
            <li key={c.slug}>
              <a
                href={`/zh/compare/${c.slug}`}
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
            <a href="/zh/tools" className="underline hover:text-foreground">
              全部工具
            </a>{' '}
            ·{' '}
            <a href="/zh/guide" className="underline hover:text-foreground">
              指南
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
