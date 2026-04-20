import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  estimateConversationTokens,
  contextUsageLevel,
  CLAUDE_CONTEXT_LIMIT,
} from './context-size';

describe('estimateTokens', () => {
  it('빈 문자열은 0', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('영문은 chars/4', () => {
    expect(estimateTokens('hello')).toBe(Math.ceil(5 / 4));
    expect(estimateTokens('abcdefgh')).toBe(Math.ceil(8 / 4));
  });

  it('한글은 chars/2', () => {
    expect(estimateTokens('안녕')).toBe(Math.ceil(2 / 2));
    expect(estimateTokens('안녕하세요')).toBe(Math.ceil(5 / 2));
  });

  it('혼합은 가중 합산', () => {
    // 한글 2자 + 영문 4자 = 1 + 1 = 2
    expect(estimateTokens('안녕abcd')).toBe(2);
  });
});

describe('estimateConversationTokens', () => {
  it('메시지별 토큰 합산', () => {
    const msgs = [{ content: '안녕' }, { content: 'hello' }];
    expect(estimateConversationTokens(msgs)).toBe(1 + 2);
  });

  it('빈 배열은 0', () => {
    expect(estimateConversationTokens([])).toBe(0);
  });
});

describe('contextUsageLevel', () => {
  it('70% 미만 ok', () => {
    expect(contextUsageLevel(0)).toBe('ok');
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT * 0.5)).toBe('ok');
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT * 0.69)).toBe('ok');
  });

  it('70~90% warn', () => {
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT * 0.7)).toBe('warn');
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT * 0.85)).toBe('warn');
  });

  it('90% 이상 danger', () => {
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT * 0.9)).toBe('danger');
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT)).toBe('danger');
    expect(contextUsageLevel(CLAUDE_CONTEXT_LIMIT * 2)).toBe('danger');
  });
});
