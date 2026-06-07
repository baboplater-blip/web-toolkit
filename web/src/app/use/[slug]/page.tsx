import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UseCaseView } from '@/components/UseCaseView';
import { CATEGORY_LABELS } from '@/lib/tools/registry';
import { USE_CASES, USE_CASE_SLUGS, getUseCase } from '@/lib/use-cases';
import { FORMATS } from '@/lib/convert-matrix';
import { getCompareKo } from '@/lib/ko-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

function convertLabel(slug: string): string {
  const [from, to] = slug.split('-to-');
  return `${FORMATS[from]?.label ?? from.toUpperCase()} → ${FORMATS[to]?.label ?? to.toUpperCase()}`;
}

export function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) return { title: '활용법을 찾을 수 없습니다 · Web Toolkit' };
  const koUrl = `/use/${slug}`;
  const enUrl = `/en/use/${slug}`;
  const jaUrl = `/ja/use/${slug}`;
  return {
    title: uc.title.ko,
    description: uc.description.ko,
    keywords: [...uc.keywords.ko, '무료', '온라인', '브라우저'],
    alternates: { canonical: koUrl, languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: `/zh/use/${slug}`, 'x-default': koUrl } },
    openGraph: {
      title: uc.title.ko,
      description: uc.description.ko,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ko_KR',
      url: koUrl,
      images: [{ url: `/og/use/${slug}.png`, width: 1200, height: 630, alt: uc.h1.ko }],
    },
    twitter: { card: 'summary_large_image', title: uc.title.ko, description: uc.description.ko, images: [`/og/use/${slug}.png`] },
  };
}

export default async function UseCasePageKo({ params }: PageProps) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const relatedConverts = (uc.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  const relatedCompares = (uc.relatedCompares ?? []).map((s) => ({ slug: s, label: getCompareKo(s)?.h1 ?? s }));
  const others = USE_CASES.filter((u) => u.slug !== slug)
    .slice(0, 4)
    .map((u) => ({ slug: u.slug, title: u.h1.ko, description: u.description.ko }));

  return (
    <UseCaseView
      uc={uc}
      lang="ko"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS[uc.category]}
      relatedConverts={relatedConverts}
      relatedCompares={relatedCompares}
      others={others}
    />
  );
}
