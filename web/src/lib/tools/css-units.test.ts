import { describe, it, expect } from 'vitest';
import { toPx, fromPx, formatNumber } from './css-units';

describe('toPx', () => {
  it('px 는 그대로', () => {
    expect(toPx(16, 'px', 16)).toBe(16);
  });
  it('1rem = root font-size px', () => {
    expect(toPx(1, 'rem', 16)).toBe(16);
    expect(toPx(2, 'rem', 16)).toBe(32);
  });
  it('em 은 root 기준(rem 과 동일 취급)', () => {
    expect(toPx(1, 'em', 16)).toBe(16);
  });
  it('1pt = 96/72 px (= 1.3333..)', () => {
    expect(toPx(72, 'pt', 16)).toBeCloseTo(96, 6);
  });
});

describe('fromPx', () => {
  it('16px = 1rem (root 16)', () => {
    expect(fromPx(16, 'rem', 16)).toBe(1);
  });
  it('1px = 0.75pt', () => {
    expect(fromPx(1, 'pt', 16)).toBeCloseTo(0.75, 6);
  });
  it('root 0 일 때 rem/em 은 0(0분 회피)', () => {
    expect(fromPx(16, 'rem', 0)).toBe(0);
  });
});

describe('toPx/fromPx 왕복', () => {
  it('px → rem → px 보존', () => {
    expect(fromPx(toPx(24, 'rem', 16), 'rem', 16)).toBe(24);
  });
  it('px → pt → px 보존', () => {
    expect(fromPx(toPx(10, 'pt', 16), 'pt', 16)).toBeCloseTo(10, 6);
  });
});

describe('formatNumber', () => {
  it('불필요한 0 제거, 최대 4자리', () => {
    expect(formatNumber(1.0)).toBe('1');
    expect(formatNumber(0.75)).toBe('0.75');
    expect(formatNumber(1.23456)).toBe('1.2346');
  });
  it('비유한값 → "0"', () => {
    expect(formatNumber(Infinity)).toBe('0');
    expect(formatNumber(NaN)).toBe('0');
  });
});
