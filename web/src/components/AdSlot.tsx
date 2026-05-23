'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { loadAdsConfig, type AdSlotConfig, type AdSlotKey } from '@/lib/ads-config';

export type AdSlotSize = 'top' | 'sidebar' | 'inline';

interface AdSlotProps {
  size: AdSlotSize;
  /** ads-config.json 의 슬롯 키 — 위치별 다른 광고 매핑 */
  slotKey: AdSlotKey;
  className?: string;
}

/** 광고 노출 카운트 (localStorage) — 어드민 통계에서 표시 */
function trackImpression(slotKey: AdSlotKey) {
  try {
    const key = 'webtoolkit/ads/impressions';
    const raw = localStorage.getItem(key);
    const obj: Record<string, number> = raw ? JSON.parse(raw) : {};
    obj[slotKey] = (obj[slotKey] ?? 0) + 1;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {
    /* private mode 등 */
  }
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
  const isInline = size === 'inline';
  const isSidebar = size === 'sidebar';
  const [config, setConfig] = useState<AdSlotConfig | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    loadAdsConfig().then((cfg) => setConfig(cfg.slots[slotKey]));
  }, [slotKey]);

  useEffect(() => {
    if (!config || !config.enabled) return;
    const hasContent = !!config.image?.src || !!config.html;
    if (!hasContent) return;
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackImpression(slotKey);
  }, [config, slotKey]);

  if (config && !config.enabled) return null;

  const dims = isSidebar ? '160 × 600' : isInline ? '728 × 90' : '728 × 90';
  const image = config?.image;
  const html = config?.html ?? '';

  const hasImage = !!(image && image.src);

  // 이미지가 있으면 컨테이너 높이를 이미지 비율로 자동 늘림 (잘리지 않음 + 빈 공간 없음).
  // placeholder/HTML 모드는 기본 사이즈 유지.
  const containerCls = cn(
    'rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground overflow-hidden',
    hasImage
      ? isSidebar
        ? 'w-[160px]'
        : isInline
          ? 'mx-auto w-full max-w-[970px] my-3'
          : 'mx-auto w-full max-w-[970px]'
      : isSidebar
        ? 'flex items-center justify-center w-[160px] h-[600px]'
        : isInline
          ? 'mx-auto flex items-center justify-center w-full max-w-[970px] h-[90px] min-h-[60px] my-3'
          : 'mx-auto flex items-center justify-center w-full max-w-[970px] h-[90px] min-h-[60px]',
    className,
  );

  return (
    <div className={containerCls} data-ad-slot={slotKey} aria-label="광고 영역">
      {hasImage ? (
        image!.href ? (
          <a
            href={image!.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image!.src}
              alt={image!.alt ?? '광고'}
              className={cn(
                'block w-full h-auto',
                isSidebar ? 'max-h-[600px] object-contain' : 'max-h-[250px] object-contain',
              )}
              loading="lazy"
              onClick={() => {
                try {
                  const key = 'webtoolkit/ads/clicks';
                  const raw = localStorage.getItem(key);
                  const obj = raw ? JSON.parse(raw) : {};
                  obj[slotKey] = (obj[slotKey] ?? 0) + 1;
                  localStorage.setItem(key, JSON.stringify(obj));
                } catch {}
              }}
            />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image!.src}
            alt={image!.alt ?? '광고'}
            className={cn(
              'block w-full h-auto',
              isSidebar ? 'max-h-[600px] object-contain' : 'max-h-[250px] object-contain',
            )}
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
