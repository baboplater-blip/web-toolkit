import { describe, it, expect } from 'vitest';
import { isVersionOutdated, RECOMMENDED_AGENT_VERSION } from './agent-version';

describe('isVersionOutdated', () => {
  it('같은 버전은 outdated 아님', () => {
    expect(isVersionOutdated('1.2.5', '1.2.5')).toBe(false);
  });

  it('낮은 버전은 outdated', () => {
    expect(isVersionOutdated('1.2.1', '1.2.5')).toBe(true);
    expect(isVersionOutdated('1.1.9', '1.2.0')).toBe(true);
    expect(isVersionOutdated('0.9.0', '1.0.0')).toBe(true);
  });

  it('높은 버전은 outdated 아님', () => {
    expect(isVersionOutdated('1.3.0', '1.2.5')).toBe(false);
    expect(isVersionOutdated('2.0.0', '1.9.9')).toBe(false);
  });

  it('null/undefined 은 파싱 실패 시 false', () => {
    expect(isVersionOutdated(null)).toBe(false);
    expect(isVersionOutdated(undefined)).toBe(false);
    expect(isVersionOutdated('')).toBe(false);
  });

  it('서로 다른 길이 (1.2 vs 1.2.1) 는 0 보충', () => {
    expect(isVersionOutdated('1.2', '1.2.1')).toBe(true); // 1.2.0 < 1.2.1
    expect(isVersionOutdated('1.2.0', '1.2')).toBe(false); // 1.2.0 == 1.2.0
  });

  it('RECOMMENDED_AGENT_VERSION 상수가 있음', () => {
    expect(typeof RECOMMENDED_AGENT_VERSION).toBe('string');
    expect(RECOMMENDED_AGENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
