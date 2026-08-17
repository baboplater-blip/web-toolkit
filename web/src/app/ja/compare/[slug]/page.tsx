import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareView } from '@/components/CompareView';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { type CompareOption } from '@/lib/en-compares';
import { COMPARE_SLUGS, getCompareJa, relatedCompares } from '@/lib/ja-compares';
import { hasJaCopy } from '@/lib/ja-tools';
import { FORMATS } from '@/lib/convert-matrix';
import { useCasesForCompare } from '@/lib/use-cases';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_JA: Record<ToolCategory, string> = {
  image: '画像',
  pdf: 'PDF',
  video: '動画',
  gif: 'GIF',
  audio: '音声',
  docs: '文書',
  text: 'テキスト',
  dev: '開発者',
  util: 'ユーティリティ',
  security: 'セキュリティ',
  ai: 'AI',
};

/** ja の CTA: ja カピー保有なら /ja/tools/{id}、無ければ ko 道具ページ。 */
function optionHref(opt: CompareOption): string | undefined {
  if (!opt.toolId) return undefined;
  if (hasJaCopy(opt.toolId)) return `/ja/tools/${opt.toolId}`;
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
  const cmp = getCompareJa(slug);
  if (!cmp) return { title: '比較が見つかりません — Web Toolkit' };
  const koUrl = `/compare/${slug}`;
  const enUrl = `/en/compare/${slug}`;
  const jaUrl = `/ja/compare/${slug}`;
  const ogImage = `/og/compare/${slug}.png`;
  return {
    title: cmp.title,
    description: cmp.description,
    keywords: [...cmp.keywords, '比較', '違い', '無料', 'オンライン'],
    alternates: { canonical: jaUrl, languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: `/zh/compare/${slug}`, 'x-default': koUrl } },
    openGraph: {
      title: cmp.title,
      description: cmp.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ja_JP',
      url: jaUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: cmp.h1 }],
    },
    twitter: { card: 'summary_large_image', title: cmp.title, description: cmp.description, images: [ogImage] },
  };
}

export default async function ComparePageJa({ params }: PageProps) {
  const { slug } = await params;
  const cmp = getCompareJa(slug);
  if (!cmp) notFound();

  const relatedConverts = (cmp.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  // 같은 카테고리 비교 우선, ja 라벨로 매핑
  const otherCompares = relatedCompares(slug).map((c) => {
    const ja = getCompareJa(c.slug);
    return { slug: c.slug, h1: ja?.h1 ?? c.h1, description: ja?.description ?? c.description };
  });
  const relatedUses = useCasesForCompare(slug).map((u) => ({ slug: u.slug, label: u.h1.ja ?? u.h1.en }));

  return (
    <CompareView
      compare={cmp}
      lang="ja"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS_JA[cmp.category]}
      optionHrefs={cmp.options.map(optionHref)}
      relatedConverts={relatedConverts}
      otherCompares={otherCompares}
      relatedUses={relatedUses}
    />
  );
}
