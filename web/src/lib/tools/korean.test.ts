import { describe, it, expect } from 'vitest';
import {
  isSyllable,
  decomposeSyllable,
  decomposeAll,
  composeSyllable,
  en2ko,
  ko2en,
  hanjaToHangul,
  autoSpacing,
} from './korean';

describe('isSyllable', () => {
  it('완성형 한글 음절을 판별', () => {
    expect(isSyllable('가')).toBe(true);
    expect(isSyllable('힣')).toBe(true);
    expect(isSyllable('한')).toBe(true);
  });
  it('자모 단독·영문·빈문자는 음절이 아님', () => {
    expect(isSyllable('ㄱ')).toBe(false);
    expect(isSyllable('a')).toBe(false);
    expect(isSyllable('')).toBe(false);
  });
});

describe('decomposeSyllable', () => {
  it('음절을 초/중/종성으로 분해', () => {
    expect(decomposeSyllable('각')).toEqual(['ㄱ', 'ㅏ', 'ㄱ']);
    expect(decomposeSyllable('가')).toEqual(['ㄱ', 'ㅏ', '']);
    expect(decomposeSyllable('한')).toEqual(['ㅎ', 'ㅏ', 'ㄴ']);
  });
  it('음절이 아니면 null', () => {
    expect(decomposeSyllable('a')).toBeNull();
  });
});

describe('composeSyllable / decompose 왕복', () => {
  it('초/중/종성으로 음절 조합', () => {
    expect(composeSyllable('ㄱ', 'ㅏ', 'ㄱ')).toBe('각');
    expect(composeSyllable('ㄱ', 'ㅏ')).toBe('가');
    expect(composeSyllable('ㅎ', 'ㅏ', 'ㄴ')).toBe('한');
  });
  it('잘못된 자모는 원문 반환', () => {
    expect(composeSyllable('x', 'y', '')).toBe('xy');
  });
  it('분해 → 조합 왕복이 보존된다', () => {
    for (const ch of ['값', '닭', '뷁', '안', '녕']) {
      const d = decomposeSyllable(ch)!;
      expect(composeSyllable(d[0], d[1], d[2])).toBe(ch);
    }
  });
});

describe('decomposeAll', () => {
  it('전체 문자열을 자모로 분해(비음절 보존)', () => {
    expect(decomposeAll('가')).toBe('ㄱㅏ');
    expect(decomposeAll('각A')).toBe('ㄱㅏㄱA');
  });
});

describe('en2ko / ko2en 자판 변환', () => {
  it('영문 자판 입력을 한글로', () => {
    // "gksrnf" → 한글
    expect(en2ko('gksrnf')).toBe('한굴');
    expect(en2ko('dkssud')).toBe('안녕');
  });
  it('한글을 영문 자판으로 되돌린다', () => {
    expect(ko2en('안녕')).toBe('dkssud');
  });
  it('en2ko → ko2en 왕복', () => {
    const ko = en2ko('dkssud');
    expect(ko2en(ko)).toBe('dkssud');
  });
});

describe('hanjaToHangul', () => {
  it('사전에 있는 한자를 한글로 치환하고 횟수를 센다', () => {
    const { result, replacements } = hanjaToHangul('學生');
    expect(result).toBe('학생');
    expect(replacements).toBe(2);
  });
  it('단일 한자도 치환', () => {
    expect(hanjaToHangul('國')).toEqual({ result: '국', replacements: 1 });
  });
  it('한자가 없으면 0회', () => {
    const { result, replacements } = hanjaToHangul('한글');
    expect(result).toBe('한글');
    expect(replacements).toBe(0);
  });
});

describe('autoSpacing', () => {
  it('결정적: 같은 입력은 같은 출력', () => {
    const input = '안녕하세요반갑습니다';
    expect(autoSpacing(input)).toBe(autoSpacing(input));
  });
  it('문자열을 반환한다', () => {
    expect(typeof autoSpacing('테스트입니다')).toBe('string');
  });
});
