import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareView } from '@/components/CompareView';
import { CATEGORY_LABELS, TOOLS } from '@/lib/tools/registry';
import { COMPARE_SLUGS, getCompare, relatedCompares, type CompareOption } from '@/lib/en-compares';
import { getCompareKo } from '@/lib/ko-compares';
import { FORMATS } from '@/lib/convert-matrix';
import { useCasesForCompare } from '@/lib/use-cases';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

/** KO CTA: 한국어 도구 페이지로 직접 연결. */
function optionHref(opt: CompareOption): string | undefined {
  if (!opt.toolId) return undefined;
  return TOOLS.find((t) => t.id === opt.toolId && t.status === 'ready')?.href;
}

function convertLabel(slug: string): string {
  const [from, to] = slug.split('-to-');
  const fl = FORMATS[from]?.label ?? from.toUpperCase();
  const tl = FORMATS[to]?.label ?? to.toUpperCase();
  return `${fl} → ${tl}`;
}

export function generateStaticParams() {
  return COMPARE_SLUGS.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cmp = getCompareKo(slug);
  if (!cmp) return { title: '비교를 찾을 수 없습니다 · Web Toolkit' };
  const koUrl = `/compare/${slug}`;
  const enUrl = `/en/compare/${slug}`;
  const jaUrl = `/ja/compare/${slug}`;
  const ogImage = `/og/compare/${slug}.png`;
  return {
    title: cmp.title,
    description: cmp.description,
    keywords: [...cmp.keywords, '비교', '차이', '무료', '온라인'],
    alternates: { canonical: koUrl, languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: `/zh/compare/${slug}`, 'x-default': koUrl } },
    openGraph: {
      title: cmp.title,
      description: cmp.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ko_KR',
      url: koUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: cmp.h1 }],
    },
    twitter: { card: 'summary_large_image', title: cmp.title, description: cmp.description, images: [ogImage] },
  };
}

export default async function ComparePageKo({ params }: PageProps) {
  const { slug } = await params;
  const cmp = getCompareKo(slug);
  if (!cmp) notFound();

  const relatedConverts = (getCompare(slug)?.relatedConverts ?? []).map((s) => ({
    slug: s,
    label: convertLabel(s),
  }));
  // 같은 카테고리 비교 우선, 부족하면 ko 라벨로 매핑
  const otherCompares = relatedCompares(slug).map((c) => {
    const ko = getCompareKo(c.slug);
    return { slug: c.slug, h1: ko?.h1 ?? c.h1, description: ko?.description ?? c.description };
  });
  const relatedUses = useCasesForCompare(slug).map((u) => ({ slug: u.slug, label: u.h1.ko }));

  return (
    <CompareView
      compare={cmp}
      lang="ko"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS[cmp.category]}
      optionHrefs={cmp.options.map(optionHref)}
      relatedConverts={relatedConverts}
      otherCompares={otherCompares}
      relatedUses={relatedUses}
    />
  );
}
