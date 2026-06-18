import { describe, it, expect } from 'vitest';
import { arabicToRoman, romanToArabic, detectDirection } from './roman-numeral';

describe('arabicToRoman', () => {
  it('알려진 변환', () => {
    expect(arabicToRoman('1').value).toBe('I');
    expect(arabicToRoman('4').value).toBe('IV');
    expect(arabicToRoman('9').value).toBe('IX');
    expect(arabicToRoman('2024').value).toBe('MMXXIV');
    expect(arabicToRoman('3999').value).toBe('MMMCMXCIX');
  });
  it('콤마 허용', () => {
    expect(arabicToRoman('2,024').value).toBe('MMXXIV');
  });
  it('범위 밖·비정수 거부', () => {
    expect(arabicToRoman('0').ok).toBe(false);
    expect(arabicToRoman('4000').ok).toBe(false);
    expect(arabicToRoman('1.5').ok).toBe(false);
    expect(arabicToRoman('abc').ok).toBe(false);
  });
});

describe('romanToArabic', () => {
  it('알려진 변환', () => {
    expect(romanToArabic('MMXXIV').value).toBe('2024');
    expect(romanToArabic('IV').value).toBe('4');
    expect(romanToArabic('MMMCMXCIX').value).toBe('3999');
  });
  it('소문자 허용', () => {
    expect(romanToArabic('mmxxiv').value).toBe('2024');
  });
  it('비표준 형식 거부', () => {
    expect(romanToArabic('IIII').ok).toBe(false); // 4는 IV
    expect(romanToArabic('IC').ok).toBe(false);
    expect(romanToArabic('ABC').ok).toBe(false);
    expect(romanToArabic('').ok).toBe(false);
  });
});

describe('왕복 (1~3999 전수)', () => {
  it('모든 값이 왕복 보존된다', () => {
    for (let n = 1; n <= 3999; n += 1) {
      const roman = arabicToRoman(String(n));
      expect(roman.ok).toBe(true);
      expect(romanToArabic(roman.value).value).toBe(String(n));
    }
  });
});

describe('detectDirection', () => {
  it('숫자 입력은 toRoman', () => {
    expect(detectDirection('2024')).toBe('toRoman');
    expect(detectDirection(' 1,234 ')).toBe('toRoman');
  });
  it('로마자 입력은 toArabic', () => {
    expect(detectDirection('MMXXIV')).toBe('toArabic');
  });
});
