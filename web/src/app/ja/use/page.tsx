import type { Metadata } from 'next';
import { ArrowLeft, Wrench } from 'lucide-react';
import { USE_CASES } from '@/lib/use-cases';

export const metadata: Metadata = {
  title: '活用法 — 何をしたいですか？',
  description:
    '証明写真の作成、集合写真の顔モザイク、書類のPDFまとめなど、よくある作業を手順つきで。アップロードなしでブラウザで無料で。',
  keywords: ['活用法', '証明写真', '顔 モザイク', 'pdf 作成', '写真 最適化'],
  alternates: { canonical: '/ja/use', languages: { 'ko-KR': '/use', en: '/en/use', ja: '/ja/use', zh: '/zh/use', 'x-default': '/use' } },
};

export default function UseIndexJa() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href="/ja/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="すべてのツール">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Wrench className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">活用法</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          よくある作業を手順つきで案内します。必要なツールへそのまま進め、すべての処理はブラウザ内で完結します。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {USE_CASES.map((u) => (
            <a key={u.slug} href={`/ja/use/${u.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium truncate">{u.h1.ja ?? u.h1.en}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{u.description.ja ?? u.description.en}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
