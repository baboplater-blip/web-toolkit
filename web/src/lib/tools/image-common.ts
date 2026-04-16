/**
 * 이미지 도구 공통 유틸.
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export interface LoadedImage {
  element: HTMLImageElement;
  width: number;
  height: number;
  type: string;
  cleanup: () => void;
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 로드 실패'));
    };
    i.src = url;
  });
  return {
    element: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    type: file.type,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

export function detectFormatFromFile(file: File): ImageFormat | null {
  const t = file.type.toLowerCase();
  if (t.includes('jpeg') || t.includes('jpg')) return 'jpeg';
  if (t.includes('png')) return 'png';
  if (t.includes('webp')) return 'webp';
  if (t.includes('avif')) return 'avif';
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'avif') return 'avif';
  return null;
}

export function formatExtension(format: ImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality?: number,
): Promise<Blob> {
  const mime = `image/${format}`;
  const q = format === 'png' ? undefined : quality;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))),
      mime,
      q,
    );
  });
}

/** 긴 변 기준 리사이즈. 0 이하면 원본 유지. */
export function computeResize(
  w: number,
  h: number,
  maxDimension: number,
): { width: number; height: number } {
  if (maxDimension <= 0) return { width: w, height: h };
  const longest = Math.max(w, h);
  if (longest <= maxDimension) return { width: w, height: h };
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

export function drawToCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  format: ImageFormat,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');
  // JPEG/AVIF 는 알파 미지원 → 흰 배경으로 플랫
  if (format === 'jpeg' || format === 'avif') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas;
}

/** 브라우저가 AVIF 인코딩을 지원하는지 감지 (toBlob 테스트) */
export async function supportsAvifEncode(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext('2d');
  if (!ctx) return false;
  ctx.fillRect(0, 0, 1, 1);
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      c.toBlob((b) => resolve(b), 'image/avif', 0.9);
    });
    return !!blob && blob.type === 'image/avif';
  } catch {
    return false;
  }
}
