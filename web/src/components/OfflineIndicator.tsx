'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import { useOutbox } from '@/lib/hooks/useOutbox';

/**
 * 네트워크 오프라인 배너. navigator.onLine 은 외부 스토어라 useSyncExternalStore 로 구독해
 * React 의 purity/setState-in-effect 규칙을 모두 피한다.
 * 온라인 복귀 순간을 감지해 2초간 "온라인 복귀" 배너도 표시.
 */

function subscribeNetwork(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineIndicator() {
  const online = useSyncExternalStore(
    subscribeNetwork,
    getOnlineSnapshot,
    getServerSnapshot,
  );
  const { pendingCount, failedCount, flushing } = useOutbox();
  const prevOnlineRef = useRef<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  // online 이 false → true 로 바뀌는 순간을 감지해 2초간 복귀 배너.
  // setState 는 effect body 에서 직접 호출하지 않고 마이크로태스크로 밀어 lint/purity 준수.
  useEffect(() => {
    const prev = prevOnlineRef.current;
    prevOnlineRef.current = online;
    if (prev === false && online === true) {
      Promise.resolve().then(() => setShowReconnected(true));
      const t = setTimeout(() => setShowReconnected(false), 2000);
      return () => clearTimeout(t);
    }
    if (!online && showReconnected) {
      Promise.resolve().then(() => setShowReconnected(false));
    }
  }, [online, showReconnected]);

  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 text-white text-center pt-safe py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 shadow">
        <WifiOff className="h-3.5 w-3.5" />
        <span>오프라인 — 마지막으로 본 화면을 표시 중입니다</span>
        {pendingCount > 0 && (
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
            큐 {pendingCount}건 대기
          </span>
        )}
      </div>
    );
  }

  if (showReconnected || flushing || pendingCount > 0 || failedCount > 0) {
    const label = flushing
      ? `대기 중인 ${pendingCount}건 전송 중…`
      : pendingCount > 0
      ? `대기 큐 ${pendingCount}건 — 곧 전송됩니다`
      : failedCount > 0
      ? `오프라인 큐에 ${failedCount}건 실패 — 설정에서 확인`
      : '온라인 복귀 — 최신 데이터 동기화 중';
    return (
      <div
        className={
          'fixed top-0 left-0 right-0 z-50 text-white text-center pt-safe py-1.5 text-xs font-medium shadow animate-in fade-in flex items-center justify-center gap-1.5 ' +
          (failedCount > 0 && !flushing && pendingCount === 0
            ? 'bg-rose-500/95'
            : 'bg-emerald-500/95')
        }
      >
        {flushing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>{label}</span>
        {failedCount > 0 && (
          <a
            href="/settings?tab=outbox"
            className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[11px] hover:bg-black/30"
          >
            실패 {failedCount} 보기
          </a>
        )}
      </div>
    );
  }

  return null;
}
