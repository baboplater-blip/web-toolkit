'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { loadAdsConfig, type AdSlotKey } from '@/lib/ads-config';

export type AdSlotSize = 'top' | 'sidebar';

interface AdSlotProps {
  size: AdSlotSize;
  /** ads-config.json 의 슬롯 키 — 위치별 다른 광고 코드 매핑 */
  slotKey: AdSlotKey;
  className?: string;
}

/**
 * 광고 슬롯.
 *
 * 동작:
 *   1. /ads-config.json 로드 (캐시됨)
 *   2. slotKey 의 enabled=false 면 자리 자체 안 그림
 *   3. html 이 있으면 dangerouslySetInnerHTML 로 렌더
 *   4. html 비어 있으면 placeholder
 *
 *   size='top'      : 가로 배너 (모든 화면, max 970×90)
 *   size='sidebar'  : 세로 배너 (xl 화면만, 160×600)
 */
export function AdSlot({ size, slotKey, className }: AdSlotProps) {
  const isTop = size === 'top';
  const [config, setConfig] = useState<{ enabled: boolean; html: string } | null>(null);

  useEffect(() => {
    loadAdsConfig().then((cfg) => setConfig(cfg.slots[slotKey]));
  }, [slotKey]);

  if (config && !config.enabled) return null;

  const dims = isTop ? '728 × 90' : '160 × 600';
  const html = config?.html ?? '';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground overflow-hidden',
        isTop
          ? 'mx-auto w-full max-w-[970px] h-[90px] min-h-[60px]'
          : 'w-[160px] h-[600px]',
        className,
      )}
      data-ad-slot={slotKey}
      aria-label="광고 영역"
    >
      {html ? (
        <div
          className="w-full h-full flex items-center justify-center"
          // 광고 네트워크 HTML 은 admin 이 의도적으로 입력. XSS 위험은 admin 본인 책임.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="text-center text-[10px] leading-tight select-none">
          <p className="font-medium">광고 영역</p>
          <p className="opacity-60">{dims}</p>
        </div>
      )}
    </div>
  );
}
