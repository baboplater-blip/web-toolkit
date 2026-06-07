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
 * Simplified Chinese landing page (/zh). Server Component — static export friendly.
 *
 * Mirrors the English landing structure but with Chinese copy and meta.
 * Curated tools have dedicated /zh/tools/{id} pages; the rest open the Korean
 * tool page (mostly icon-driven and language-agnostic).
 */

export const metadata: Metadata = {
  title: 'Web Toolkit — 100+ 款免费浏览器工具，无需上传',
  description:
    'PDF、图片、视频、音频、OCR、AI 工具直接在浏览器中使用。无需注册、无需安装、无需上传。文件绝不会离开你的设备。',
  alternates: {
    canonical: '/zh',
    languages: {
      'ko-KR': '/',
      en: '/en',
      ja: '/ja',
      zh: '/zh',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'Web Toolkit — 100+ 款免费浏览器工具，无需上传',
    description:
      'PDF、图片、视频、音频、OCR、AI — 全部在客户端处理。无需注册。无需上传。',
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'zh_CN',
    url: '/zh',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Web Toolkit — 100+ 款免费浏览器工具',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Toolkit — 100+ 款免费浏览器工具',
    description: '无需注册。无需上传。全部在浏览器内处理。',
    images: ['/og/default.png'],
  },
};

const FEATURED_CATEGORIES: Array<{
  key: string;
  label: string;
  desc: string;
  Icon: typeof FileText;
}> = [
  { key: 'pdf', label: 'PDF', desc: '合并、拆分、旋转、OCR、压缩、转换', Icon: FileText },
  { key: 'image', label: '图片', desc: '调整大小、转换、水印、EXIF、去背景', Icon: ImageIcon },
  { key: 'video', label: '视频', desc: '压缩、裁剪、转换、帧提取、GIF', Icon: Film },
  { key: 'audio', label: '音频', desc: '裁剪、转换、音量、速度、合并', Icon: AudioLines },
  { key: 'docs', label: '文档', desc: 'EPUB、DOCX、CSV、XLSX、Markdown、HWPX', Icon: FileCode },
  { key: 'security', label: '安全', desc: '加密、RSA、TOTP、密码生成', Icon: Lock },
  { key: 'ai', label: 'AI', desc: 'OCR、去背景、放大、人脸模糊', Icon: Sparkles },
  { key: 'util', label: '实用工具', desc: 'QR、条形码、哈希、base64、JSON、颜色、单位', Icon: Settings2 },
];

export default function ChineseLandingPage() {
  const readyCount = TOOLS.filter((t) => t.status === 'ready').length;

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16 space-y-12">
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            文件不会被上传。全部在浏览器内运行。
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            {readyCount}+ 款免费浏览器工具。
            <br />
            <span className="text-primary">无需注册。无需上传。</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PDF、图片、视频、音频、OCR、AI 实用工具 — 全部通过 Web Worker 与 WebAssembly 在浏览器内处理。文件绝不会离开你的设备。
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href="/zh/tools"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              查看全部工具
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/zh/guide"
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              阅读使用指南
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
            为什么选择 Web Toolkit
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <WhyItem
              Icon={ShieldCheck}
              title="从设计上注重隐私"
              body="文件在你的设备上完成处理。我们绝不会上传、保存或分析任何内容。"
            />
            <WhyItem
              Icon={Zap}
              title="无需安装、无需注册"
              body="打开 URL 即可开始。无论桌面还是移动端，都能在现代浏览器中运行。"
            />
            <WhyItem
              Icon={HeartHandshake}
              title="永久免费"
              body="所有工具均免费且无使用限制。靠广告运营，没有付费墙。"
            />
            <WhyItem
              Icon={CheckCircle2}
              title="支持离线"
              body="添加到主屏幕后，首次加载后许多工具即使无网络也能运行（PWA）。"
            />
          </div>
        </section>

        <section className="text-center text-xs text-muted-foreground space-y-2">
          <p>
            Web Toolkit 是一个无追踪、在浏览器内完成的免费实用工具中心，以隐私为首要原则构建。
          </p>
          <p>
            <a
              href="/"
              hrefLang="ko"
              className="underline hover:text-foreground"
            >
              转到한국어主页
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
