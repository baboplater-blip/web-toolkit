import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, GitCompare, Minus, Wrench } from 'lucide-react';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { EN_TOOLS } from '@/lib/en-tools';
import {
  COMPARE_SLUGS,
  getCompare,
  type CompareOption,
} from '@/lib/en-compares';

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
  const tool = TOOLS.find((t) => t.id === opt.toolId && t.status === 'ready');
  return tool?.href;
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
  const canonical = `/en/compare/${cmp.slug}`;
  return {
    title: cmp.title,
    description: cmp.description,
    keywords: [...cmp.keywords, 'vs', 'comparison', 'which is better', 'free', 'online'],
    alternates: { canonical, languages: { en: canonical, 'x-default': canonical } },
    openGraph: {
      title: cmp.title,
      description: cmp.description,
      type: 'article',
      siteName: 'Web Toolkit',
      locale: 'en_US',
      url: canonical,
      images: [
        { url: `/og/${cmp.category}.png`, width: 1200, height: 630, alt: cmp.h1 },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: cmp.title,
      description: cmp.description,
      images: [`/og/${cmp.category}.png`],
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const cmp = getCompare(slug);
  if (!cmp) notFound();

  const categoryLabel = CATEGORY_LABELS_EN[cmp.category];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cmp.title,
    description: cmp.description,
    inLanguage: 'en',
    dateModified: new Date().toISOString().slice(0, 10),
    author: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Web Toolkit', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/en/compare/${cmp.slug}`,
    image: `${SITE_URL}/og/${cmp.category}.png`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/en` },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/en/compare` },
      { '@type': 'ListItem', position: 3, name: cmp.h1, item: `${SITE_URL}/en/compare/${cmp.slug}` },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'en',
    mainEntity: cmp.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const others = COMPARE_SLUGS.filter((s) => s !== cmp.slug).slice(0, 4);

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a
            href="/en/compare"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="All comparisons"
            title="All comparisons"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <GitCompare className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{cmp.h1}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href="/en" className="hover:text-foreground">Home</a>
          <span className="mx-1">/</span>
          <a href="/en/compare" className="hover:text-foreground">Compare</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{cmp.h1}</span>
        </nav>

        <section className="space-y-3">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {categoryLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{cmp.h1}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {cmp.intro}
          </p>
        </section>

        {/* Side-by-side options */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cmp.options.map((opt, i) => {
            const href = optionHref(opt);
            return (
              <div key={i} className="rounded-xl border bg-card p-4 space-y-3 flex flex-col">
                <h3 className="text-lg font-bold">{opt.label}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Best for: </span>
                  {opt.best}
                </p>
                <ul className="space-y-1">
                  {opt.pros.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-[13px]">
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                      <span>{p}</span>
                    </li>
                  ))}
                  {opt.cons.map((c, j) => (
                    <li key={`c${j}`} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                      <Minus className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" aria-hidden />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                {href && (
                  <a
                    href={href}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Wrench className="h-4 w-4" />
                    Open {opt.label}
                  </a>
                )}
              </div>
            );
          })}
        </section>

        {/* Verdict */}
        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Which should you use?
          </h3>
          <p className="text-sm leading-relaxed">{cmp.verdict}</p>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold">Frequently asked</h3>
          <div className="space-y-2">
            {cmp.faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <span className="font-medium text-sm">{f.q}</span>
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">More comparisons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {others.map((s) => {
                const o = getCompare(s)!;
                return (
                  <a
                    key={s}
                    href={`/en/compare/${s}`}
                    className="rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
                      <span className="text-sm font-medium truncate">{o.h1}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {o.description}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <section className="text-center">
          <a
            href="/en/tools"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Browse all tools
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>
    </div>
  );
}
