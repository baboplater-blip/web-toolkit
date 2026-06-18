import { describe, it, expect } from 'vitest';
import { isLuhnValid, extractDigits, detectIssuer, analyze } from './cc-validate';

describe('extractDigits', () => {
  it('공백·하이픈 제거', () => {
    expect(extractDigits('4111 1111 1111 1111')).toBe('4111111111111111');
    expect(extractDigits('4111-1111-1111-1111')).toBe('4111111111111111');
  });
  it('숫자 없으면 빈 문자열', () => {
    expect(extractDigits('abc')).toBe('');
  });
});

describe('isLuhnValid', () => {
  it('유효한 테스트 카드번호', () => {
    expect(isLuhnValid('4111111111111111')).toBe(true); // Visa 테스트
    expect(isLuhnValid('5500005555555559')).toBe(true);
    expect(isLuhnValid('79927398713')).toBe(true); // 위키 Luhn 예제
  });
  it('체크섬 실패', () => {
    expect(isLuhnValid('4111111111111112')).toBe(false);
    expect(isLuhnValid('79927398710')).toBe(false);
  });
  it('단일 자리', () => {
    expect(isLuhnValid('0')).toBe(true);
  });
});

describe('detectIssuer', () => {
  it('Visa (4로 시작)', () => {
    expect(detectIssuer('4111111111111111')?.name).toBe('Visa');
  });
  it('American Express (34/37)', () => {
    expect(detectIssuer('378282246310005')?.name).toBe('American Express');
  });
  it('Mastercard (51-55)', () => {
    expect(detectIssuer('5500005555555559')?.name).toBe('Mastercard');
  });
  it('알 수 없는 prefix → null', () => {
    expect(detectIssuer('9999999999999999')).toBeNull();
  });
});

describe('analyze', () => {
  it('유효한 Visa: luhn + 길이 통과', () => {
    const a = analyze('4111 1111 1111 1111')!;
    expect(a.issuer?.name).toBe('Visa');
    expect(a.luhnValid).toBe(true);
    expect(a.lengthValid).toBe(true);
  });
  it('유효한 Amex(15자리)', () => {
    const a = analyze('3782 822463 10005')!;
    expect(a.issuer?.name).toBe('American Express');
    expect(a.luhnValid).toBe(true);
    expect(a.lengthValid).toBe(true);
  });
  it('빈 입력 → null', () => {
    expect(analyze('')).toBeNull();
    expect(analyze('   ')).toBeNull();
  });
  it('발급사 없는 13~19자리는 일반 범위로 길이 판정', () => {
    const a = analyze('9999999999999')!; // 13자리
    expect(a.issuer).toBeNull();
    expect(a.lengthValid).toBe(true);
  });
});
