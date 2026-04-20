'use client';

import { useEffect } from 'react';

/**
 * iOS Safari 에서 가상 키보드가 뜰 때 visualViewport 높이 변화를 추적해
 * `--kb-inset-bottom` CSS 변수로 노출한다.
 *
 * 안드로이드 Chromium 은 `env(keyboard-inset-bottom)` 를 기본 지원하지만
 * iOS Safari 는 아직 미지원이라 이 폴백이 필요하다.
 *
 * 활용:
 *   채팅 입력창 래퍼에 `padding-bottom: var(--kb-inset-bottom, 0)` 를 추가하면
 *   키보드가 입력창을 가리지 않는다.
 */
export function KeyboardInsetTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      root.style.setProperty('--kb-inset-bottom', `${Math.round(inset)}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb-inset-bottom');
    };
  }, []);

  return null;
}
