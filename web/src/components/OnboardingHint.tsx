'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * 첫 방문자 온보딩 힌트 — Ctrl+K 검색을 안내하는 dismissible 토스트.
 *
 * - localStorage 키 `webtoolkit/onboarded/v1` 로 1회성 게이트.
 * - mount 후 1.5초 지연 노출(LCP 임계 경로 방해 방지).
 * - 닫거나 7초 경과 시 사라지며, 두 경우 모두 onboarded 플래그를 기록한다.
 * - 모바일 하단 탭바(h-14)와 겹치지 않도록 bottom 여백을 확보한다.
 */

const ONBOARDED_KEY = 'webtoolkit/onboarded/v1';
const SHOW_DELAY_MS = 1500;
const AUTO_DISMISS_MS = 7000;

function hasOnboarded(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    // localStorage 차단(프라이빗 모드 등) 시 힌트를 띄우지 않는다.
    return true;
  }
}

function markOnboarded(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // 저장 실패는 무시 — 다음 방문에 다시 보일 수 있으나 치명적이지 않다.
  }
}

export function OnboardingHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasOnboarded()) return;

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const dismissTimer = window.setTimeout(() => {
      markOnboarded();
      setVisible(false);
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(dismissTimer);
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    markOnboarded();
    setVisible(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 z-40 max-w-[20rem] bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] md:bottom-4"
    >
      <div className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-lg">
        <p className="flex-1 text-sm leading-relaxed text-foreground">
          💡{' '}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            Ctrl
          </kbd>
          <span className="mx-0.5 text-xs text-muted-foreground">+</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            K
          </kbd>{' '}
          로 어디서든 250개 도구를 빠르게 검색하세요.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="안내 닫기"
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
