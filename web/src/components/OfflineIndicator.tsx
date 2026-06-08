'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

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

/** 고정 배너 높이만큼 본문을 아래로 밀어, 상단 콘텐츠(공지 배너·헤더)를 가리지 않게 한다. */
const BAR_OFFSET = '1.75rem';

export function OfflineIndicator() {
  const online = useSyncExternalStore(
    subscribeNetwork,
    getOnlineSnapshot,
    getServerSnapshot,
  );
  const prevOnlineRef = useRef<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

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

  // 배너가 떠 있는 동안 문서 상단에 같은 높이의 패딩을 줘 콘텐츠 겹침을 막는다.
  const barVisible = !online || showReconnected;
  useEffect(() => {
    if (!barVisible) return;
    const root = document.documentElement;
    const prevPadding = root.style.paddingTop;
    root.style.paddingTop = `calc(${BAR_OFFSET} + env(safe-area-inset-top))`;
    return () => {
      root.style.paddingTop = prevPadding;
    };
  }, [barVisible]);

  if (!online) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 text-white text-center pt-safe py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 shadow"
        role="alert"
        aria-live="assertive"
      >
        <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        <span>오프라인 — 마지막으로 본 화면을 표시 중입니다</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 text-white text-center pt-safe py-1.5 text-xs font-medium shadow animate-in fade-in flex items-center justify-center gap-1.5 bg-emerald-500/95"
        role="status"
        aria-live="polite"
      >
        <span>온라인 복귀</span>
      </div>
    );
  }

  return null;
}
