/**
 * FFmpeg.wasm 사용 도구의 파일 용량 한계 공통 정의.
 *
 * 32-bit WASM 메모리 + MEMFS 3배 비용 + 모바일 탭 메모리 차이를 고려:
 *   - 데스크탑: 권장 1GB, 한도 1.5GB
 *   - 모바일:   권장 200MB, 한도 300MB
 *
 * 큰 파일은 /tools/video/trim 으로 잘라서 처리하도록 안내.
 */

export interface MediaLimits {
  softMB: number;
  hardMB: number;
  isMobile: boolean;
}

const DESKTOP_SOFT_MB = 1000;
const DESKTOP_HARD_MB = 1500;
const MOBILE_SOFT_MB = 200;
const MOBILE_HARD_MB = 300;

/**
 * 모바일/태블릿 브라우저 감지.
 * - UserAgent (모바일 토큰)
 * - touch-only (pointer: coarse + no mouse)
 * - deviceMemory ≤ 4GB → 모바일급으로 간주
 */
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet|Opera Mini|IEMobile/i.test(ua)) {
    return true;
  }

  // 터치 only + coarse pointer
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;
    if (coarse && noHover) return true;
  } catch {
    /* ignore */
  }

  // 저사양 기기
  const navAny = navigator as Navigator & { deviceMemory?: number };
  if (typeof navAny.deviceMemory === 'number' && navAny.deviceMemory <= 4) {
    return true;
  }

  return false;
}

export function getMediaLimits(): MediaLimits {
  const mobile = isMobileBrowser();
  return {
    isMobile: mobile,
    softMB: mobile ? MOBILE_SOFT_MB : DESKTOP_SOFT_MB,
    hardMB: mobile ? MOBILE_HARD_MB : DESKTOP_HARD_MB,
  };
}

export function fmtMB(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 파일이 hard 한도를 넘으면 에러 메시지 반환. 통과 시 null.
 * 비디오 자르기 도구로 분할 안내 포함.
 */
export function validateMediaSize(file: File): string | null {
  const { hardMB, isMobile } = getMediaLimits();
  const mb = file.size / 1024 / 1024;
  if (mb <= hardMB) return null;
  const device = isMobile ? '모바일' : '데스크탑';
  return `파일이 너무 큽니다 (${fmtMB(file.size)}). ${device} 한도 ${hardMB}MB 초과 — 브라우저 메모리 한계로 처리 불가. 비디오 자르기 도구(/tools/video/trim) 로 잘라 시도해주세요.`;
}

/**
 * 용량 안내 hint 문구.
 */
export function limitsHint(): string {
  const { softMB, hardMB, isMobile } = getMediaLimits();
  return isMobile
    ? `모바일 권장 ${softMB}MB · 한도 ${hardMB}MB`
    : `권장 ${softMB}MB · 한도 ${hardMB}MB`;
}

/**
 * "soft 초과 시 경고" 라벨 만들기 (UI 노란 띠 등).
 */
export function isOversizedSoft(file: File): boolean {
  const { softMB } = getMediaLimits();
  return file.size / 1024 / 1024 > softMB;
}

/**
 * FFmpeg 메모리 부족 패턴 감지 → 친화적 메시지.
 */
export function explainFfmpegError(msg: string, fileSize: number): string {
  if (/out of memory|memory access|allocation|aborted|maximum call/i.test(msg)) {
    const { isMobile, hardMB } = getMediaLimits();
    const device = isMobile ? '모바일' : '데스크탑';
    return `메모리 부족 — 파일이 너무 큽니다 (${fmtMB(fileSize)}). ${device} 한도 ${hardMB}MB 이내라도 길이가 길거나 해상도가 높으면 OOM 이 날 수 있습니다. /tools/video/trim 으로 더 짧게 잘라 시도해보세요.`;
  }
  return msg;
}
