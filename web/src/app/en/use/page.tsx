import type { Metadata } from 'next';
import { ArrowLeft, Wrench } from 'lucide-react';
import { USE_CASES } from '@/lib/use-cases';

export const metadata: Metadata = {
  title: 'Guides — What Are You Trying to Do?',
  description:
    'Step-by-step guides for common tasks: make an ID photo, blur faces in group photos, scan paper to PDF and more. Free, in your browser, no upload.',
  keywords: ['how to guides', 'id photo', 'blur faces', 'scan to pdf', 'optimize photo'],
  alternates: { canonical: '/en/use', languages: { 'ko-KR': '/use', en: '/en/use', ja: '/ja/use', zh: '/zh/use', 'x-default': '/en/use' } },
};

export default function UseIndexEn() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href="/en/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="All tools">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Wrench className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">Guides</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Step-by-step guides for common tasks. Each links to the tools you need, and everything runs in your browser.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {USE_CASES.map((u) => (
            <a key={u.slug} href={`/en/use/${u.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium truncate">{u.h1.en}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{u.description.en}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
