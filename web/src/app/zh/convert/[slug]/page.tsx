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
import { getCompareZh } from '@/lib/zh-compares';
import { hasZhCopy } from '@/lib/zh-tools';
import { useCasesForConvert } from '@/lib/use-cases';

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
  if (!conv) return { title: '未找到该转换 · Web Toolkit' };
  const content = buildConversionContent(conv, 'zh');
  const koUrl = `/convert/${slug}`;
  const enUrl = `/en/convert/${slug}`;
  const jaUrl = `/ja/convert/${slug}`;
  const zhUrl = `/zh/convert/${slug}`;
  const ogImage = `/og/convert/${slug}.png`;
  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: zhUrl,
      languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: zhUrl, 'x-default': koUrl },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'zh_CN',
      url: zhUrl,
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

/** zh 的 CTA: 拥有 zh 文案的工具用 /zh/tools/{id}，否则用 ko 工具页。 */
function toolHrefZh(toolId: string, koHref: string): string {
  return hasZhCopy(toolId) ? `/zh/tools/${toolId}` : koHref;
}

export default async function ConvertPageZh({ params }: PageProps) {
  const { slug } = await params;
  const conv = getConversion(slug);
  if (!conv) notFound();
  const content = buildConversionContent(conv, 'zh');
  const related = relatedConversions(conv).map((r) => ({
    slug: conversionSlug(r),
    label: `${FORMATS[r.from].label} → ${FORMATS[r.to].label}`,
  }));
  const cmp = compareForConvert(slug);
  const relatedCompare = cmp
    ? { slug: cmp.slug, label: getCompareZh(cmp.slug)?.h1 ?? cmp.h1 }
    : undefined;
  const relatedUses = useCasesForConvert(slug).map((u) => ({ slug: u.slug, label: u.h1.zh ?? u.h1.en }));

  return (
    <ConvertPageView
      content={content}
      conv={conv}
      lang="zh"
      siteUrl={SITE_URL}
      toolHref={toolHrefZh(conv.toolId, conv.toolHref)}
      related={related}
      relatedCompare={relatedCompare}
      relatedUses={relatedUses}
    />
  );
}
