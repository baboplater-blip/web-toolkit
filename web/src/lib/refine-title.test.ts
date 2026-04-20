import { describe, it, expect } from 'vitest';
import { refineTitle } from './refine-title';

describe('refineTitle', () => {
  it('빈 입력은 빈 문자열', () => {
    expect(refineTitle('')).toBe('');
  });

  it('[CTX] 접두 제거', () => {
    expect(refineTitle('[CTX]안녕')).toBe('안녕');
  });

  it('코드 펜스 제거', () => {
    expect(refineTitle('파이썬\n```python\nprint(1)\n```\n설명')).toBe('파이썬');
  });

  it('마크다운 링크·이미지 제거', () => {
    expect(refineTitle('[설명](https://a.com) 페이지 확인')).toBe('페이지 확인');
    expect(refineTitle('![](img.png) 이미지 처리')).toBe('이미지 처리');
  });

  it('HTML 태그 제거', () => {
    expect(refineTitle('<b>중요</b> 업무')).toBe('중요  업무'.replace(/\s+/g, ' '));
  });

  it('첫 문장만 사용', () => {
    expect(refineTitle('첫 문장이다. 두 번째 문장.')).toBe('첫 문장이다.');
  });

  it('명령형 꼬리 제거', () => {
    expect(refineTitle('파일 정리해줘')).toBe('파일 정리');
    expect(refineTitle('버그 수정 부탁해요')).toBe('버그 수정');
  });

  it('40자 넘으면 단어 경계에서 자르고 … 붙임', () => {
    const long = '이것은 매우 매우 매우 매우 긴 타이틀 문자열입니다 그리고 계속 이어지고 또 이어지고 있습니다 정말로 길게 길게';
    const out = refineTitle(long);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(41);
  });

  it('여러 공백 압축', () => {
    expect(refineTitle('공백   압축   테스트')).toBe('공백 압축 테스트');
  });
});
