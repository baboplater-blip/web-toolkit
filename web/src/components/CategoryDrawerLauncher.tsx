'use client';

/**
 * CategoryDrawer 지연 로드 런처.
 *
 * CategoryDrawer 는 base-ui Sheet(Dialog) 프리미티브를 끌어오므로 무겁다. 사용자가
 * 카테고리 드로어를 열기 전(`webtoolkit:open-category-drawer` 이벤트)까지는 필요
 * 없으므로, 첫 트리거 시점에만 동적 import 한다. CommandPaletteLauncher 와 동일 패턴.
 *
 * 이 런처(+ShortcutsOverlayLauncher)로 base-ui Dialog 가 전역 공유 청크에서 빠진다
 * (레이아웃에서 base-ui 를 eager 로 쓰던 컴포넌트가 이 둘뿐).
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CategoryDrawer = dynamic(
  () => import('./CategoryDrawer').then((m) => m.CategoryDrawer),
  { ssr: false },
);

export function CategoryDrawerLauncher() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const onEvent = () => setLoaded(true);
    window.addEventListener('webtoolkit:open-category-drawer', onEvent);
    return () =>
      window.removeEventListener('webtoolkit:open-category-drawer', onEvent);
  }, [loaded]);

  if (!loaded) return null;
  return <CategoryDrawer defaultOpen />;
}
