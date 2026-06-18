import { describe, it, expect } from 'vitest';
import { parseHex, toHexString, relativeLuminance, contrastRatio } from './color-contrast';

describe('parseHex', () => {
  it('#RRGGBB 파싱', () => {
    expect(parseHex('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('#1a1a1a')).toEqual({ r: 26, g: 26, b: 26 });
  });
  it('#RGB 축약형 확장', () => {
    expect(parseHex('#abc')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('# 없어도 허용', () => {
    expect(parseHex('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });
  it('잘못된 입력 → null', () => {
    expect(parseHex('#12')).toBeNull();
    expect(parseHex('zzzzzz')).toBeNull();
    expect(parseHex('')).toBeNull();
  });
});

describe('toHexString', () => {
  it('RGB → #RRGGBB', () => {
    expect(toHexString({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
    expect(toHexString({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });
});

describe('relativeLuminance', () => {
  it('검정 = 0, 흰색 = 1', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 6);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 6);
  });
});

describe('contrastRatio', () => {
  it('검정/흰색 = 21:1', () => {
    const r = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(r).toBeCloseTo(21, 1);
  });
  it('같은 색 = 1:1', () => {
    expect(contrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 })).toBeCloseTo(1, 6);
  });
  it('대칭성(전경·배경 순서 무관)', () => {
    const a = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 200, g: 200, b: 200 });
    const b = contrastRatio({ r: 200, g: 200, b: 200 }, { r: 0, g: 0, b: 0 });
    expect(a).toBeCloseTo(b, 10);
  });
});
