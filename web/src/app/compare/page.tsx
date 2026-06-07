import type { Metadata } from 'next';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { COMPARES_KO } from '@/lib/ko-compares';

export const metadata: Metadata = {
  title: '도구 비교 — 무엇을 골라야 할까',
  description:
    'PNG vs JPG, HEIC vs JPG, MD5 vs SHA-256 등 헷갈리는 포맷·도구를 나란히 비교합니다. 업로드 없이 브라우저에서 바로 변환·계산.',
  keywords: ['포맷 비교', 'png jpg', 'webp png', 'md5 sha256', '도구 비교', '무엇이 다른가'],
  alternates: { canonical: '/compare', languages: { 'ko-KR': '/compare', en: '/en/compare', ja: '/ja/compare', zh: '/zh/compare', 'x-default': '/compare' } },
};

export default function CompareIndexKo() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href="/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="모든 도구">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <GitCompare className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">도구 비교</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          헷갈리는 포맷·도구를 장단점으로 나란히 비교하고, 바로 쓸 수 있는 브라우저 도구로 연결합니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMPARES_KO.map((c) => (
            <a key={c.slug} href={`/compare/${c.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium truncate">{c.h1}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
