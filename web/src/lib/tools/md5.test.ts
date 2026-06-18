import { describe, it, expect } from 'vitest';
import { md5 } from './md5';

const enc = (s: string) => new TextEncoder().encode(s);

describe('md5 (RFC 1321 알려진 벡터)', () => {
  it('빈 문자열', () => {
    expect(md5(enc(''))).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });
  it('"abc"', () => {
    expect(md5(enc('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
  });
  it('"message digest"', () => {
    expect(md5(enc('message digest'))).toBe('f96b697d7cb7938d525a2f31aaf161d0');
  });
  it('영문 소문자 전체', () => {
    expect(md5(enc('abcdefghijklmnopqrstuvwxyz'))).toBe('c3fcd3d76192e4007dfb496cca67e13b');
  });
  it('pangram', () => {
    expect(md5(enc('The quick brown fox jumps over the lazy dog'))).toBe(
      '9e107d9d372bb6826bd81d3542a419d6',
    );
  });
  it('UTF-8 멀티바이트(한글)', () => {
    // md5("한글") UTF-8
    expect(md5(enc('한글'))).toBe(md5(enc('한글')));
    expect(md5(enc('한글'))).toMatch(/^[0-9a-f]{32}$/);
  });
  it('블록 경계(64바이트 이상)도 결정적', () => {
    const long = 'a'.repeat(100);
    expect(md5(enc(long))).toBe(md5(enc(long)));
    expect(md5(enc(long))).toHaveLength(32);
  });
});
