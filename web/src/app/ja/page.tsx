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
  Hexagon,
  ShieldCheck,
  Zap,
  HeartHandshake,
} from 'lucide-react';
import { TOOLS } from '@/lib/tools/registry';

/**
 * Japanese landing page (/ja). Server Component — static export friendly.
 *
 * Mirrors the English landing structure but with Japanese copy and meta.
 * Curated tools have dedicated /ja/tools/{id} pages; the rest open the Korean
 * tool page (mostly icon-driven and language-agnostic).
 */

export const metadata: Metadata = {
  title: 'Web Toolkit — 100以上の無料ブラウザツール、アップロード不要',
  description:
    'PDF・画像・動画・音声・OCR・AIツールをブラウザ上でそのまま利用。登録・インストール・アップロード不要。ファイルが端末から外に出ることはありません。',
  alternates: {
    canonical: '/ja',
    languages: {
      'ko-KR': '/',
      en: '/en',
      ja: '/ja',
      zh: '/zh',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'Web Toolkit — 100以上の無料ブラウザツール、アップロード不要',
    description:
      'PDF・画像・動画・音声・OCR・AI — すべてクライアント側で処理。登録不要。アップロード不要。',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ja_JP',
    url: '/ja',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Web Toolkit — 100以上の無料ブラウザツール',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Toolkit — 100以上の無料ブラウザツール',
    description: '登録不要。アップロード不要。すべてブラウザ内で処理。',
    images: ['/og/default.png'],
  },
};

const FEATURED_CATEGORIES: Array<{
  key: string;
  label: string;
  desc: string;
  Icon: typeof FileText;
}> = [
  { key: 'pdf', label: 'PDF', desc: '結合・分割・回転・OCR・圧縮・変換', Icon: FileText },
  { key: 'image', label: '画像', desc: 'リサイズ・変換・透かし・EXIF・背景除去', Icon: ImageIcon },
  { key: 'video', label: '動画', desc: '圧縮・カット・変換・フレーム抽出・GIF', Icon: Film },
  { key: 'audio', label: '音声', desc: 'カット・変換・音量・速度・結合', Icon: AudioLines },
  { key: 'docs', label: '文書', desc: 'EPUB・DOCX・CSV・XLSX・Markdown・HWPX', Icon: FileCode },
  { key: 'security', label: 'セキュリティ', desc: '暗号化・RSA・TOTP・パスワード生成', Icon: Lock },
  { key: 'ai', label: 'AI', desc: 'OCR・背景除去・アップスケール・顔ぼかし', Icon: Sparkles },
  { key: 'util', label: 'ユーティリティ', desc: 'QR・バーコード・ハッシュ・base64・JSON・色・単位', Icon: Settings2 },
];

export default function JapaneseLandingPage() {
  const readyCount = TOOLS.filter((t) => t.status === 'ready').length;

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16 space-y-12">
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ファイルはアップロードされません。すべてブラウザ内で動作します。
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            {readyCount}以上の無料ブラウザツール。
            <br />
            <span className="text-primary">登録不要。アップロード不要。</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PDF・画像・動画・音声・OCR・AIユーティリティ — すべてWeb WorkerとWebAssemblyでブラウザ内処理。ファイルが端末から外に出ることはありません。
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href="/ja/tools"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              すべてのツールを見る
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/ja/guide"
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              使い方ガイドを読む
            </a>
            <a
              href="/"
              hrefLang="ko"
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              한국어で見る
            </a>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURED_CATEGORIES.map((cat) => (
            <a
              key={cat.key}
              href={`/tools?category=${cat.key}`}
              className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <cat.Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="text-sm font-semibold">{cat.label}</h2>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {cat.desc}
              </p>
            </a>
          ))}
        </section>

        <section className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-primary" />
            Web Toolkit を選ぶ理由
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <WhyItem
              Icon={ShieldCheck}
              title="設計からプライバシー重視"
              body="ファイルは端末上で完結処理。私たちが何かをアップロード・保存・分析することはありません。"
            />
            <WhyItem
              Icon={Zap}
              title="インストール不要・登録不要"
              body="URLを開くだけで開始。デスクトップでもモバイルでも、最新ブラウザで動作します。"
            />
            <WhyItem
              Icon={HeartHandshake}
              title="ずっと無料"
              body="すべてのツールが利用制限なしで無料。広告で運営し、課金の壁はありません。"
            />
            <WhyItem
              Icon={CheckCircle2}
              title="オフライン対応"
              body="ホーム画面に追加すれば、初回読み込み後はネットなしでも多くのツールが動作します（PWA）。"
            />
          </div>
        </section>

        <section className="text-center text-xs text-muted-foreground space-y-2">
          <p>
            Web Toolkit は、トラッキングなし・ブラウザ完結の無料ユーティリティハブです。プライバシーを第一原則に構築しています。
          </p>
          <p>
            <a
              href="/"
              hrefLang="ko"
              className="underline hover:text-foreground"
            >
              한국어メインページへ移動
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}

function WhyItem({
  Icon,
  title,
  body,
}: {
  Icon: typeof FileText;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
        {title}
      </h3>
      <p className="text-muted-foreground text-[13px] leading-relaxed">{body}</p>
    </div>
  );
}
