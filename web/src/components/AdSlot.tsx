'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { loadAdsConfig, type AdSlotConfig, type AdSlotKey } from '@/lib/ads-config';

export type AdSlotSize = 'top' | 'sidebar';

interface AdSlotProps {
  size: AdSlotSize;
  /** ads-config.json 의 슬롯 키 — 위치별 다른 광고 매핑 */
  slotKey: AdSlotKey;
  className?: string;
}

/**
 * 광고 슬롯.
 *
 * 우선순위: 이미지 광고 → HTML 광고 → placeholder
 *
 *   size='top'      : 가로 배너 (모든 화면, max 970×90)
 *   size='sidebar'  : 세로 배너 (xl 화면만, 160×600)
 */
export function AdSlot({ size, slotKey, className }: AdSlotProps) {
  const isTop = size === 'top';
  const [config, setConfig] = useState<AdSlotConfig | null>(null);

  useEffect(() => {
    loadAdsConfig().then((cfg) => setConfig(cfg.slots[slotKey]));
  }, [slotKey]);

  if (config && !config.enabled) return null;

  const dims = isTop ? '728 × 90' : '160 × 600';
  const image = config?.image;
  const html = config?.html ?? '';

  const containerCls = cn(
    'flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground overflow-hidden',
    isTop
      ? 'mx-auto w-full max-w-[970px] h-[90px] min-h-[60px]'
      : 'w-[160px] h-[600px]',
    className,
  );

  return (
    <div className={containerCls} data-ad-slot={slotKey} aria-label="광고 영역">
      {image && image.src ? (
        image.href ? (
          <a
            href={image.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block w-full h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt ?? '광고'}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={image.alt ?? '광고'}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        )
      ) : html ? (
        <div
          className="w-full h-full flex items-center justify-center"
          // admin 본인이 입력한 광고 네트워크 HTML. XSS 책임은 admin.
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
