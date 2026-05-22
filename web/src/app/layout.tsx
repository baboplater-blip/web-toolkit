import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { BottomNav } from '@/components/BottomNav';
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

export const metadata: Metadata = {
  title: 'Web Toolkit — 브라우저 도구 모음',
  description: '브라우저에서 완결되는 PDF·이미지·비디오·OCR 도구. 파일이 서버로 전송되지 않습니다.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Toolkit',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <div className="md:pl-16">{children}</div>
        <BottomNav />
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
