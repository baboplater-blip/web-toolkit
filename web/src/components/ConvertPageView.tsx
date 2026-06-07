/**
 * 변환 페이지 공용 뷰 (서버 컴포넌트, 순수 프레젠테이션).
 * /convert/{slug} (ko) 와 /en/convert/{slug} (en) 가 함께 사용한다.
 */

import { ArrowLeft, ArrowRight, ArrowRightLeft, Check, GitCompare, Minus, Wrench } from 'lucide-react';
import type { Conversion, ConversionContent, Lang } from '@/lib/convert-matrix';

interface RelatedLink {
  slug: string;
  label: string;
}

interface Props {
  content: ConversionContent;
  conv: Conversion;
  lang: Lang;
  siteUrl: string;
  /** 변환 도구 실제 경로(+프리필 쿼리) */
  toolHref: string;
  related: RelatedLink[];
  /** 연결된 비교 페이지 (convert → compare 역링크) */
  relatedCompare?: { slug: string; label: string };
  /** 이 변환을 쓰는 활용법 (convert → use-case 역링크) */
  relatedUses?: RelatedLink[];
}

export function ConvertPageView({ content, conv, lang, siteUrl, toolHref, related, relatedCompare, relatedUses = [] }: Props) {
  const ko = lang === 'ko';
  const ja = lang === 'ja';
  const base = ko ? '/convert' : ja ? '/ja/convert' : '/en/convert';
  const home = ko ? '/' : ja ? '/ja' : '/en';
  const allToolsHref = ko ? '/tools' : ja ? '/ja/tools' : '/en/tools';
  const compareBase = ko ? '/compare' : ja ? '/ja/compare' : '/en/compare';
  const useBase = ko ? '/use' : ja ? '/ja/use' : '/en/use';
  const slug = `${conv.from}-to-${conv.to}`;
  const canonical = `${siteUrl}${base}/${slug}`;

  const L = ko
    ? {
        home: '홈',
        convert: '변환',
        allConvert: '모든 변환',
        about: '포맷 알아보기',
        good: '장점',
        bad: '단점',
        whatChanges: content ? '' : '',
        faq: '자주 묻는 질문',
        more: '관련 변환',
        browseAll: '모든 도구 보기',
        privacy: '업로드 없음 · 브라우저에서 변환 · 무료',
      }
    : ja
      ? {
          home: 'ホーム',
          convert: '変換',
          allConvert: 'すべての変換',
          about: 'フォーマットについて',
          good: '長所',
          bad: '短所',
          whatChanges: '',
          faq: 'よくある質問',
          more: '関連する変換',
          browseAll: 'すべてのツールを見る',
          privacy: 'アップロードなし · ブラウザで変換 · 無料',
        }
      : {
        home: 'Home',
        convert: 'Convert',
        allConvert: 'All conversions',
        about: 'About the formats',
        good: 'Pros',
        bad: 'Cons',
        whatChanges: '',
        faq: 'Frequently asked',
        more: 'Related conversions',
        browseAll: 'Browse all tools',
        privacy: 'No upload · Converts in your browser · Free',
      };

  /* ── JSON-LD: HowTo + FAQ + Breadcrumb ── */
  const inLanguage = ko ? 'ko' : ja ? 'ja' : 'en';
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: content.h1,
    description: content.description,
    inLanguage,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: ko ? '파일 선택' : ja ? 'ファイルを選択' : 'Select your file',
        text: ko
          ? `${content.fromFact.label} 파일을 끌어다 놓거나 클릭해 엽니다.`
          : ja
            ? `${content.fromFact.label}ファイルをドラッグするか、クリックして開きます。`
            : `Drag in or click to open your ${content.fromFact.label} file.`,
        url: canonical,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: ko ? '변환 실행' : ja ? '変換する' : 'Convert',
        text: ko
          ? `${content.toFact.label} 형식으로 변환합니다. 처리는 브라우저에서 이뤄집니다.`
          : ja
            ? `${content.toFact.label}形式に変換します。処理はブラウザ内で行われます。`
            : `Convert to ${content.toFact.label}. Processing happens in your browser.`,
        url: canonical,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: ko ? '내려받기' : ja ? 'ダウンロード' : 'Download',
        text: ko ? '결과 파일을 내려받습니다.' : ja ? '結果ファイルをダウンロードします。' : 'Download the result.',
        url: canonical,
      },
    ],
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage,
    mainEntity: content.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${siteUrl}${home}` },
      { '@type': 'ListItem', position: 2, name: L.convert, item: `${siteUrl}${base}` },
      { '@type': 'ListItem', position: 3, name: content.h1, item: canonical },
    ],
  };

  const FormatCard = ({ which }: { which: 'from' | 'to' }) => {
    const f = which === 'from' ? content.fromFact : content.toFact;
    const role = which === 'from'
      ? (ko ? '원본' : ja ? '元' : 'From')
      : (ko ? '대상' : ja ? '先' : 'To');
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{f.label}</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {role}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{f.summary[lang] ?? f.summary.en}</p>
        <ul className="space-y-1">
          {(f.strengths[lang] ?? f.strengths.en).map((p, j) => (
            <li key={j} className="flex items-start gap-2 text-[13px]">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
          {(f.weaknesses[lang] ?? f.weaknesses.en).map((c, j) => (
            <li key={`w${j}`} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <Minus className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <a href={base} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label={L.allConvert} title={L.allConvert}>
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ArrowRightLeft className="h-5 w-5" />
          <h1 className="text-sm sm:text-base font-semibold truncate">{content.h1}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <nav aria-label="breadcrumb" className="text-[11px] text-muted-foreground">
          <a href={home} className="hover:text-foreground">{L.home}</a>
          <span className="mx-1">/</span>
          <a href={base} className="hover:text-foreground">{L.convert}</a>
          <span className="mx-1">/</span>
          <span className="text-foreground">{content.h1}</span>
        </nav>

        <section className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{content.h1}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{content.intro}</p>
          <a
            href={toolHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Wrench className="h-4 w-4" />
            {content.ctaLabel}
          </a>
          <p className="text-[11px] text-muted-foreground">{L.privacy}</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormatCard which="from" />
          <FormatCard which="to" />
        </section>

        <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
            {ko ? '변환하면 무엇이 바뀌나' : ja ? '変換すると何が変わるか' : 'What changes when you convert'}
          </h3>
          <ul className="space-y-1.5">
            {content.changes.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold">{L.faq}</h3>
          <div className="space-y-2">
            {content.faqs.map((f, i) => (
              <details key={i} className="group rounded-xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <span className="font-medium text-sm">{f.q}</span>
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {relatedCompare && (
          <section>
            <a
              href={`${compareBase}/${relatedCompare.slug}`}
              className="flex items-center gap-2 rounded-xl border bg-card p-4 hover:border-primary transition-colors"
            >
              <GitCompare className="h-4 w-4 text-primary shrink-0" aria-hidden />
              <span className="text-sm font-medium">{relatedCompare.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" aria-hidden />
            </a>
          </section>
        )}

        {relatedUses.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">{ko ? '이 변환을 쓰는 활용법' : ja ? 'この変換を使う活用法' : 'How-tos that use this'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {relatedUses.map((u) => (
                <a
                  key={u.slug}
                  href={`${useBase}/${u.slug}`}
                  className="flex items-center gap-2 rounded-lg border bg-card p-3 hover:border-primary transition-colors"
                >
                  <Wrench className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                  <span className="text-sm font-medium truncate">{u.label}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold">{L.more}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {related.map((r) => (
                <a key={r.slug} href={`${base}/${r.slug}`} className="rounded-lg border bg-card p-3 hover:border-primary transition-colors">
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-medium truncate">{r.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="text-center">
          <a href={allToolsHref} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            {L.browseAll}
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>
    </div>
  );
}
