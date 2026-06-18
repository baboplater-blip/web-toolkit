'use client';

/**
 * CommandPalette 지연 로드 런처.
 *
 * CommandPalette(+ 검색 엔진 search.ts)는 전역 레이아웃에 마운트되지만 사용자가
 * Ctrl/⌘+K 를 누르기 전까지는 화면에 필요 없다. 무거운 팔레트 코드를 초기 공유
 * 청크에서 빼고, **첫 트리거 시점에만 동적 import** 해 전 페이지의 First-Load JS 를
 * 줄인다(검색 동의어·랭킹 로직 포함).
 *
 * 동작:
 *   - 로드 전: 이 가벼운 런처만 Ctrl/⌘+K 와 `webtoolkit:open-palette` 이벤트를 감시.
 *   - 첫 트리거: 동적 import 로 CommandPalette 를 마운트하고 `defaultOpen` 으로 즉시 연다.
 *   - 로드 후: 런처는 리스너를 해제하고, 이후의 열기/닫기는 CommandPalette 자체
 *     리스너가 담당(이중 처리 없음).
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteLauncher() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 로드되면 CommandPalette 가 단축키를 넘겨받으므로 런처 리스너는 더 둘 필요 없다.
    if (loaded) return;

    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      setLoaded(true);
    };
    const onEvent = () => setLoaded(true);

    window.addEventListener('keydown', onKey);
    window.addEventListener('webtoolkit:open-palette', onEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('webtoolkit:open-palette', onEvent);
    };
  }, [loaded]);

  if (!loaded) return null;
  return <CommandPalette defaultOpen />;
}
