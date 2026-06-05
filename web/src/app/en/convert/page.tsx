import type { Metadata } from 'next';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import {
  CONVERSIONS,
  FORMATS,
  conversionCategory,
  conversionSlug,
} from '@/lib/convert-matrix';

const GROUPS: Array<{ key: string; title: string }> = [
  { key: 'image', title: 'Image conversions' },
  { key: 'audio', title: 'Audio conversions' },
  { key: 'video', title: 'Video conversions' },
  { key: 'docs', title: 'Document conversions' },
  { key: 'pdf', title: 'PDF conversions' },
];

export const metadata: Metadata = {
  title: 'File Converters — Free, in Your Browser',
  description:
    'Convert between PNG, JPG, WebP, AVIF, HEIC, SVG and PDF in one place. Free converters that run in your browser with no upload.',
  keywords: ['file converter', 'image converter', 'png to jpg', 'heic to jpg', 'webp converter', 'pdf converter', 'free', 'online'],
  alternates: {
    canonical: '/en/convert',
    languages: { 'ko-KR': '/convert', en: '/en/convert', 'x-default': '/en/convert' },
  },
};

export default function ConvertIndexEn() {
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
              href={`/en/convert/${slug}`}
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
          <a href="/en/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="All tools">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ArrowRightLeft className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">File Converters</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Convert image, audio, video and document formats both ways. Every conversion finishes inside your browser — files are never uploaded.
        </p>
        {GROUPS.map((g) => {
          const items = byCat(g.key);
          return items.length > 0 ? <Group key={g.key} title={g.title} items={items} /> : null;
        })}
      </main>
    </div>
  );
}
