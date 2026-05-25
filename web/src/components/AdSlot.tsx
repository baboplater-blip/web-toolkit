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

  // CLS 0 보장 — 컨테이너 사이즈를 이미지 유무에 관계없이 고정.
  // placeholder · 이미지 · HTML 모드 모두 같은 박스에 들어가고, 이미지는
  // object-contain 으로 비율 유지 + 박스 안에 맞춤 (위아래 letterbox 발생 가능).
  // 가변 높이 (이미지 비율 그대로) 가 필요하다면 광고 이미지 자체를 표준 비율
  // (top/inline 970×90 · sidebar 160×600) 로 제작해 업로드.
  const containerCls = cn(
    'rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground overflow-hidden',
    isSidebar
      ? 'flex items-center justify-center w-[160px] h-[600px]'
      : isInline
        ? 'mx-auto flex items-center justify-center w-full max-w-[970px] h-[90px] min-h-[60px] my-3'
        : 'mx-auto flex items-center justify-center w-full max-w-[970px] h-[90px] min-h-[60px]',
    className,
  );

  // <div> 에는 aria-label 이 ARIA prohibited. role="complementary" 부여로 landmark 화
  // (광고는 보조 콘텐츠 — complementary landmark).
  return (
    <div
      className={containerCls}
      data-ad-slot={slotKey}
      role="complementary"
      aria-label="광고 영역"
    >
      {hasImage ? (
        image!.href ? (
          <a
            href={image!.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={image!.alt ? `광고: ${image!.alt}` : '광고 링크'}
            className="block h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image!.src}
              alt={image!.alt ?? '광고'}
              className="block h-full w-full object-contain"
              // top slot 은 LCP 후보라 eager + high priority.
              // 다른 slot 은 viewport 외라 lazy 유지.
              loading={isTop ? 'eager' : 'lazy'}
              fetchPriority={isTop ? 'high' : 'auto'}
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
            className="block h-full w-full object-contain"
            loading={isTop ? 'eager' : 'lazy'}
            fetchPriority={isTop ? 'high' : 'auto'}
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
          <p className="text-muted-foreground/80">{dims}</p>
        </div>
      )}
    </div>
  );
}
