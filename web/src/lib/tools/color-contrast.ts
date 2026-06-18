/**
 * 색상 대비 — hex 파싱 + WCAG 상대 휘도·대비비.
 * (color-contrast 도구 page.tsx 에서 추출 — 동작 동일)
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** #RGB / #RRGGBB hex 문자열을 0~255 RGB 로 파싱한다. 실패 시 null. */
export function parseHex(value: string): Rgb | null {
  const cleaned = value.trim().replace(/^#/, '');
  let hex = cleaned;
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    hex = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** RGB 를 항상 #RRGGBB 형태로 정규화한다(컬러 인풋 동기화용). */
export function toHexString(rgb: Rgb): string {
  const part = (n: number) => n.toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

/** WCAG 상대 휘도(relative luminance) 계산. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** 두 색의 WCAG 대비비(1~21)를 계산한다. */
export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
