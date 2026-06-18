/**
 * CSS 단위 변환 — px·rem·em·pt 상호 환산.
 * (css-units 도구 page.tsx 에서 추출 — 동작 동일)
 */

export type Unit = 'px' | 'rem' | 'em' | 'pt';

export const UNITS: readonly Unit[] = ['px', 'rem', 'em', 'pt'];
export const DEFAULT_ROOT_FONT_SIZE = 16;
/** CSS 표준: 1pt = 1/72 in, 1px = 1/96 in → 1px = 0.75pt */
export const PX_PER_PT = 96 / 72;

/** 입력 값을 기준 단위에서 px 로 환산한다. em 은 rem 과 동일하게 root font-size 기준으로 본다. */
export function toPx(value: number, unit: Unit, rootFontSize: number): number {
  switch (unit) {
    case 'px':
      return value;
    case 'rem':
    case 'em':
      return value * rootFontSize;
    case 'pt':
      return value * PX_PER_PT;
    default:
      return value;
  }
}

/** px 값을 대상 단위로 환산한다. */
export function fromPx(px: number, unit: Unit, rootFontSize: number): number {
  switch (unit) {
    case 'px':
      return px;
    case 'rem':
    case 'em':
      return rootFontSize === 0 ? 0 : px / rootFontSize;
    case 'pt':
      return px / PX_PER_PT;
    default:
      return px;
  }
}

/** 불필요한 소수점 0 을 제거한 최대 4자리 문자열 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Number(value.toFixed(4)));
}
