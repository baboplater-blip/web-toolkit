'use client';

import { useEffect } from 'react';
import { installGlobalErrorHandlers } from '@/lib/error-report';

/**
 * 앱 부트 시 전역 에러 핸들러 (window.onerror + unhandledrejection) 를 설치.
 * layout.tsx 에 한 번만 마운트.
 */
export function ErrorReporter() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);
  return null;
}
