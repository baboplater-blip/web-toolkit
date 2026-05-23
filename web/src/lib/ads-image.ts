/**
 * 광고 이미지 처리 유틸 — 슬롯 사이즈로 자동 리사이즈 + WebP 변환.
 *
 *   1. 입력 이미지를 캔버스에 로드
 *   2. 슬롯 비율(cover)에 맞춰 중앙 crop
 *   3. WebP 인코딩 (품질 85)
 *   4. data:image/webp;base64,... 반환
 *
 * SVG 도 동일 경로 (raster 화). 결과는 항상 WebP.
 */

import type { AdSlotKey } from './ads-config';

export const AD_SLOT_SIZES: Record<AdSlotKey, { width: number; height: number }> = {
  top: { width: 970, height: 90 },
  sidebarLeft: { width: 160, height: 600 },
  sidebarRight: { width: 160, height: 600 },
};

const WEBP_QUALITY = 0.85;

export interface ProcessedImage {
  dataUrl: string;
  /** 결과 base64 부분 길이(대략 KB 계산용) */
  estimatedBytes: number;
  width: number;
  height: number;
}

export async function processAdImage(
  file: File,
  slot: AdSlotKey,
): Promise<ProcessedImage> {
  const { width: dstW, height: dstH } = AD_SLOT_SIZES[slot];

  const img = await loadImage(file);
  try {
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const dstRatio = dstW / dstH;

    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (srcRatio > dstRatio) {
      sw = img.naturalHeight * dstRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else if (srcRatio < dstRatio) {
      sh = img.naturalWidth / dstRatio;
      sy = (img.naturalHeight - sh) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D 컨텍스트 생성 실패');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dstW, dstH);

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
      width: dstW,
      height: dstH,
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
