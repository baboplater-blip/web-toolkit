'use client';

import { usePushSubscription } from '@/lib/hooks/usePushSubscription';
import { Loader2, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 설정 페이지의 "푸시 알림" 행 — 지원·권한·구독 상태를 하나의 토글로 묶는다.
 */
export function PushToggle() {
  const { supported, permission, subscribed, status, enable, disable } = usePushSubscription();

  if (!supported) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-medium">푸시 알림</p>
          <p className="text-[11px] text-muted-foreground">
            이 브라우저는 Web Push 를 지원하지 않습니다.
          </p>
        </div>
        <BellOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  const blocked = permission === 'denied';
  const active = subscribed && permission === 'granted';
  const busy = status !== 'idle';

  const handleToggle = async () => {
    if (busy) return;
    if (active) {
      await disable();
    } else {
      await enable();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">푸시 알림</p>
        <p className="text-[11px] text-muted-foreground">
          {blocked
            ? '브라우저 설정에서 알림을 차단했습니다. 주소창 좌측 자물쇠 → 알림 허용으로 변경하세요.'
            : active
              ? '이 기기로 작업 완료·에러 알림을 받습니다.'
              : '이 기기에서 작업 완료·에러 알림을 받고 싶으면 켜세요.'}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || blocked}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          active ? 'bg-primary' : 'bg-muted',
          (busy || blocked) && 'opacity-50 cursor-not-allowed',
        )}
        role="switch"
        aria-checked={active}
        aria-label="푸시 알림 토글"
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-5 w-5 rounded-full bg-background transition-transform shadow',
            active ? 'translate-x-5' : 'translate-x-0',
            'flex items-center justify-center',
          )}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : active ? (
            <Bell className="h-3 w-3 text-primary" />
          ) : (
            <BellOff className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}
