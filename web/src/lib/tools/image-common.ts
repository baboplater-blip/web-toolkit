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

/**
 * 사용자 파일을 EXIF Orientation 을 반영해 디코딩한다.
 * createImageBitmap 의 기본값은 imageOrientation:'none' 이라, 세로로 찍은
 * 휴대폰 사진(EXIF Orientation=6 등)이 90° 회전된 채로 그려진다.
 * 'from-image' 옵션으로 <img> 기반 loadImageFile 과 동일하게 방향을 보정한다.
 *
 * 일부 구형 브라우저는 옵션 인자를 무시하거나 던질 수 있으므로, 실패 시
 * 옵션 없는 호출로 폴백한다(방향 보정만 포기, 디코딩 자체는 성공).
 */
export async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return createImageBitmap(file);
  }
}

/**
 * 캔버스 한 변의 최대 픽셀(브라우저 공통 안전선). 이를 넘으면 일부 브라우저가
 * 빈(투명) 이미지를 조용히 반환한다.
 */
export const MAX_CANVAS_DIMENSION = 16384;
/** 캔버스 총 면적 상한(약 268MP). Safari 등에서 이보다 크면 렌더가 실패한다. */
export const MAX_CANVAS_AREA = 16384 * 16384;

/**
 * 목표 캔버스 크기가 브라우저 안전선 안에 있는지 검사한다.
 * 초과 시 명확한 한국어 메시지를 던져 빈 파일 생성을 막는다.
 */
export function assertCanvasSize(width: number, height: number): void {
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    throw new Error(
      `이미지 한 변이 너무 큽니다(${width}×${height}px). 한 변 최대 ${MAX_CANVAS_DIMENSION}px까지 처리할 수 있습니다.`,
    );
  }
  if (width * height > MAX_CANVAS_AREA) {
    const mp = Math.round((width * height) / 1_000_000);
    throw new Error(
      `이미지가 너무 큽니다(약 ${mp}MP). 브라우저 한계로 처리할 수 없습니다. 먼저 크기를 줄여주세요.`,
    );
  }
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
  // 빈(투명) 결과물 방지: 브라우저 캔버스 한계 초과 시 명확히 실패시킨다.
  assertCanvasSize(targetW, targetH);
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
