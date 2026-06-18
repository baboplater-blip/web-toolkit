import { describe, it, expect } from 'vitest';
import { slugify, romanizeHangul } from './slugify';

describe('romanizeHangul', () => {
  it('한글 음절을 로마자로 음역', () => {
    expect(romanizeHangul('안녕')).toBe('annyeong');
    expect(romanizeHangul('한국')).toBe('hanguk');
  });
  it('비한글 문자는 보존', () => {
    expect(romanizeHangul('Hello')).toBe('Hello');
    expect(romanizeHangul('가A1')).toBe('gaA1');
  });
});

describe('slugify', () => {
  it('한글+영문 혼합 슬러그(하이픈·소문자)', () => {
    expect(slugify('안녕하세요 Hello World', '-', true)).toBe('annyeonghaseyo-hello-world');
  });
  it('라틴 발음기호 제거', () => {
    expect(slugify('Café del Mar', '-', true)).toBe('cafe-del-mar');
  });
  it('밑줄 구분자', () => {
    expect(slugify('Hello World', '_', true)).toBe('hello_world');
  });
  it('대문자 보존 옵션', () => {
    expect(slugify('Hello World', '-', false)).toBe('Hello-World');
  });
  it('연속 특수문자 축약 + 양끝 구분자 제거', () => {
    expect(slugify('  -- Hello!!! World -- ', '-', true)).toBe('hello-world');
  });
  it('빈/특수문자만 입력은 빈 문자열', () => {
    expect(slugify('!!!', '-', true)).toBe('');
    expect(slugify('', '-', true)).toBe('');
  });
});
