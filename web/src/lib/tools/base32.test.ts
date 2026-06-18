import { describe, it, expect } from 'vitest';
import { encodeBase32, decodeBase32 } from './base32';

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);

describe('encodeBase32 (RFC 4648 테스트 벡터)', () => {
  it('빈 입력', () => {
    expect(encodeBase32(enc(''))).toBe('');
  });
  it('"f" → MY======', () => {
    expect(encodeBase32(enc('f'))).toBe('MY======');
  });
  it('"fo" → MZXQ====', () => {
    expect(encodeBase32(enc('fo'))).toBe('MZXQ====');
  });
  it('"foo" → MZXW6===', () => {
    expect(encodeBase32(enc('foo'))).toBe('MZXW6===');
  });
  it('"foobar" → MZXW6YTBOI======', () => {
    expect(encodeBase32(enc('foobar'))).toBe('MZXW6YTBOI======');
  });
  it('"hello" → NBSWY3DP', () => {
    expect(encodeBase32(enc('hello'))).toBe('NBSWY3DP');
  });
  it('결과는 항상 8자 블록(패딩 포함)', () => {
    expect(encodeBase32(enc('foobar')).length % 8).toBe(0);
  });
});

describe('decodeBase32', () => {
  it('빈 문자열 → 빈 배열', () => {
    expect(decodeBase32('')).toEqual(new Uint8Array(0));
  });
  it('"NBSWY3DP" → "hello"', () => {
    expect(dec(decodeBase32('NBSWY3DP'))).toBe('hello');
  });
  it('패딩·공백·소문자 허용', () => {
    expect(dec(decodeBase32('mzxw6ytboi======'))).toBe('foobar');
    expect(dec(decodeBase32('NBSW Y3DP'))).toBe('hello');
  });
  it('알파벳 외 문자는 throw', () => {
    expect(() => decodeBase32('NBSWY3D!')).toThrow();
    expect(() => decodeBase32('0189')).toThrow(); // 0,1,8,9 는 base32 알파벳에 없음
  });
});

describe('encode/decode 왕복', () => {
  for (const s of ['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'The quick brown fox']) {
    it(`"${s}" 왕복 보존`, () => {
      expect(dec(decodeBase32(encodeBase32(enc(s))))).toBe(s);
    });
  }
});
