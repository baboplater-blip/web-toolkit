import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareView } from '@/components/CompareView';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { type CompareOption } from '@/lib/en-compares';
import { COMPARE_SLUGS, getCompareZh, relatedCompares } from '@/lib/zh-compares';
import { hasZhCopy } from '@/lib/zh-tools';
import { FORMATS } from '@/lib/convert-matrix';
import { useCasesForCompare } from '@/lib/use-cases';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_ZH: Record<ToolCategory, string> = {
  image: '图片',
  pdf: 'PDF',
  video: '视频',
  gif: 'GIF',
  audio: '音频',
  docs: '文档',
  text: '文本',
  dev: '开发者',
  util: '实用工具',
  security: '安全',
  ai: 'AI',
};

/** zh 的 CTA: 拥有 zh 文案用 /zh/tools/{id}，否则用 ko 工具页。 */
function optionHref(opt: CompareOption): string | undefined {
  if (!opt.toolId) return undefined;
  if (hasZhCopy(opt.toolId)) return `/zh/tools/${opt.toolId}`;
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
  const cmp = getCompareZh(slug);
  if (!cmp) return { title: '未找到该对比 — Web Toolkit' };
  const koUrl = `/compare/${slug}`;
  const enUrl = `/en/compare/${slug}`;
  const jaUrl = `/ja/compare/${slug}`;
  const zhUrl = `/zh/compare/${slug}`;
  const ogImage = `/og/compare/${slug}.png`;
  return {
    title: cmp.title,
    description: cmp.description,
    keywords: [...cmp.keywords, '对比', '区别', '免费', '在线'],
    alternates: { canonical: zhUrl, languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: zhUrl, 'x-default': koUrl } },
    openGraph: {
      title: cmp.title,
      description: cmp.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'zh_CN',
      url: zhUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: cmp.h1 }],
    },
    twitter: { card: 'summary_large_image', title: cmp.title, description: cmp.description, images: [ogImage] },
  };
}

export default async function ComparePageZh({ params }: PageProps) {
  const { slug } = await params;
  const cmp = getCompareZh(slug);
  if (!cmp) notFound();

  const relatedConverts = (cmp.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  const otherCompares = relatedCompares(slug).map((c) => {
    const zh = getCompareZh(c.slug);
    return { slug: c.slug, h1: zh?.h1 ?? c.h1, description: zh?.description ?? c.description };
  });
  const relatedUses = useCasesForCompare(slug).map((u) => ({ slug: u.slug, label: u.h1.zh ?? u.h1.en }));

  return (
    <CompareView
      compare={cmp}
      lang="zh"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS_ZH[cmp.category]}
      optionHrefs={cmp.options.map(optionHref)}
      relatedConverts={relatedConverts}
      otherCompares={otherCompares}
      relatedUses={relatedUses}
    />
  );
}
