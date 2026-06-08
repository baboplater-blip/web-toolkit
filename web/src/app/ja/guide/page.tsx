import type { Metadata } from 'next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { JA_TOOLS, JA_TOOL_IDS } from '@/lib/ja-tools';
import { CATEGORY_GUIDES_JA } from '@/lib/category-guide-content-ja';

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
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const READY_COUNT = TOOLS.filter((t) => t.status === 'ready').length;

export const metadata: Metadata = {
  title: 'ツールガイド — Web Toolkit',
  description: `${READY_COUNT}個以上の無料ブラウザツールの使い方ガイド。PDF・画像・動画・音声・OCR・AI — 適切なツールとオプションの選び方を解説します。`,
  alternates: {
    canonical: '/ja/guide',
    languages: {
      'ko-KR': '/guide',
      en: '/en/guide',
      ja: '/ja/guide',
      'x-default': '/guide',
    },
  },
  openGraph: {
    title: 'ツールガイド — Web Toolkit',
    description: `${READY_COUNT}個以上の無料ブラウザツールの使い方ガイド。`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ja_JP',
    url: '/ja/guide',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit ガイド' },
    ],
  },
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/ja` },
    { '@type': 'ListItem', position: 2, name: 'ガイド', item: `${SITE_URL}/ja/guide` },
  ],
};

export default function JapaneseGuideIndexPage() {
  const readyTools = TOOLS.filter((t) => t.status === 'ready');
  const readyIds = new Set(readyTools.map((t) => t.id));

  // Curated Japanese guides, grouped by category in display order.
  const guideIds = JA_TOOL_IDS.filter((id) => readyIds.has(id));
  const toolById = new Map(readyTools.map((t) => [t.id, t] as const));
  const grouped = new Map<ToolCategory, string[]>();
  for (const id of guideIds) {
    const tool = toolById.get(id);
    if (!tool) continue;
    const arr = grouped.get(tool.category) ?? [];
    arr.push(id);
    grouped.set(tool.category, arr);
  }

  // Ready-tool count per category for the category-guide cards.
  const categoryCount = new Map<ToolCategory, number>();
  for (const tool of readyTools) {
    categoryCount.set(tool.category, (categoryCount.get(tool.category) ?? 0) + 1);
  }

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
            href="/ja"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="トップに戻る"
            title="戻る"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-base font-semibold">ツールガイド</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {guideIds.length} 件
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <section className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-sm leading-relaxed">
            各ツールの使い方、押さえるべきオプション、自分のケースに合うツールの選び方を、ステップごとに解説します。
          </p>
          <p className="text-[12px] text-muted-foreground">
            先に試したい場合は{' '}
            <a href="/ja/tools" className="text-primary underline">
              すべてのツール一覧
            </a>{' '}
            ·{' '}
            <a href="/guide" hrefLang="ko" className="underline hover:text-foreground">
              한국어ガイド
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">カテゴリ別ガイド</h2>
          <p className="text-[12px] text-muted-foreground">
            カテゴリを選ぶと、各ツールの仕組み・重要なオプション・自分のケースに合う選び方を解説します。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CATEGORY_ORDER.map((cat) => {
              const guide = CATEGORY_GUIDES_JA[cat];
              const count = categoryCount.get(cat) ?? 0;
              return (
                <a
                  key={cat}
                  href={`/ja/guide/category/${cat}`}
                  className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold">
                      {CATEGORY_LABELS_JA[cat]} ガイド
                    </h3>
                    <span className="text-[11px] text-muted-foreground">{count}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
                    {guide.metaDescription}
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => {
          const ids = grouped.get(cat)!;
          return (
            <section key={cat} className="space-y-3">
              <h2 className="text-lg font-bold flex items-baseline gap-2">
                {CATEGORY_LABELS_JA[cat]}
                <span className="text-xs font-normal text-muted-foreground">
                  {ids.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ids.map((id) => {
                  const ja = JA_TOOLS[id]!;
                  return (
                    <li key={id}>
                      <a
                        href={`/ja/guide/${id}`}
                        className="block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                      >
                        <span className="text-sm font-medium">{ja.name}</span>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {ja.tagline}
                        </p>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <footer className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>すべてのツールはブラウザ内で動作し、ファイルはアップロードされません。</p>
        </footer>
      </main>
    </div>
  );
}
