import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UseCaseView } from '@/components/UseCaseView';
import { type ToolCategory } from '@/lib/tools/registry';
import { USE_CASES, USE_CASE_SLUGS, getUseCase } from '@/lib/use-cases';
import { FORMATS } from '@/lib/convert-matrix';
import { getCompare } from '@/lib/en-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_EN: Record<ToolCategory, string> = {
  image: 'Image', pdf: 'PDF', video: 'Video', gif: 'GIF', audio: 'Audio',
  docs: 'Documents', text: 'Text', dev: 'Developer', util: 'Utility', security: 'Security', ai: 'AI',
};

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
  if (!uc) return { title: 'Guide not found — Web Toolkit' };
  const koUrl = `/use/${slug}`;
  const enUrl = `/en/use/${slug}`;
  return {
    title: uc.title.en,
    description: uc.description.en,
    keywords: [...uc.keywords.en, 'free', 'online', 'browser'],
    alternates: { canonical: enUrl, languages: { 'ko-KR': koUrl, en: enUrl, 'x-default': enUrl } },
    openGraph: {
      title: uc.title.en,
      description: uc.description.en,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'en_US',
      url: enUrl,
      images: [{ url: `/og/${uc.category}.png`, width: 1200, height: 630, alt: uc.h1.en }],
    },
    twitter: { card: 'summary_large_image', title: uc.title.en, description: uc.description.en, images: [`/og/${uc.category}.png`] },
  };
}

export default async function UseCasePageEn({ params }: PageProps) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const relatedConverts = (uc.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  const relatedCompares = (uc.relatedCompares ?? []).map((s) => ({ slug: s, label: getCompare(s)?.h1 ?? s }));
  const others = USE_CASES.filter((u) => u.slug !== slug)
    .slice(0, 4)
    .map((u) => ({ slug: u.slug, title: u.h1.en, description: u.description.en }));

  return (
    <UseCaseView
      uc={uc}
      lang="en"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS_EN[uc.category]}
      relatedConverts={relatedConverts}
      relatedCompares={relatedCompares}
      others={others}
    />
  );
}
