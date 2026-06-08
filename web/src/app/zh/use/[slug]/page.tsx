import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UseCaseView } from '@/components/UseCaseView';
import { type ToolCategory } from '@/lib/tools/registry';
import { USE_CASES, USE_CASE_SLUGS, getUseCase } from '@/lib/use-cases';
import { FORMATS } from '@/lib/convert-matrix';
import { getCompareZh } from '@/lib/zh-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_ZH: Record<ToolCategory, string> = {
  image: '图片', pdf: 'PDF', video: '视频', gif: 'GIF', audio: '音频',
  docs: '文档', text: '文本', dev: '开发者', util: '实用工具', security: '安全', ai: 'AI',
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
  if (!uc) return { title: '未找到该教程 — Web Toolkit' };
  const koUrl = `/use/${slug}`;
  const enUrl = `/en/use/${slug}`;
  const jaUrl = `/ja/use/${slug}`;
  const zhUrl = `/zh/use/${slug}`;
  return {
    title: uc.title.zh ?? uc.title.en,
    description: uc.description.zh ?? uc.description.en,
    keywords: [...(uc.keywords.zh ?? uc.keywords.en), '免费', '在线', '浏览器'],
    alternates: { canonical: zhUrl, languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: zhUrl, 'x-default': koUrl } },
    openGraph: {
      title: uc.title.zh ?? uc.title.en,
      description: uc.description.zh ?? uc.description.en,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'zh_CN',
      url: zhUrl,
      images: [{ url: `/og/use/${slug}.png`, width: 1200, height: 630, alt: uc.h1.zh ?? uc.h1.en }],
    },
    twitter: {
      card: 'summary_large_image',
      title: uc.title.zh ?? uc.title.en,
      description: uc.description.zh ?? uc.description.en,
      images: [`/og/use/${slug}.png`],
    },
  };
}

export default async function UseCasePageZh({ params }: PageProps) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const relatedConverts = (uc.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  const relatedCompares = (uc.relatedCompares ?? []).map((s) => ({ slug: s, label: getCompareZh(s)?.h1 ?? s }));
  const others = USE_CASES.filter((u) => u.slug !== slug)
    .slice(0, 4)
    .map((u) => ({ slug: u.slug, title: u.h1.zh ?? u.h1.en, description: u.description.zh ?? u.description.en }));

  return (
    <UseCaseView
      uc={uc}
      lang="zh"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS_ZH[uc.category]}
      relatedConverts={relatedConverts}
      relatedCompares={relatedCompares}
      others={others}
    />
  );
}
