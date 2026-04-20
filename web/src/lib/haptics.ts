/**
 * 모바일·PWA 에서 가벼운 햅틱 피드백.
 *
 * - Android Chrome: navigator.vibrate(ms) 지원.
 * - iOS Safari: vibrate 미지원 — no-op. 별도 대안(예: <label for="x"><input type="checkbox">)
 *   없이는 시스템 햅틱을 흉내 낼 수 없으므로 함수만 안전하게 호출되도록 둔다.
 * - 사용자가 reduced-motion 을 선호하면 무시.
 */

type Kind = 'tap' | 'success' | 'warn' | 'error';

const PATTERN_MS: Record<Kind, number | number[]> = {
  tap: 8,
  success: [6, 30, 6],
  warn: [12, 60, 12],
  error: [30, 40, 30],
};

function reducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function haptic(kind: Kind = 'tap') {
  if (typeof navigator === 'undefined') return;
  if (typeof (navigator as Navigator & { vibrate?: (p: number | number[]) => void }).vibrate !== 'function') return;
  if (reducedMotion()) return;
  try {
    (navigator as Navigator & { vibrate: (p: number | number[]) => boolean }).vibrate(
      PATTERN_MS[kind],
    );
  } catch {}
}
