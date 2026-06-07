import type { Metadata } from 'next';
import {
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Film,
  AudioLines,
  FileCode,
  Lock,
  Sparkles,
  Settings2,
  ShieldCheck,
  Zap,
  HeartHandshake,
  Search,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  TOOLS,
  type ToolCategory,
  type ToolMeta,
} from '@/lib/tools/registry';
import { SUPER_CATEGORIES } from '@/lib/tools/super-categories';
import { HomeSearch } from '@/components/home/HomeSearch';
import { HomePersonalized } from '@/components/home/HomePersonalized';

/**
 * 사이트 루트 (/). 이전 버전은 /tools 로 즉시 redirect 했지만, 첫 방문자에게
 * 미션·신뢰 시그널·도구 카테고리를 보여줄 랜딩 페이지로 전환.
 *
 * Server Component — 정적 export 호환, SSR 단계에 모든 콘텐츠가 HTML 에 박힘.
 */

export const metadata: Metadata = {
  title: 'Web Toolkit — 브라우저에서 끝나는 무료 도구 100여 종',
  description:
    '회원가입·설치·업로드 없이 PDF·이미지·비디오·오디오·OCR·AI 도구를 브라우저에서 바로 사용하세요. 파일은 서버로 전송되지 않습니다.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Web Toolkit — 브라우저에서 끝나는 무료 도구',
    description:
      '회원가입·설치·업로드 없이 100여 종의 무료 도구. 파일은 서버로 전송되지 않습니다.',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ko_KR',
    url: '/',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Web Toolkit — 브라우저에서 끝나는 무료 도구',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Toolkit — 브라우저에서 끝나는 무료 도구',
    description: '회원가입·설치·업로드 없이 100여 종의 무료 도구.',
    images: ['/og/default.png'],
  },
};

const CATEGORY_ICON: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  pdf: FileText,
  video: Film,
  gif: Film,
  audio: AudioLines,
  docs: FileText,
  text: FileText,
  dev: FileCode,
  util: Settings2,
  security: Lock,
  ai: Sparkles,
};

const CATEGORY_ACCENT: Record<ToolCategory, string> = {
  image: 'from-blue-500/15 to-blue-500/5 text-blue-400 border-blue-500/30',
  pdf: 'from-red-500/15 to-red-500/5 text-red-400 border-red-500/30',
  video: 'from-violet-500/15 to-violet-500/5 text-violet-400 border-violet-500/30',
  gif: 'from-orange-500/15 to-orange-500/5 text-orange-400 border-orange-500/30',
  audio: 'from-cyan-500/15 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
  docs: 'from-emerald-500/15 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
  text: 'from-amber-500/15 to-amber-500/5 text-amber-400 border-amber-500/30',
  dev: 'from-teal-500/15 to-teal-500/5 text-teal-400 border-teal-500/30',
  util: 'from-slate-500/15 to-slate-500/5 text-slate-300 border-slate-500/30',
  security: 'from-rose-500/15 to-rose-500/5 text-rose-400 border-rose-500/30',
  ai: 'from-sky-500/15 to-sky-500/5 text-sky-400 border-sky-500/30',
};

/** 인기 도구 ID — 트래픽·범용성 기준 수기 선정 */
const FEATURED_TOOL_IDS = [
  'compress',
  'pdf-merge',
  'image-resize',
  'pdf-split',
  'image-watermark',
  'util-qr',
  'image-remove-background',
  'pdf-to-jpg',
];

/* ---------- Server-side derivations ---------- */

const readyTools = TOOLS.filter((t) => t.status === 'ready');

const toolById = new Map<string, ToolMeta>();
for (const t of TOOLS) toolById.set(t.id, t);

const featuredTools = FEATURED_TOOL_IDS.map((id) => toolById.get(id)).filter(
  (t): t is ToolMeta => !!t && t.status === 'ready',
);

const byCategory = new Map<ToolCategory, ToolMeta[]>();
for (const t of readyTools) {
  const list = byCategory.get(t.category) ?? [];
  list.push(t);
  byCategory.set(t.category, list);
}
for (const [, list] of byCategory) list.sort((a, b) => a.phase - b.phase);

/* ---------- Page ---------- */

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary)/0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, hsl(var(--primary)/0.06), transparent)',
          }}
        />
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 md:pt-24 md:pb-20 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            파일은 서버로 전송되지 않습니다 — 모든 처리는 당신의 브라우저 안에서
          </p>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            브라우저 안에서 끝나는
            <br className="hidden md:block" />{' '}
            <span className="text-primary">무료 도구 {readyTools.length}종</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            PDF·이미지·비디오·오디오·OCR·AI 까지 — 회원가입 없이, 설치 없이, 업로드 없이.
            지금 바로 사용하세요.
          </p>

          <HomeSearch />

          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href="/tools"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              전체 도구 둘러보기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              어디서나{' '}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl
              </kbd>
              <span className="mx-0.5">+</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                K
              </kbd>{' '}
              로 검색
            </span>
          </div>

          <ul
            className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-2 text-xs md:grid-cols-4"
            aria-label="핵심 약속"
          >
            {[
              { icon: ShieldCheck, label: '업로드 없음' },
              { icon: Zap, label: '설치 없음' },
              { icon: HeartHandshake, label: '회원가입 없음' },
              { icon: CheckCircle2, label: `${readyTools.length}개 도구` },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center justify-center gap-1.5 rounded-lg border bg-card/50 px-3 py-2 backdrop-blur"
              >
                <Icon
                  className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 개인화 — 즐겨찾기·최근 (데이터 있을 때만, 클라이언트) */}
      <HomePersonalized />

      {/* Featured tools */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">인기 도구</h2>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              가장 자주 사용되는 8개 — 클릭하면 바로 실행됩니다.
            </p>
          </div>
          <a
            href="/tools"
            className="hidden text-xs text-primary hover:underline md:inline"
          >
            전체 보기 →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {featuredTools.map((t) => {
            const Icon = t.icon;
            return (
              <a
                key={t.id}
                href={t.href}
                className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold leading-tight">{t.title}</h3>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  열기
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Categories — 5개 슈퍼카테고리로 묶어 표시 */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-xl font-bold md:text-2xl">카테고리</h2>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            필요한 작업으로 바로 이동하세요.
          </p>

          <div className="mt-6 space-y-8">
            {SUPER_CATEGORIES.map((sc) => {
              const cats = sc.categories.filter(
                (c) => (byCategory.get(c)?.length ?? 0) > 0,
              );
              if (cats.length === 0) return null;
              const SuperIcon = sc.icon;
              const total = cats.reduce(
                (n, c) => n + (byCategory.get(c)?.length ?? 0),
                0,
              );
              return (
                <div key={sc.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SuperIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-sm font-bold">{sc.label}</h3>
                    <span className="text-[11px] text-muted-foreground">{sc.blurb}</span>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {total}개
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {cats.map((cat) => {
                      const list = byCategory.get(cat)!;
                      const Icon = CATEGORY_ICON[cat] ?? FileText;
                      const accent = CATEGORY_ACCENT[cat];
                      const sample = list.slice(0, 3);
                      return (
                        <a
                          key={cat}
                          href={`/tools?category=${cat}`}
                          className={`group relative flex flex-col gap-2 rounded-xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${accent}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            <h4 className="text-sm font-bold text-foreground">
                              {CATEGORY_LABELS[cat]}
                            </h4>
                            <span className="ml-auto rounded bg-background/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                              {list.length}
                            </span>
                          </div>
                          <ul className="mt-1 space-y-0.5 text-[11px] text-foreground/80">
                            {sample.map((t) => (
                              <li key={t.id} className="truncate">
                                · {t.title}
                              </li>
                            ))}
                            {list.length > sample.length && (
                              <li className="text-[10px] text-foreground/60">
                                외 {list.length - sample.length}개
                              </li>
                            )}
                          </ul>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <div className="text-center">
          <h2 className="text-xl font-bold md:text-3xl">왜 Web Toolkit 인가</h2>
          <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground md:text-sm">
            온라인 도구는 많지만, 파일을 그들의 서버로 보내야 합니다. 우리는 다릅니다.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-base font-bold">완전한 프라이버시</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              모든 처리는 당신의 브라우저 안에서 Web Worker 와 WebAssembly 로 실행됩니다.
              파일은 단 한 번도 서버로 가지 않습니다.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-base font-bold">즉시 시작</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              회원가입·설치·앱 다운로드 없이 클릭 한 번으로 사용. PWA 로 설치해서
              오프라인 사용도 가능합니다.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-base font-bold">영구 무료</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              유료 플랜·이용 제한·결제 정보 요구 없음. 사용량 한도도 당신의 기기 성능이
              유일한 제한입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center md:py-16">
          <h2 className="text-xl font-bold md:text-2xl">지금 시작하세요</h2>
          <p className="mt-2 text-xs text-muted-foreground md:text-sm">
            {readyTools.length}개 도구가 무료로 준비되어 있습니다.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href="/tools"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              도구 전체 보기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              어디서든 <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
              <span className="mx-0.5">+</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
