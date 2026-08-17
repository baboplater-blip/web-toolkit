import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UseCaseView } from '@/components/UseCaseView';
import { type ToolCategory } from '@/lib/tools/registry';
import { USE_CASES, USE_CASE_SLUGS, getUseCase } from '@/lib/use-cases';
import { FORMATS } from '@/lib/convert-matrix';
import { getCompareJa } from '@/lib/ja-compares';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const CATEGORY_LABELS_JA: Record<ToolCategory, string> = {
  image: '画像', pdf: 'PDF', video: '動画', gif: 'GIF', audio: '音声',
  docs: '文書', text: 'テキスト', dev: '開発者', util: 'ユーティリティ', security: 'セキュリティ', ai: 'AI',
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
  if (!uc) return { title: '活用法が見つかりません — Web Toolkit' };
  const koUrl = `/use/${slug}`;
  const enUrl = `/en/use/${slug}`;
  const jaUrl = `/ja/use/${slug}`;
  return {
    title: uc.title.ja ?? uc.title.en,
    description: uc.description.ja ?? uc.description.en,
    keywords: [...(uc.keywords.ja ?? uc.keywords.en), '無料', 'オンライン', 'ブラウザ'],
    alternates: { canonical: jaUrl, languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, zh: `/zh/use/${slug}`, 'x-default': koUrl } },
    openGraph: {
      title: uc.title.ja ?? uc.title.en,
      description: uc.description.ja ?? uc.description.en,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'ja_JP',
      url: jaUrl,
      images: [{ url: `/og/use/${slug}.png`, width: 1200, height: 630, alt: uc.h1.ja ?? uc.h1.en }],
    },
    twitter: {
      card: 'summary_large_image',
      title: uc.title.ja ?? uc.title.en,
      description: uc.description.ja ?? uc.description.en,
      images: [`/og/use/${slug}.png`],
    },
  };
}

export default async function UseCasePageJa({ params }: PageProps) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const relatedConverts = (uc.relatedConverts ?? []).map((s) => ({ slug: s, label: convertLabel(s) }));
  const relatedCompares = (uc.relatedCompares ?? []).map((s) => ({ slug: s, label: getCompareJa(s)?.h1 ?? s }));
  const others = USE_CASES.filter((u) => u.slug !== slug)
    .slice(0, 4)
    .map((u) => ({ slug: u.slug, title: u.h1.ja ?? u.h1.en, description: u.description.ja ?? u.description.en }));

  return (
    <UseCaseView
      uc={uc}
      lang="ja"
      siteUrl={SITE_URL}
      categoryLabel={CATEGORY_LABELS_JA[uc.category]}
      relatedConverts={relatedConverts}
      relatedCompares={relatedCompares}
      others={others}
    />
  );
}
