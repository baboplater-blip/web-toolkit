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
import { ZH_TOOLS, ZH_TOOL_IDS, getZhCopy } from '@/lib/zh-tools';
import { hasEnCopy } from '@/lib/en-tools';
import { hasJaCopy } from '@/lib/ja-tools';

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

export function generateStaticParams() {
  return ZH_TOOL_IDS.filter((id) =>
    TOOLS.some((t) => t.id === id && t.status === 'ready'),
  ).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findTool(slug: string): ToolMeta | undefined {
  if (!getZhCopy(slug)) return undefined;
  return TOOLS.find((t) => t.id === slug && t.status === 'ready');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  const zh = getZhCopy(slug);
  if (!tool || !zh) {
    return { title: '未找到工具 — Web Toolkit' };
  }
  const canonical = `/zh/tools/${tool.id}`;
  const title = `${zh.name} — 免费、在线、无需上传`;
  const description = `${zh.description} 免费、无需注册，全部在浏览器内运行。`.slice(
    0,
    155,
  );
  return {
    title,
    description,
    keywords: [...zh.keywords, '免费', '在线', '无需上传', '浏览器 工具', '无需注册'],
    alternates: {
      canonical,
      languages: {
        'ko-KR': tool.href,
        en: hasEnCopy(tool.id) ? `/en/tools/${tool.id}` : '/en/tools',
        ja: hasJaCopy(tool.id) ? `/ja/tools/${tool.id}` : '/ja/tools',
        zh: canonical,
        'x-default': tool.href,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Web Toolkit',
      locale: 'zh_CN',
      url: canonical,
      images: [
        { url: `/og/tools/${tool.id}.png`, width: 1200, height: 630, alt: zh.name },
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
    title: '从设计上注重隐私',
    body: '全部通过 Web Worker 与 WebAssembly 在浏览器内处理。数据绝不会上传到服务器。',
  },
  {
    icon: Zap,
    title: '即时、免费',
    body: '无需注册、无需安装、无使用限制。打开页面即可立即开始操作。',
  },
  {
    icon: Lock,
    title: '支持离线',
    body: '加载一次后即使无网络也能运行，并可作为 PWA 安装到主屏幕。',
  },
  {
    icon: Sparkles,
    title: '移动端适配',
    body: '采用移动优先设计，并已在 iOS Safari 与 Android Chrome 上验证。任何设备都功能完整。',
  },
];

export default async function ChineseToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = findTool(slug);
  const zh = getZhCopy(slug);
  if (!tool || !zh) notFound();

  const categoryLabel = CATEGORY_LABELS_ZH[tool.category];

  const related = TOOLS.filter(
    (t) =>
      t.status === 'ready' &&
      t.category === tool.category &&
      t.id !== tool.id &&
      ZH_TOOLS[t.id],
  )
    .sort((a, b) => a.phase - b.phase)
    .slice(0, 4);

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: zh.name,
    description: zh.description,
    url: `${SITE_URL}/zh/tools/${tool.id}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    inLanguage: 'zh',
    browserRequirements: 'Requires a modern web browser with JavaScript.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
    publisher: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    image: `${SITE_URL}/og/tools/${tool.id}.png`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/zh` },
      { '@type': 'ListItem', position: 2, name: '工具', item: `${SITE_URL}/zh/tools` },
      { '@type': 'ListItem', position: 3, name: zh.name, item: `${SITE_URL}/zh/tools/${tool.id}` },
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
            href="/zh/tools"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="全部工具"
            title="全部工具"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <tool.icon className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{zh.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/zh" className="hover:text-foreground">首页</a>
          <span className="mx-1">/</span>
          <a href="/zh/tools" className="hover:text-foreground">工具</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{zh.name}</span>
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
            {zh.name} — 免费、在浏览器内完成
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {zh.tagline} {zh.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={tool.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Wrench className="h-4 w-4" />
              打开工具
            </a>
            <a
              href={`/zh/guide/${tool.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <BookOpen className="h-4 w-4" />
              使用指南
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground">
            无需注册、无需上传、文件不会离开你的设备。
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
            搜索关键词
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {zh.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {k}
              </span>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            在寻找操作步骤或常见问题？{' '}
            <a href={`/zh/guide/${tool.id}`} className="text-primary underline">
              阅读 {zh.name} 使用指南
            </a>
            。
          </p>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">其他{categoryLabel}工具</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((t) => {
                const rc = ZH_TOOLS[t.id]!;
                return (
                  <a
                    key={t.id}
                    href={`/zh/tools/${t.id}`}
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
          <p className="text-sm font-medium">立即使用 {zh.name} — 完全免费。</p>
          <a
            href={tool.href}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            打开工具
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            仅浏览器 · 文件不会被上传。
          </p>
        </section>
      </main>
    </div>
  );
}
