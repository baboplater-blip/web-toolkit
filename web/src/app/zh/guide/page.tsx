import type { Metadata } from 'next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { ZH_TOOLS, ZH_TOOL_IDS } from '@/lib/zh-tools';
import { CATEGORY_GUIDES_ZH } from '@/lib/category-guide-content-zh';

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
  title: '工具指南 — Web Toolkit',
  description: `${READY_COUNT}+ 款免费浏览器工具的使用指南。PDF、图片、视频、音频、OCR、AI — 详解如何选择合适的工具与选项。`,
  alternates: {
    canonical: '/zh/guide',
    languages: {
      'ko-KR': '/guide',
      en: '/en/guide',
      ja: '/ja/guide',
      zh: '/zh/guide',
      'x-default': '/guide',
    },
  },
  openGraph: {
    title: '工具指南 — Web Toolkit',
    description: `${READY_COUNT}+ 款免费浏览器工具的使用指南。`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'zh_CN',
    url: '/zh/guide',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit 指南' },
    ],
  },
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/zh` },
    { '@type': 'ListItem', position: 2, name: '指南', item: `${SITE_URL}/zh/guide` },
  ],
};

export default function ChineseGuideIndexPage() {
  const readyTools = TOOLS.filter((t) => t.status === 'ready');
  const readyIds = new Set(readyTools.map((t) => t.id));

  // Curated Chinese guides, grouped by category in display order.
  const guideIds = ZH_TOOL_IDS.filter((id) => readyIds.has(id));
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
            href="/zh"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="返回首页"
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-base font-semibold">工具指南</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {guideIds.length} 篇
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <section className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-sm leading-relaxed">
            逐步讲解每款工具的使用方法、需要掌握的选项，以及如何选择适合自身场景的工具。
          </p>
          <p className="text-[12px] text-muted-foreground">
            如果想先试用，请见{' '}
            <a href="/zh/tools" className="text-primary underline">
              全部工具一览
            </a>{' '}
            ·{' '}
            <a href="/guide" hrefLang="ko" className="underline hover:text-foreground">
              한국어指南
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">按分类的指南</h2>
          <p className="text-[12px] text-muted-foreground">
            选择一个分类，即可了解每款工具的原理、重要选项，以及如何选择适合自身场景的工具。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CATEGORY_ORDER.map((cat) => {
              const guide = CATEGORY_GUIDES_ZH[cat];
              const count = categoryCount.get(cat) ?? 0;
              return (
                <a
                  key={cat}
                  href={`/zh/guide/category/${cat}`}
                  className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold">
                      {CATEGORY_LABELS_ZH[cat]} 指南
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
                {CATEGORY_LABELS_ZH[cat]}
                <span className="text-xs font-normal text-muted-foreground">
                  {ids.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ids.map((id) => {
                  const zh = ZH_TOOLS[id]!;
                  return (
                    <li key={id}>
                      <a
                        href={`/zh/guide/${id}`}
                        className="block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                      >
                        <span className="text-sm font-medium">{zh.name}</span>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {zh.tagline}
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
          <p>所有工具都在浏览器内运行，文件不会被上传。</p>
        </footer>
      </main>
    </div>
  );
}
