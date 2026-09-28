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
    try {
      return await createImageBitmap(file);
    } catch (err) {
      // 브라우저 원문("The source image could not be decoded.")은 영문이라 사용자용 한국어로 바꾼다.
      console.error('[image-common] decode failed', err);
      throw new Error(IMAGE_DECODE_ERROR);
    }
  }
}

/** 이미지 디코딩 실패 시 사용자에게 보여줄 공통 메시지 */
export const IMAGE_DECODE_ERROR =
  '이미지를 읽을 수 없습니다. 파일이 손상되었거나 브라우저가 지원하지 않는 형식입니다(HEIC 는 HEIC→JPG 변환 도구를 먼저 이용하세요).';

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

/**
 * 입력 파일 포맷을 기본 출력 포맷으로 쓸 때 사용.
 * 주요 브라우저(Chrome·Safari·Firefox)는 캔버스 AVIF 인코딩을 지원하지 않으므로
 * AVIF 입력은 WebP 로 기본 출력한다(사용자는 여전히 수동 선택 가능).
 */
export function defaultOutputFormat(file: File, fallback: ImageFormat): ImageFormat {
  const f = detectFormatFromFile(file) ?? fallback;
  return f === 'avif' ? 'webp' : f;
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
      (b) => {
        if (!b) {
          reject(new Error('이미지 변환 실패'));
          return;
        }
        // 브라우저가 해당 포맷 인코딩을 지원하지 않으면 toBlob 이 조용히 PNG 를 돌려준다
        // (예: Chrome 의 AVIF, 구형 Safari 의 WebP). 확장자만 바뀐 PNG 가 저장되지 않도록 막는다.
        if (b.type && b.type !== mime) {
          reject(
            new Error(
              `이 브라우저는 ${format.toUpperCase()} 인코딩을 지원하지 않습니다. JPEG·PNG 등 다른 포맷을 선택하세요.`,
            ),
          );
          return;
        }
        resolve(b);
      },
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

/**
 * 용량 감소율(%). 양수=감소, 음수=증가.
 * (lib/compress/format 의 compressionRatio 는 0 미만을 0 으로 잘라 "용량 증가"를 표시할 수 없다.)
 */
export function sizeReductionPercent(original: number, output: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - output) / original) * 100);
}

/**
 * ZIP 등 한 폴더에 담을 파일명을 중복 없이 만든다(a.jpg → a-2.jpg …, 대소문자 무시).
 * 여러 입력이 같은 출력명(a.png·a.webp → a.jpg)을 가질 때 덮어쓰기로 파일이 사라지는 것을 막는다.
 */
export function uniqueFileName(used: Set<string>, name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let out = name;
  for (let n = 2; used.has(out.toLowerCase()); n++) out = `${base}-${n}${ext}`;
  used.add(out.toLowerCase());
  return out;
}
