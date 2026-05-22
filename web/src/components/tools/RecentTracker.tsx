'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TOOLS } from '@/lib/tools/registry';
import { recordRecent } from '@/lib/tools/usage';

/**
 * 도구 페이지 진입 시 자동으로 최근 사용 기록을 남긴다.
 * layout 에 한 번만 마운트. registry 에 없는 임의 경로는 무시.
 */
export function RecentTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith('/tools/')) return;
    const match = TOOLS.find((t) => t.href === pathname);
    if (match && match.status === 'ready') {
      recordRecent(match.id);
    }
  }, [pathname]);

  return null;
}
