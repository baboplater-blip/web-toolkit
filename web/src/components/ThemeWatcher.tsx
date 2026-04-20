'use client';

import { useEffect } from 'react';
import { watchSystemTheme } from '@/lib/theme';

/**
 * 시스템 색상 선호도 변경을 감시한다 (모드가 'system' 인 경우에만 실제 반영).
 * 실제 초기 적용은 `<head>` 의 inline THEME_BOOT_SCRIPT 가 수행한다.
 */
export function ThemeWatcher() {
  useEffect(() => {
    watchSystemTheme();
  }, []);
  return null;
}
