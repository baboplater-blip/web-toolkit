import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConvertPageView } from '@/components/ConvertPageView';
import {
  CONVERT_SLUGS,
  FORMATS,
  buildConversionContent,
  conversionSlug,
  getConversion,
  relatedConversions,
} from '@/lib/convert-matrix';
import { compareForConvert } from '@/lib/en-compares';
import { getCompareJa } from '@/lib/ja-compares';
import { hasJaCopy } from '@/lib/ja-tools';
import { useCasesForConvert } from '@/lib/use-cases';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

export function generateStaticParams() {
  return CONVERT_SLUGS.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const conv = getConversion(slug);
  if (!conv) return { title: '変換が見つかりません · Web Toolkit' };
  const content = buildConversionContent(conv, 'ja');
  const koUrl = `/convert/${slug}`;
  const enUrl = `/en/convert/${slug}`;
  const jaUrl = `/ja/convert/${slug}`;
  const ogImage = `/og/convert/${slug}.png`;
  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: jaUrl,
      languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: `/zh/convert/${slug}`, 'x-default': koUrl },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ja_JP',
      url: jaUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: content.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [ogImage],
    },
  };
}

/** ja の CTA: ja カピーを持つ道具なら /ja/tools/{id}、無ければ ko 道具ページ。 */
function toolHrefJa(toolId: string, koHref: string): string {
  return hasJaCopy(toolId) ? `/ja/tools/${toolId}` : koHref;
}

export default async function ConvertPageJa({ params }: PageProps) {
  const { slug } = await params;
  const conv = getConversion(slug);
  if (!conv) notFound();
  const content = buildConversionContent(conv, 'ja');
  const related = relatedConversions(conv).map((r) => ({
    slug: conversionSlug(r),
    label: `${FORMATS[r.from].label} → ${FORMATS[r.to].label}`,
  }));
  const cmp = compareForConvert(slug);
  const relatedCompare = cmp
    ? { slug: cmp.slug, label: getCompareJa(cmp.slug)?.h1 ?? cmp.h1 }
    : undefined;
  const relatedUses = useCasesForConvert(slug).map((u) => ({ slug: u.slug, label: u.h1.ja ?? u.h1.en }));

  return (
    <ConvertPageView
      content={content}
      conv={conv}
      lang="ja"
      siteUrl={SITE_URL}
      toolHref={toolHrefJa(conv.toolId, conv.toolHref)}
      related={related}
      relatedCompare={relatedCompare}
      relatedUses={relatedUses}
    />
  );
}
