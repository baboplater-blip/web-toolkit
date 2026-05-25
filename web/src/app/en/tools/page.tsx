import type { Metadata } from 'next';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolCategory,
} from '@/lib/tools/registry';

/**
 * English /en/tools — catalog mirror.
 *
 * The interactive Korean hub (/tools) handles search, filter, favorites, etc.
 * This English mirror is a static, SEO-friendly list with English category
 * labels so non-Korean visitors can discover all 123 tools. Each tool link
 * lands on the Korean tool page (mostly icon/button driven UI is language-
 * agnostic enough to be usable). Future rounds may add per-tool English
 * pages under /en/tools/{slug}.
 */

const CATEGORY_LABELS_EN: Record<ToolCategory | 'all', string> = {
  all: 'All',
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

export const metadata: Metadata = {
  title: 'All Tools — Web Toolkit',
  description:
    '123 free browser tools across PDF, image, video, audio, OCR, AI, and more. All client-side, no upload.',
  alternates: {
    canonical: '/en/tools',
    languages: {
      'ko-KR': '/tools',
      'en': '/en/tools',
      'x-default': '/tools',
    },
  },
  openGraph: {
    title: 'All Tools — Web Toolkit',
    description: '123 free, browser-only tools. No upload, no signup.',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'en_US',
    url: '/en/tools',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit catalog' },
    ],
  },
};

export default function EnglishToolsHubPage() {
  const readyTools = TOOLS.filter((t) => t.status === 'ready');
  const grouped = new Map<ToolCategory, typeof readyTools>();
  for (const t of readyTools) {
    const arr = grouped.get(t.category) ?? [];
    arr.push(t);
    grouped.set(t.category, arr);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.phase - b.phase);
  }

  return (
    <div className="min-h-dvh bg-background">
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
          <LayoutGrid className="h-5 w-5" />
          <h1 className="text-base font-semibold">All Tools (English)</h1>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {readyTools.length} tools
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        <section className="rounded-xl border bg-card p-4 text-sm space-y-2">
          <p>
            Browse all <strong>{readyTools.length}</strong> tools below. The
            interactive search, favorites and keyboard shortcuts are on the{' '}
            <a href="/tools" className="text-primary underline">
              main hub (Korean UI)
            </a>
            . Tool pages themselves are still in Korean — most are icon-driven
            and language-agnostic.
          </p>
          <p className="text-muted-foreground text-[12px]">
            New: per-category guides in English are now available at{' '}
            <a href="/en/guide" className="text-primary underline">
              /en/guide
            </a>{' '}
            with step-by-step instructions and FAQs.
          </p>
        </section>

        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => {
          const list = grouped.get(cat)!;
          return (
            <section key={cat} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold flex items-baseline gap-2">
                  {CATEGORY_LABELS_EN[cat]}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({CATEGORY_LABELS[cat]}) · {list.length}
                  </span>
                </h2>
                <a
                  href={`/en/guide/category/${cat}`}
                  className="text-[11px] text-primary hover:underline shrink-0"
                >
                  Read {CATEGORY_LABELS_EN[cat]} guide →
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((t) => (
                  <a
                    key={t.id}
                    href={t.href}
                    className="group rounded-lg border bg-card p-3 hover:border-primary transition-colors"
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
                ))}
              </div>
            </section>
          );
        })}

        <footer className="text-center text-xs text-muted-foreground space-y-2 pt-6 border-t">
          <p>
            All processing happens in your browser. Files never uploaded.
          </p>
          <p>
            <a href="/tools" hrefLang="ko" className="underline hover:text-foreground">
              한국어 인터랙티브 허브로 이동
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
