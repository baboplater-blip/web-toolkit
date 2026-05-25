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
 * English landing page (/en). Server Component — static export friendly.
 *
 * Mirrors the Korean landing structure but with localized copy and meta.
 * Tool pages themselves remain Korean for now (round 24 first pass).
 * Future rounds may localize tool pages individually.
 */

export const metadata: Metadata = {
  title: 'Web Toolkit — 100+ Free Browser Tools, No Upload',
  description:
    'Use PDF, image, video, audio, OCR, and AI tools right in your browser. No signup, no install, no upload. Your files never leave your device.',
  alternates: {
    canonical: '/en',
    languages: {
      'ko-KR': '/',
      'en': '/en',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'Web Toolkit — 100+ Free Browser Tools, No Upload',
    description:
      'PDF, image, video, audio, OCR, AI — all client-side. No signup. No upload.',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'en_US',
    url: '/en',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Web Toolkit — 100+ free browser tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Toolkit — 100+ Free Browser Tools',
    description: 'No signup. No upload. All processing in your browser.',
    images: ['/og/default.png'],
  },
};

const FEATURED_CATEGORIES: Array<{
  key: string;
  label: string;
  desc: string;
  Icon: typeof FileText;
}> = [
  { key: 'pdf', label: 'PDF', desc: 'Merge, split, rotate, OCR, compress, convert', Icon: FileText },
  { key: 'image', label: 'Image', desc: 'Resize, convert, watermark, EXIF, background removal', Icon: ImageIcon },
  { key: 'video', label: 'Video', desc: 'Compress, trim, convert, extract frames, GIF', Icon: Film },
  { key: 'audio', label: 'Audio', desc: 'Trim, convert, volume, speed, merge', Icon: AudioLines },
  { key: 'docs', label: 'Documents', desc: 'EPUB, DOCX, CSV, XLSX, Markdown, HWPX', Icon: FileCode },
  { key: 'security', label: 'Security', desc: 'Encrypt, RSA, TOTP, password generator', Icon: Lock },
  { key: 'ai', label: 'AI', desc: 'OCR, background removal, upscale, face blur', Icon: Sparkles },
  { key: 'util', label: 'Utility', desc: 'QR, barcode, hash, base64, JSON, color, units', Icon: Settings2 },
];

export default function EnglishLandingPage() {
  const readyCount = TOOLS.filter((t) => t.status === 'ready').length;

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16 space-y-12">
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Files never uploaded. Runs entirely in your browser.
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            {readyCount}+ Free Browser Tools.
            <br />
            <span className="text-primary">No Signup. No Upload.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PDF, image, video, audio, OCR, AI utilities — all processed inside
            your browser with Web Workers and WebAssembly. Your files never leave
            your device.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/"
              hrefLang="ko"
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              한국어로 보기
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
            Why Web Toolkit?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <WhyItem
              Icon={ShieldCheck}
              title="Privacy by design"
              body="Files are processed entirely on your device. Nothing is uploaded, stored, or analyzed by us."
            />
            <WhyItem
              Icon={Zap}
              title="No install. No signup."
              body="Open a URL and start. Works on any modern browser, desktop or mobile."
            />
            <WhyItem
              Icon={HeartHandshake}
              title="Free forever"
              body="All tools are free with no usage limits. Ad-supported, never paywalled."
            />
            <WhyItem
              Icon={CheckCircle2}
              title="Works offline"
              body="Add to home screen — most tools work without internet after the first load (PWA)."
            />
          </div>
        </section>

        <section className="text-center text-xs text-muted-foreground space-y-2">
          <p>
            Web Toolkit is a free, no-tracking, browser-only utility hub. Built
            with privacy as the first principle.
          </p>
          <p>
            <a
              href="/"
              hrefLang="ko"
              className="underline hover:text-foreground"
            >
              한국어 메인 페이지로 이동
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
