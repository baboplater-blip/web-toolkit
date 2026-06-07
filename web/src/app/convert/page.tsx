import type { Metadata } from 'next';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import {
  CONVERSIONS,
  FORMATS,
  conversionCategory,
  conversionSlug,
} from '@/lib/convert-matrix';

const GROUPS: Array<{ key: string; title: string }> = [
  { key: 'image', title: '이미지 변환' },
  { key: 'audio', title: '오디오 변환' },
  { key: 'video', title: '비디오 변환' },
  { key: 'docs', title: '문서 변환' },
  { key: 'pdf', title: 'PDF 변환' },
];

export const metadata: Metadata = {
  title: '파일 변환 모음 — 무료, 브라우저에서',
  description:
    'PNG·JPG·WebP·AVIF·HEIC·SVG·PDF 간 변환을 한 곳에서. 업로드 없이 브라우저에서 처리되는 무료 변환 도구 모음입니다.',
  keywords: ['파일 변환', '이미지 변환', 'png jpg', 'heic 변환', 'webp 변환', 'pdf 변환', '무료 변환', '온라인 변환'],
  alternates: {
    canonical: '/convert',
    languages: { 'ko-KR': '/convert', en: '/en/convert', ja: '/ja/convert', zh: '/zh/convert', 'x-default': '/convert' },
  },
};

export default function ConvertIndex() {
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
              href={`/convert/${slug}`}
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
          <a href="/tools" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="모든 도구">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ArrowRightLeft className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold">파일 변환 모음</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          이미지·오디오·비디오·문서 포맷을 서로 변환합니다. 모든 변환은 브라우저 안에서 끝나며 파일이 서버로 전송되지 않습니다.
        </p>
        {GROUPS.map((g) => {
          const items = byCat(g.key);
          return items.length > 0 ? <Group key={g.key} title={g.title} items={items} /> : null;
        })}
      </main>
    </div>
  );
}
