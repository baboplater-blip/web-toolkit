import type { Metadata } from 'next';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import {
  CONVERSIONS,
  FORMATS,
  conversionCategory,
  conversionSlug,
} from '@/lib/convert-matrix';

const GROUPS: Array<{ key: string; title: string }> = [
  { key: 'image', title: '画像の変換' },
  { key: 'audio', title: '音声の変換' },
  { key: 'video', title: '動画の変換' },
  { key: 'docs', title: '文書の変換' },
  { key: 'pdf', title: 'PDFの変換' },
];

export const metadata: Metadata = {
  title: 'ファイル変換ツール集 — 無料・ブラウザで',
  description:
    'PNG・JPG・WebP・AVIF・HEIC・SVG・PDF などを一か所で変換。アップロードなしでブラウザ内で処理される無料の変換ツール集です。',
  keywords: ['ファイル 変換', '画像 変換', 'png jpg', 'heic 変換', 'webp 変換', 'pdf 変換', '無料 変換', 'オンライン 変換'],
  alternates: {
    canonical: '/ja/convert',
    languages: { 'ko-KR': '/convert', en: '/en/convert', ja: '/ja/convert', zh: '/zh/convert', 'x-default': '/convert' },
  },
};

export default function ConvertIndexJa() {
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
              href={`/ja/convert/${slug}`}
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
          <a href="/ja/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="すべてのツール">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ArrowRightLeft className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">ファイル変換ツール集</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          画像・音声・動画・文書のフォーマットを相互に変換します。すべての変換はブラウザ内で完結し、ファイルがサーバーに送られることはありません。
        </p>
        {GROUPS.map((g) => {
          const items = byCat(g.key);
          return items.length > 0 ? <Group key={g.key} title={g.title} items={items} /> : null;
        })}
      </main>
    </div>
  );
}
