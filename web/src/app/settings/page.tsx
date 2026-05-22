'use client';

import { Settings2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <Settings2 className="h-5 w-5" />
          <h1 className="text-base font-semibold">설정</h1>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl space-y-4 p-4">
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            앱 설정
          </h2>
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">테마</p>
                <p className="text-[11px] text-muted-foreground">
                  인터페이스 색상
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        <section className="space-y-2 pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            정보
          </h2>
          <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Web Toolkit</strong> 은 브라우저
              안에서 완결되는 도구 모음입니다. 사용자가 올린 파일은 서버로
              전송되지 않으며, 모든 처리(압축·변환·OCR·AI)는 사용자의 기기에서
              수행됩니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
