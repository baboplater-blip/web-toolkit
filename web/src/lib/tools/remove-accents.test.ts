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
  it('한글은 글자가 삭제되지 않는다(NFD 분해되지만 동등)', () => {
    // removeAccents 는 NFD 정규화를 거치므로 한글은 분해형으로 나오지만
    // 결합 분음 기호가 아니므로 글자 자체는 보존된다(NFC 비교 시 동일).
    expect(removeAccents('한글').normalize('NFC')).toBe('한글');
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
