import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AdSlot } from '@/components/AdSlot';
import { BottomNav } from '@/components/BottomNav';
import { CommandPaletteLauncher } from '@/components/CommandPaletteLauncher';
import { CategoryDrawerLauncher } from '@/components/CategoryDrawerLauncher';
import { ShortcutsOverlayLauncher } from '@/components/ShortcutsOverlayLauncher';
import { OnboardingHint } from '@/components/OnboardingHint';
import { NoticeBanner } from '@/components/NoticeBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { KeyboardInsetTracker } from '@/components/KeyboardInsetTracker';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { WebVitalsTracker } from '@/components/WebVitalsTracker';
import { ErrorTracker } from '@/components/ErrorTracker';
import { RecentTracker } from '@/components/tools/RecentTracker';
import { ThemeWatcher } from '@/components/ThemeWatcher';
import { ToastHost } from '@/components/ui/toast';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_DESC =
  '브라우저에서 완결되는 PDF·이미지·비디오·오디오·OCR·AI 도구 100여 종. 파일이 서버로 전송되지 않습니다.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Web Toolkit — 브라우저 도구 모음',
    template: '%s · Web Toolkit',
  },
  description: SITE_DESC,
  keywords: [
    'PDF',
    '이미지 변환',
    '비디오 변환',
    '오디오 편집',
    'OCR',
    'AI 도구',
    'EPUB',
    'GIF',
    '워터마크',
    'web tools',
    'browser tools',
    'no upload',
    '무설치',
    '온라인 도구',
    '파일 압축',
    'QR',
    '암호화',
  ],
  authors: [{ name: 'Web Toolkit' }],
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
      'en': '/en',
      'ja': '/ja',
      'zh': '/zh',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Web Toolkit',
    title: 'Web Toolkit — 브라우저 도구 모음',
    description: SITE_DESC,
    locale: 'ko_KR',
    url: '/',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Web Toolkit — 브라우저에서 완결되는 무료 도구 모음',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Toolkit — 브라우저 도구 모음',
    description:
      '브라우저에서 완결되는 PDF·이미지·비디오·오디오·OCR·AI 도구. 업로드 없음.',
    images: ['/og/default.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Toolkit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  verification: {
    // 환경변수가 비어있으면 Next 가 알아서 메타 태그를 생략한다.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
        ? {
            'naver-site-verification':
              process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
          }
        : {}),
      ...(process.env.NEXT_PUBLIC_MS_VALIDATE_01
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_MS_VALIDATE_01 }
        : {}),
    },
  },
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Web Toolkit',
  url: SITE_URL,
  description: SITE_DESC,
  inLanguage: 'ko-KR',
  publisher: {
    '@type': 'Organization',
    name: 'Web Toolkit',
    url: SITE_URL,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/tools?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '파일이 서버로 전송되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '전송되지 않습니다. 모든 처리(PDF·이미지·비디오·오디오·OCR·AI)는 브라우저 안의 Web Worker와 WebAssembly에서 수행되며, 업로드한 파일은 사용자 기기에서 나가지 않습니다.',
      },
    },
    {
      '@type': 'Question',
      name: '회원 가입이 필요한가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '필요 없습니다. 모든 도구를 무료로 즉시 사용할 수 있습니다. 광고로 운영비를 충당합니다.',
      },
    },
    {
      '@type': 'Question',
      name: '인터넷 연결이 필요한가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '첫 접속에는 필요합니다. 한 번 로드된 도구는 PWA로 오프라인에서도 동작합니다. 홈 화면에 추가하면 앱처럼 사용 가능합니다.',
      },
    },
    {
      '@type': 'Question',
      name: '얼마나 큰 파일까지 처리할 수 있나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '브라우저 메모리 제한에 따라 다르지만 일반적으로 PDF 100MB, 비디오 500MB, 이미지 50MB까지 검증되어 있습니다. 그 이상은 처리 시간이 길거나 메모리 부족이 발생할 수 있습니다.',
      },
    },
    {
      '@type': 'Question',
      name: '모바일에서도 사용 가능한가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '네. 모든 도구가 모바일 우선 설계되어 있고 터치 동작·키보드 인셋·홈 화면 추가를 지원합니다. iOS Safari·Android Chrome 양쪽에서 검증됐습니다.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the files uploaded to a server?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. All processing happens in your browser using Web Workers and WebAssembly. Your files never leave your device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to sign up?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No registration required. All tools are free to use immediately. Ad-supported.',
      },
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 접근성: 사용자 줌 차단 금지 (a11y · meta-viewport 감사)
  // PWA·a11y 표준 합의는 줌 허용 + 최대 5x.
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSON_LD),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(FAQ_JSON_LD),
          }}
        />
        {/*
         * 광고 자산 우선 fetch — AdSlot 의 hydration 후 fetch 체인이
         * LCP 임계 경로를 차지하지 않도록 첫 paint 와 동시에 다운로드 트리거.
         * top 광고 이미지는 LCP 후보라 image 타입 preload (가장 빠른 우선순위).
         */}
        <link
          rel="preload"
          href="/ads-config.json"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/ads/top.webp" as="image" />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground focus:shadow-lg"
        >
          본문으로 건너뛰기
        </a>
        <ThemeWatcher />
        <KeyboardInsetTracker />
        <OfflineIndicator />
        <RecentTracker />
        <NoticeBanner />
        <div className="md:pl-16">
          <div className="mx-auto max-w-[1720px] px-4 pt-3">
            <AdSlot size="top" slotKey="top" />
          </div>
          <div className="relative mx-auto max-w-[1720px]">
            <aside
              className="pointer-events-none absolute left-0 top-0 hidden h-full xl:block"
              aria-hidden="true"
            >
              <div className="pointer-events-auto sticky top-4 pl-2 pt-3">
                <AdSlot size="sidebar" slotKey="sidebarLeft" />
              </div>
            </aside>
            <aside
              className="pointer-events-none absolute right-0 top-0 hidden h-full xl:block"
              aria-hidden="true"
            >
              <div className="pointer-events-auto sticky top-4 pr-2 pt-3">
                <AdSlot size="sidebar" slotKey="sidebarRight" />
              </div>
            </aside>
            <div id="main-content" tabIndex={-1} className="xl:px-[180px]">
              {children}
            </div>
          </div>
        </div>
        <BottomNav />
        <CommandPaletteLauncher />
        <CategoryDrawerLauncher />
        <ShortcutsOverlayLauncher />
        <OnboardingHint />
        <InstallPrompt />
        <ToastHost />
        <ServiceWorkerRegister />
        <WebVitalsTracker />
        <ErrorTracker />
        <style>{`
          :root {
            --bottom-nav-h: 3.5rem;
          }
          @media (min-width: 768px) {
            :root { --bottom-nav-h: 0px; }
          }
        `}</style>
      </body>
    </html>
  );
}
