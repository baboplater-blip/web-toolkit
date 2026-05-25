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
