import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AdSlot } from '@/components/AdSlot';
import { BottomNav } from '@/components/BottomNav';
import { CommandPalette } from '@/components/CommandPalette';
import { NoticeBanner } from '@/components/NoticeBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { KeyboardInsetTracker } from '@/components/KeyboardInsetTracker';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { RecentTracker } from '@/components/tools/RecentTracker';
import { ThemeWatcher } from '@/components/ThemeWatcher';
import { ToastHost } from '@/components/ui/toast';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// BOM(U+FEFF) trim — Vercel 환경변수에 invisible 문자가 prefix 되는 사고 방어
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^﻿/, '').replace(/\/$/, '') ??
  'https://agent-control-panel-phi.vercel.app';

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
        alt: 'Web Toolkit — 브라우저에서 완결되는 무료 도구 109종',
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
        <CommandPalette />
        <InstallPrompt />
        <ToastHost />
        <ServiceWorkerRegister />
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
