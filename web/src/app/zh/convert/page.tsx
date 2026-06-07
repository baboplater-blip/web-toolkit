import type { Metadata } from 'next';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import {
  CONVERSIONS,
  FORMATS,
  conversionCategory,
  conversionSlug,
} from '@/lib/convert-matrix';

const GROUPS: Array<{ key: string; title: string }> = [
  { key: 'image', title: '图片转换' },
  { key: 'audio', title: '音频转换' },
  { key: 'video', title: '视频转换' },
  { key: 'docs', title: '文档转换' },
  { key: 'pdf', title: 'PDF 转换' },
];

export const metadata: Metadata = {
  title: '文件转换工具集 — 免费、在浏览器中',
  description:
    '在一处转换 PNG、JPG、WebP、AVIF、HEIC、SVG、PDF 等格式。无需上传，在浏览器中处理的免费转换工具集。',
  keywords: ['文件 转换', '图片 转换', 'png jpg', 'heic 转换', 'webp 转换', 'pdf 转换', '免费 转换', '在线 转换'],
  alternates: {
    canonical: '/zh/convert',
    languages: { 'ko-KR': '/convert', en: '/en/convert', ja: '/ja/convert', zh: '/zh/convert', 'x-default': '/convert' },
  },
};

export default function ConvertIndexZh() {
  const byCat = (cat: string) =>
    CONVERSIONS.filter((c) => conversionCategory(FORMATS[c.from], FORMATS[c.to]) === cat);

  const Group = ({ title, items }: { title: string; items: typeof CONVERSIONS }) => (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((c) => {
          const slug = conversionSlug(c);
          return (
            <a
              key={slug}
              href={`/zh/convert/${slug}`}
              className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium truncate">
                  {FORMATS[c.from].label} → {FORMATS[c.to].label}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href="/zh/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="全部工具">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ArrowRightLeft className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">文件转换工具集</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          在图片、音频、视频、文档格式之间相互转换。所有转换都在浏览器中完成，文件不会上传到服务器。
        </p>
        {GROUPS.map((g) => {
          const items = byCat(g.key);
          return items.length > 0 ? <Group key={g.key} title={g.title} items={items} /> : null;
        })}
      </main>
    </div>
  );
}
