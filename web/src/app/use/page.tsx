import type { Metadata } from 'next';
import { ArrowLeft, Wrench } from 'lucide-react';
import { USE_CASES } from '@/lib/use-cases';

export const metadata: Metadata = {
  title: '활용법 — 무엇을 하려고 하나요?',
  description:
    '이력서 사진 만들기, 단체사진 얼굴 모자이크, 서류 PDF로 묶기 등 자주 하는 작업을 단계별로. 업로드 없이 브라우저에서 무료로.',
  keywords: ['활용법', '이력서 사진', '얼굴 모자이크', 'pdf 만들기', '사진 최적화'],
  alternates: { canonical: '/use', languages: { 'ko-KR': '/use', en: '/en/use', ja: '/ja/use', 'x-default': '/use' } },
};

export default function UseIndexKo() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href="/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="모든 도구">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Wrench className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">활용법</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          자주 하는 작업을 단계별로 안내합니다. 필요한 도구로 바로 연결되며, 모든 처리는 브라우저 안에서 끝납니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {USE_CASES.map((u) => (
            <a key={u.slug} href={`/use/${u.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium truncate">{u.h1.ko}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{u.description.ko}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
