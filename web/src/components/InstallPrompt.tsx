'use client';

import { useEffect, useState } from 'react';
import { X, Share, SquareDashedBottom, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  detectPlatform,
  getDeferredInstallPrompt,
  isStandalone,
  subscribeInstallPrompt,
  triggerInstallPrompt,
  type BeforeInstallPromptEvent,
  type InstallPlatform,
} from '@/lib/install-prompt';

/**
 * 모바일 사용자가 홈화면에 PWA 를 설치하도록 유도하는 자동 배너.
 *
 * 동작:
 *   - 이미 standalone 모드(홈화면 앱) 이면 표시하지 않음.
 *   - iOS Safari: 시스템 설치 프롬프트가 없으므로 "공유 → 홈 화면에 추가" 안내 표시.
 *   - Android Chrome 계열: 전역 스토어에서 deferred event 를 수신하면 네이티브 프롬프트 트리거.
 *   - 데스크탑: 숨김.
 *   - 사용자가 닫으면 localStorage 에 7일간 dismissed 기억.
 */

const STORAGE_KEY = 'acp:install-dismissed-at';
const DISMISS_DAYS = 7;

function isRecentlyDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  const dayMs = 24 * 60 * 60 * 1000;
  return Date.now() - ts < DISMISS_DAYS * dayMs;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('other');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || isRecentlyDismissed()) return;
    const p = detectPlatform();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(p);
    if (p === 'other') return;

    if (p === 'ios') {
      const t = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(t);
    }

    const current = getDeferredInstallPrompt();
    if (current) {
      setDeferred(current);
      setVisible(true);
    }
    return subscribeInstallPrompt((ev) => {
      setDeferred(ev);
      if (ev) setVisible(true);
    });
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
  };

  const handleInstall = async () => {
    const outcome = await triggerInstallPrompt();
    if (outcome !== 'unavailable') setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 bottom-[calc(var(--bottom-nav-h)+0.75rem)]',
        'z-[90] w-[92vw] max-w-md pointer-events-auto',
        'rounded-xl border bg-popover shadow-lg',
        'md:bottom-6 md:left-6 md:translate-x-0',
      )}
      role="region"
      aria-label="앱 설치 안내"
    >
      <div className="flex items-start gap-3 p-3">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <SquareDashedBottom className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">홈 화면에 추가하세요</p>
          {platform === 'ios' ? (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              하단 <Share className="inline h-3 w-3 align-[-2px]" aria-hidden="true" /> 공유 →{' '}
              <span className="font-medium">홈 화면에 추가</span> 로 앱처럼 쓰면 푸시 알림도 받을 수 있어요.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              홈 화면에 추가하면 앱처럼 실행되고 푸시 알림을 받을 수 있어요.
            </p>
          )}
          {platform === 'android' && deferred && (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              홈 화면에 추가
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent"
          aria-label="닫기"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
