import { describe, it, expect } from 'vitest';
import {
  computeTaskTimeoutMs,
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
} from './timeout';

describe('computeTaskTimeoutMs — 우선순위 (대화 > PC > env > 기본)', () => {
  it('모두 비어있으면 30분 기본값', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: false,
      conversationOverrideMin: null,
      agentDefaultMin: null,
    });
    expect(r.timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
    expect(r.source).toBe('기본값');
  });

  it('env 있으면 env 사용', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: false,
      conversationOverrideMin: null,
      agentDefaultMin: null,
      envDefaultMs: 10 * 60_000,
    });
    expect(r.timeoutMs).toBe(10 * 60_000);
    expect(r.source).toBe('기본값');
  });

  it('PC 설정 (agentDefaultMin) 이 env 보다 우선', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: false,
      conversationOverrideMin: null,
      agentDefaultMin: 60,
      envDefaultMs: 10 * 60_000,
    });
    expect(r.timeoutMs).toBe(60 * 60_000);
    expect(r.source).toBe('PC 설정');
  });

  it('대화 설정이 PC 보다 우선', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: false,
      conversationOverrideMin: 120,
      agentDefaultMin: 60,
    });
    expect(r.timeoutMs).toBe(120 * 60_000);
    expect(r.source).toBe('대화 설정');
  });

  it('timeout_extended 면 ×2', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: true,
      conversationOverrideMin: 60,
      agentDefaultMin: null,
    });
    expect(r.timeoutMs).toBe(120 * 60_000);
    expect(r.source).toContain('×2');
  });

  it('상한은 12시간', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: true,
      conversationOverrideMin: 600, // 10시간
      agentDefaultMin: null,
    });
    // 600분 × 2 = 1200분 > MAX(12h=720분) → clamp
    expect(r.timeoutMs).toBe(MAX_TIMEOUT_MS);
  });

  it('0·음수·NaN 은 무시하고 하위 우선순위 사용', () => {
    expect(
      computeTaskTimeoutMs({
        messageExtended: false,
        conversationOverrideMin: 0,
        agentDefaultMin: 60,
      }).source,
    ).toBe('PC 설정');

    expect(
      computeTaskTimeoutMs({
        messageExtended: false,
        conversationOverrideMin: -5,
        agentDefaultMin: null,
      }).source,
    ).toBe('기본값');

    expect(
      computeTaskTimeoutMs({
        messageExtended: false,
        conversationOverrideMin: NaN,
        agentDefaultMin: 30,
      }).source,
    ).toBe('PC 설정');
  });

  it('연장 소스 문자열에 × 2 힌트 포함', () => {
    const r = computeTaskTimeoutMs({
      messageExtended: true,
      conversationOverrideMin: null,
      agentDefaultMin: null,
    });
    expect(r.source).toBe('기본값 ×2 (연장)');
  });
});
