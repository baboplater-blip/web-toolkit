/**
 * 광고 이미지 처리 유틸 — 비율 유지 + 슬롯 max 안에 fit + WebP 변환.
 *
 *   1. 입력 이미지를 캔버스에 로드
 *   2. 비율을 유지하며 슬롯 max 너비/높이 안에 fit (contain) — 잘리지 않음
 *   3. WebP 인코딩 (품질 85)
 *   4. data:image/webp;base64,... 반환
 *
 * AdSlot 의 object-contain 이 슬롯 안에 자동 정렬 — 잘리지 않음.
 * SVG 도 동일 경로 (raster 화). 결과는 항상 WebP.
 */

import type { AdSlotKey } from './ads-config';

/** 광고 슬롯의 표시 사이즈 (사이트 측 AdSlot 컴포넌트와 동일) */
export const AD_SLOT_SIZES: Record<AdSlotKey, { width: number; height: number }> = {
  top: { width: 970, height: 90 },
  sidebarLeft: { width: 160, height: 600 },
  sidebarRight: { width: 160, height: 600 },
};

/**
 * 슬롯별 변환 결과의 최대 크기 (DPR 2× 까지 깨끗하게 + 비율 안 맞는 이미지도 허용).
 * 슬롯 표시 사이즈보다 더 큰 캔버스를 허용해서 비율 다른 이미지의 위아래/좌우가
 * 잘리지 않게 함.
 */
const AD_MAX_DIMENSIONS: Record<AdSlotKey, { maxW: number; maxH: number }> = {
  top: { maxW: 1940, maxH: 600 },          // 슬롯 970×90 의 2× 너비, 높이는 6.6× 까지
  sidebarLeft: { maxW: 600, maxH: 1200 },  // 슬롯 160×600 의 3.75× 너비
  sidebarRight: { maxW: 600, maxH: 1200 },
};

const WEBP_QUALITY = 0.85;

export interface ProcessedImage {
  dataUrl: string;
  estimatedBytes: number;
  width: number;
  height: number;
}

export async function processAdImage(
  file: File,
  slot: AdSlotKey,
): Promise<ProcessedImage> {
  const { maxW, maxH } = AD_MAX_DIMENSIONS[slot];

  const img = await loadImage(file);
  try {
    // 비율 유지하며 maxW × maxH 안에 fit. 더 작은 이미지는 그대로.
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const outW = Math.max(1, Math.round(img.naturalWidth * scale));
    const outH = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D 컨텍스트 생성 실패');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outW, outH);

    const blob = await new Promise<Blob>((res, rej) => {
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error('WebP 인코딩 실패 — 브라우저가 WebP 미지원'))),
        'image/webp',
        WEBP_QUALITY,
      );
    });

    const dataUrl = await blobToDataUrl(blob);
    return {
      dataUrl,
      estimatedBytes: blob.size,
      width: outW,
      height: outH,
    };
  } finally {
    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('이미지를 읽을 수 없습니다.'));
    img.src = URL.createObjectURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error ?? new Error('FileReader 실패'));
    r.readAsDataURL(blob);
  });
}
