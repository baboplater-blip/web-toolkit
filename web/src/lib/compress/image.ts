/**
 * 이미지 압축 유틸리티 (브라우저 Canvas 기반).
 * 서버 리소스를 쓰지 않고 클라이언트에서 완전히 처리.
 */

export type ImageOutputFormat = 'jpeg' | 'webp' | 'png';

export interface ImageCompressOptions {
  /** 0~1 사이 품질 (JPEG/WebP 전용). 기본 0.75 */
  quality: number;
  /** 긴 변 기준 최대 픽셀. 0 이하면 원본 크기 유지. 기본 1920 */
  maxDimension: number;
  /** 출력 포맷. 기본 'jpeg' */
  format: ImageOutputFormat;
}

export interface ImageCompressResult {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
}

const DEFAULT_OPTIONS: ImageCompressOptions = {
  quality: 0.75,
  maxDimension: 1920,
  format: 'jpeg',
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러올 수 없습니다'));
    };
    img.src = url;
  });
}

function computeTargetSize(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (maxDimension <= 0) return { width, height };
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function compressImage(
  file: File,
  options: Partial<ImageCompressOptions> = {},
): Promise<ImageCompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const img = await loadImage(file);
  const { width, height } = computeTargetSize(img.naturalWidth, img.naturalHeight, opts.maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');

  if (opts.format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = `image/${opts.format}`;
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))),
      mimeType,
      opts.format === 'png' ? undefined : opts.quality,
    );
  });

  return {
    blob,
    width,
    height,
    mimeType,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
