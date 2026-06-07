import type { Metadata } from 'next';
import { ArrowLeft, Wrench } from 'lucide-react';
import { USE_CASES } from '@/lib/use-cases';

export const metadata: Metadata = {
  title: '使用教程 — 你想做什么？',
  description:
    '制作证明照、给合影人脸打码、把文档合并成 PDF 等常见任务，附详细步骤。无需上传，在浏览器中免费完成。',
  keywords: ['使用教程', '证明照', '人脸 打码', 'pdf 制作', '图片 优化'],
  alternates: { canonical: '/zh/use', languages: { 'ko-KR': '/use', en: '/en/use', ja: '/ja/use', zh: '/zh/use', 'x-default': '/use' } },
};

export default function UseIndexZh() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href="/zh/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="全部工具">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Wrench className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">使用教程</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          为常见任务提供分步指引，直接进入所需工具，所有处理都在浏览器中完成。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {USE_CASES.map((u) => (
            <a key={u.slug} href={`/zh/use/${u.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium truncate">{u.h1.zh ?? u.h1.en}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{u.description.zh ?? u.description.en}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
