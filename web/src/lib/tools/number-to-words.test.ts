import { describe, it, expect } from 'vitest';
import { digitsToEnglish, digitsToKorean, parseNumberInput } from './number-to-words';

describe('digitsToEnglish', () => {
  it('기본 값', () => {
    expect(digitsToEnglish('0')).toBe('zero');
    expect(digitsToEnglish('7')).toBe('seven');
    expect(digitsToEnglish('21')).toBe('twenty-one');
    expect(digitsToEnglish('100')).toBe('one hundred');
    expect(digitsToEnglish('1000')).toBe('one thousand');
  });
  it('큰 수 3자리 그룹', () => {
    expect(digitsToEnglish('1234567')).toBe(
      'one million two hundred thirty-four thousand five hundred sixty-seven',
    );
  });
  it('표기 범위 초과 → null', () => {
    expect(digitsToEnglish('1'.repeat(40))).toBeNull();
  });
});

describe('digitsToKorean', () => {
  it('기본 값', () => {
    expect(digitsToKorean('0')).toBe('영');
    expect(digitsToKorean('10')).toBe('십'); // 일십 → 십
    expect(digitsToKorean('100')).toBe('백');
    expect(digitsToKorean('10000')).toBe('일만');
  });
  it('만/억 단위', () => {
    expect(digitsToKorean('1234567')).toBe('백이십삼만사천오백육십칠');
  });
  it('범위 초과 → null', () => {
    expect(digitsToKorean('1'.repeat(40))).toBeNull();
  });
});

describe('parseNumberInput', () => {
  it('정수', () => {
    expect(parseNumberInput('1234')).toEqual({ negative: false, intPart: '1234', fracPart: '' });
  });
  it('콤마·공백 제거', () => {
    expect(parseNumberInput('1,234,567')).toEqual({
      negative: false,
      intPart: '1234567',
      fracPart: '',
    });
  });
  it('음수·소수부', () => {
    expect(parseNumberInput('-89.5')).toEqual({
      negative: true,
      intPart: '89',
      fracPart: '5',
    });
  });
  it('선행 0 제거(단 0 자체는 보존)', () => {
    expect(parseNumberInput('007')?.intPart).toBe('7');
    expect(parseNumberInput('0')?.intPart).toBe('0');
  });
  it('무효 입력 → null', () => {
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
    expect(parseNumberInput('1.2.3')).toBeNull();
  });
});
