import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lock,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { TOOLS, type ToolCategory, type ToolMeta } from '@/lib/tools/registry';
import { JA_TOOLS, JA_TOOL_IDS, getJaCopy } from '@/lib/ja-tools';
import { hasEnCopy } from '@/lib/en-tools';
import { hasZhCopy } from '@/lib/zh-tools';

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
  dev: '開発者向け',
  util: 'ユーティリティ',
  security: 'セキュリティ',
  ai: 'AI',
};

export function generateStaticParams() {
  return JA_TOOL_IDS.filter((id) =>
    TOOLS.some((t) => t.id === id && t.status === 'ready'),
  ).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findTool(slug: string): ToolMeta | undefined {
  if (!getJaCopy(slug)) return undefined;
  return TOOLS.find((t) => t.id === slug && t.status === 'ready');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  const ja = getJaCopy(slug);
  if (!tool || !ja) {
    return { title: 'ツールが見つかりません — Web Toolkit' };
  }
  const canonical = `/ja/tools/${tool.id}`;
  const title = `${ja.name} — 無料・オンライン・アップロード不要`;
  const description = `${ja.description} 無料・登録不要、すべてブラウザ内で動作します。`.slice(
    0,
    155,
  );
  return {
    title,
    description,
    keywords: [...ja.keywords, '無料', 'オンライン', 'アップロード不要', 'ブラウザ ツール', '登録不要'],
    alternates: {
      canonical,
      languages: {
        'ko-KR': tool.href,
        en: hasEnCopy(tool.id) ? `/en/tools/${tool.id}` : '/en/tools',
        ja: canonical,
        ...(hasZhCopy(tool.id) ? { zh: `/zh/tools/${tool.id}` } : {}),
        'x-default': tool.href,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Web Toolkit',
      locale: 'ja_JP',
      url: canonical,
      images: [
        { url: `/og/tools/${tool.id}.png`, width: 1200, height: 630, alt: ja.name },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/tools/${tool.id}.png`],
    },
  };
}

const WHY_USE: ReadonlyArray<{ icon: typeof Zap; title: string; body: string }> = [
  {
    icon: ShieldCheck,
    title: '設計からプライベート',
    body: 'すべてWeb WorkerとWebAssemblyでブラウザ内処理。データがサーバーにアップロードされることはありません。',
  },
  {
    icon: Zap,
    title: '即時・無料',
    body: '登録もインストールも利用制限もありません。ページを開けばすぐに作業を始められます。',
  },
  {
    icon: Lock,
    title: 'オフライン対応',
    body: '一度読み込めば接続なしでも動作し、PWAとしてホーム画面にインストールできます。',
  },
  {
    icon: Sparkles,
    title: 'モバイル対応',
    body: 'モバイルファーストで設計し、iOS SafariとAndroid Chromeで検証済み。どの端末でもフル機能です。',
  },
];

export default async function JapaneseToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = findTool(slug);
  const ja = getJaCopy(slug);
  if (!tool || !ja) notFound();

  const categoryLabel = CATEGORY_LABELS_JA[tool.category];

  const related = TOOLS.filter(
    (t) =>
      t.status === 'ready' &&
      t.category === tool.category &&
      t.id !== tool.id &&
      JA_TOOLS[t.id],
  )
    .sort((a, b) => a.phase - b.phase)
    .slice(0, 4);

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: ja.name,
    description: ja.description,
    url: `${SITE_URL}/ja/tools/${tool.id}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    inLanguage: 'ja',
    browserRequirements: 'Requires a modern web browser with JavaScript.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    publisher: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    image: `${SITE_URL}/og/tools/${tool.id}.png`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/ja` },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: `${SITE_URL}/ja/tools` },
      { '@type': 'ListItem', position: 3, name: ja.name, item: `${SITE_URL}/ja/tools/${tool.id}` },
    ],
  };

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a
            href="/ja/tools"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="すべてのツール"
            title="すべてのツール"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <tool.icon className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{ja.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/ja" className="hover:text-foreground">ホーム</a>
          <span className="mx-1">/</span>
          <a href="/ja/tools" className="hover:text-foreground">ツール</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{ja.name}</span>
          <span className="mx-2 text-muted-foreground/60">·</span>
          <a href={tool.href} hrefLang="ko" className="underline hover:text-foreground">
            한국어
          </a>
        </nav>

        <section className="space-y-4">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {categoryLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            {ja.name} — 無料・ブラウザ内で完結
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {ja.tagline} {ja.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={tool.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Wrench className="h-4 w-4" />
              ツールを開く
            </a>
            <a
              href={`/ja/guide/${tool.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <BookOpen className="h-4 w-4" />
              使い方ガイド
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground">
            登録不要・アップロード不要・ファイルは端末から外に出ません。
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WHY_USE.map((w, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <w.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <h3 className="text-sm font-semibold">{w.title}</h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{w.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            検索キーワード
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {ja.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {k}
              </span>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            手順やよくある質問をお探しですか？{' '}
            <a href={`/ja/guide/${tool.id}`} className="text-primary underline">
              {ja.name}の使い方ガイドを読む
            </a>
            。
          </p>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">他の{categoryLabel}ツール</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((t) => {
                const rc = JA_TOOLS[t.id]!;
                return (
                  <a
                    key={t.id}
                    href={`/ja/tools/${t.id}`}
                    className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                      <span className="text-sm font-medium truncate">{rc.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {rc.tagline}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <p className="text-sm font-medium">{ja.name}を今すぐ使う — 無料です。</p>
          <a
            href={tool.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            ツールを開く
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            ブラウザのみ・ファイルはアップロードされません。
          </p>
        </section>
      </main>
    </div>
  );
}
