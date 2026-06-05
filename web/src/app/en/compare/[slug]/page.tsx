import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareView } from '@/components/CompareView';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { EN_TOOLS } from '@/lib/en-tools';
import { COMPARE_SLUGS, getCompare, relatedCompares, type CompareOption } from '@/lib/en-compares';
import { FORMATS } from '@/lib/convert-matrix';
import { useCasesForCompare } from '@/lib/use-cases';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_EN: Record<ToolCategory, string> = {
  image: 'Image',
  pdf: 'PDF',
  video: 'Video',
  gif: 'GIF',
  audio: 'Audio',
  docs: 'Documents',
  text: 'Text',
  dev: 'Developer',
  util: 'Utility',
  security: 'Security',
  ai: 'AI',
};

/** Resolve a compare option's CTA href: curated EN page if possible, else the Korean tool page. */
function optionHref(opt: CompareOption): string | undefined {
  if (!opt.toolId) return undefined;
  if (EN_TOOLS[opt.toolId]) return `/en/tools/${opt.toolId}`;
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
  const cmp = getCompare(slug);
  if (!cmp) return { title: 'Comparison not found — Web Toolkit' };
  const koUrl = `/compare/${cmp.slug}`;
  const enUrl = `/en/compare/${cmp.slug}`;
  const ogImage = `/og/compare/${cmp.slug}.en.png`;
  return {
    title: cmp.title,
    description: cmp.description,
    keywords: [...cmp.keywords, 'vs', 'comparison', 'which is better', 'free', 'online'],
    alternates: { canonical: enUrl, languages: { 'ko-KR': koUrl, en: enUrl, 'x-default': enUrl } },
    openGraph: {
      title: cmp.title,
      description: cmp.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'en_US',
      url: enUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: cmp.h1 }],
    },
    twitter: { card: 'summary_large_image', title: cmp.title, description: cmp.description, images: [ogImage] },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const cmp = getCompare(slug);
  if (!cmp) notFound();

  const relatedConverts = (cmp.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  const otherCompares = relatedCompares(slug).map((c) => ({
    slug: c.slug,
    h1: c.h1,
    description: c.description,
  }));
  const relatedUses = useCasesForCompare(slug).map((u) => ({ slug: u.slug, label: u.h1.en }));

  return (
    <CompareView
      compare={cmp}
      lang="en"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS_EN[cmp.category]}
      optionHrefs={cmp.options.map(optionHref)}
      relatedConverts={relatedConverts}
      otherCompares={otherCompares}
      relatedUses={relatedUses}
    />
  );
}
