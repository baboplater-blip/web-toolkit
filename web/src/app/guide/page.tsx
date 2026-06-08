import type { Metadata } from 'next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolCategory,
} from '@/lib/tools/registry';

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
  title: '도구 사용 가이드 — Web Toolkit',
  description: `Web Toolkit ${READY_COUNT}개 도구의 사용법·옵션·자주 묻는 질문을 도구별·카테고리별로 정리한 가이드 모음. PDF·이미지·비디오·오디오·OCR·AI 도구를 효율적으로 쓰는 방법.`,
  alternates: {
    canonical: '/guide',
    languages: {
      'ko-KR': '/guide',
      en: '/en/guide',
      'x-default': '/guide',
    },
  },
  openGraph: {
    title: '도구 사용 가이드 — Web Toolkit',
    description: `${READY_COUNT}개 도구의 사용법·옵션·FAQ 정리.`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ko_KR',
    url: '/guide',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Web Toolkit 가이드',
      },
    ],
  },
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: '가이드', item: `${SITE_URL}/guide` },
  ],
};

export default function GuideIndexPage() {
  const readyTools = TOOLS.filter((t) => t.status === 'ready');
  const grouped = new Map<ToolCategory, typeof readyTools>();
  for (const t of readyTools) {
    const arr = grouped.get(t.category) ?? [];
    arr.push(t);
    grouped.set(t.category, arr);
  }
  for (const list of grouped.values()) list.sort((a, b) => a.phase - b.phase);

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
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="홈으로"
            title="홈"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <BookOpen className="h-5 w-5" />
          <h1 className="text-base font-semibold">도구 사용 가이드</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {readyTools.length}개 가이드
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <section className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-sm leading-relaxed">
            각 도구의 <strong>사용법·옵션·트러블슈팅·FAQ</strong> 를 정리한 가이드 모음입니다.
            아래에서 도구를 선택하면 해당 가이드로 이동합니다.
          </p>
          <p className="text-[12px] text-muted-foreground">
            가이드 없이 바로 사용하려면{' '}
            <a href="/tools" className="text-primary underline">
              도구 허브
            </a>{' '}
            로 이동하세요.
          </p>
        </section>

        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => {
          const list = grouped.get(cat)!;
          return (
            <section key={cat} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">
                  <a
                    href={`/guide/category/${cat}`}
                    className="hover:text-primary hover:underline"
                  >
                    {CATEGORY_LABELS[cat]}
                  </a>
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    {list.length}개
                  </span>
                </h2>
                <a
                  href={`/guide/category/${cat}`}
                  className="text-[11px] text-primary hover:underline shrink-0"
                >
                  카테고리 가이드 →
                </a>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`/guide/${t.id}`}
                      className="block rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <t.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                        <span className="text-sm font-medium truncate">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <footer className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>모든 도구는 브라우저 안에서 실행됩니다. 파일이 서버로 전송되지 않습니다.</p>
        </footer>
      </main>
    </div>
  );
}
