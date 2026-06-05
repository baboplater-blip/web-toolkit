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
import { getCompareKo } from '@/lib/ko-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
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
  if (!conv) return { title: '변환을 찾을 수 없습니다 · Web Toolkit' };
  const content = buildConversionContent(conv, 'ko');
  const koUrl = `/convert/${slug}`;
  const enUrl = `/en/convert/${slug}`;
  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: koUrl,
      languages: { 'ko-KR': koUrl, en: enUrl, 'x-default': koUrl },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ko_KR',
      url: koUrl,
      images: [{ url: `/og/${content.category}.png`, width: 1200, height: 630, alt: content.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [`/og/${content.category}.png`],
    },
  };
}

export default async function ConvertPage({ params }: PageProps) {
  const { slug } = await params;
  const conv = getConversion(slug);
  if (!conv) notFound();
  const content = buildConversionContent(conv, 'ko');
  const related = relatedConversions(conv).map((r) => ({
    slug: conversionSlug(r),
    label: `${FORMATS[r.from].label} → ${FORMATS[r.to].label}`,
  }));
  const cmp = compareForConvert(slug);
  const relatedCompare = cmp ? { slug: cmp.slug, label: getCompareKo(cmp.slug)?.h1 ?? cmp.h1 } : undefined;

  return (
    <ConvertPageView
      content={content}
      conv={conv}
      lang="ko"
      siteUrl={SITE_URL}
      toolHref={conv.toolHref}
      related={related}
      relatedCompare={relatedCompare}
    />
  );
}
