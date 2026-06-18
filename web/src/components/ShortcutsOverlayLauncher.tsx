'use client';

/**
 * ShortcutsOverlay 지연 로드 런처.
 *
 * 단축키 치트시트(`?` 키)는 base-ui Dialog 를 끌어오지만 첫 호출 전까지는 필요
 * 없다. 가벼운 런처만 `?` 키를 감시하다가, 첫 트리거 시 동적 import 로 오버레이를
 * 마운트하고 즉시 연다. 로드 후에는 오버레이 자체 리스너가 토글을 담당.
 *
 * CategoryDrawerLauncher 와 함께 base-ui Dialog 를 전역 공유 청크에서 제거한다.
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ShortcutsOverlay = dynamic(
  () => import('./ShortcutsOverlay').then((m) => m.ShortcutsOverlay),
  { ssr: false },
);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

export function ShortcutsOverlayLauncher() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 로드되면 ShortcutsOverlay 가 '?' 토글을 넘겨받으므로 런처 리스너는 해제.
    if (loaded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setLoaded(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loaded]);

  if (!loaded) return null;
  return <ShortcutsOverlay defaultOpen />;
}
