import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { SessionRecovery } from '@/components/SessionRecovery';
import { BottomNav } from '@/components/BottomNav';
import { InstallPrompt } from '@/components/InstallPrompt';
import { KeyboardInsetTracker } from '@/components/KeyboardInsetTracker';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { RealtimeStatusBadge } from '@/components/RealtimeStatusBadge';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
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
  title: 'Agent Control Panel',
  description: 'Claude Code 원격 제어 시스템',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ACP',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // iOS notch 영역까지 배경색이 이어지게 — safe-area env() 가 유효해진다.
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
        {/* FOUC 방지: 페인트 전 localStorage 테마를 <html> 에 반영. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        {/* 스크린리더·키보드 사용자용 skip link. sr-only → 포커스 시 가시화. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground focus:shadow-lg"
        >
          본문으로 건너뛰기
        </a>
        <AuthProvider>
          <ThemeWatcher />
          <KeyboardInsetTracker />
          <OfflineIndicator />
          <RealtimeStatusBadge />
          <div className="md:pl-16">{children}</div>
          <BottomNav />
          <InstallPrompt />
          <ToastHost />
          <SessionRecovery />
          <ServiceWorkerRegister />
        </AuthProvider>
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
