'use client';

import { usePathname } from 'next/navigation';
import { AdSlot } from './AdSlot';

/**
 * 도구 페이지 본문 위에 자동으로 표시되는 인라인 광고.
 * 허브(/tools) 와 어드민에서는 표시하지 않음.
 */
export function InlineToolAd() {
  const pathname = usePathname();
  if (!pathname) return null;
  if (pathname === '/tools' || pathname === '/tools/') return null;
  if (!pathname.startsWith('/tools/')) return null;
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-2">
      <AdSlot size="inline" slotKey="inline" />
    </div>
  );
}
