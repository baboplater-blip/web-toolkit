import { describe, it, expect } from 'vitest';
import { removeAccents } from './remove-accents';

describe('removeAccents', () => {
  it('café → cafe', () => {
    expect(removeAccents('café')).toBe('cafe');
  });
  it('다양한 분음 기호', () => {
    expect(removeAccents('naïve')).toBe('naive');
    expect(removeAccents('Crème Brûlée')).toBe('Creme Brulee');
    expect(removeAccents('àéîõü')).toBe('aeiou');
  });
  it('분음 기호 없는 라틴 문자는 그대로', () => {
    expect(removeAccents('hello')).toBe('hello');
    expect(removeAccents('ABC 123')).toBe('ABC 123');
  });
  it('한글은 NFC 재결합되어 그대로 보존된다', () => {
    // NFD 분해 후 NFC 로 재결합하므로 한글은 완성형 그대로 나온다.
    const result = removeAccents('한국 café');
    expect(result).toBe('한국 cafe');
    expect(result.includes('한')).toBe(true);
    expect(result).toBe(result.normalize('NFC'));
    expect(removeAccents('한글')).toBe('한글');
  });
  it('빈 문자열', () => {
    expect(removeAccents('')).toBe('');
  });
  it('이미 결합된 코드포인트와 분해형이 같은 결과', () => {
    // U+00E9 (é) 와 e + U+0301 (조합 악센트) 둘 다 cafe 로
    expect(removeAccents('café')).toBe('cafe');
    expect(removeAccents('café')).toBe('cafe');
  });
});
