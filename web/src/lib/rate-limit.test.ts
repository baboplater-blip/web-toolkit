import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, clientIp } from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    // 모듈 내부 맵은 직접 리셋 불가 — 테스트마다 unique key 사용으로 격리.
  });

  it('허용 범위 내 요청은 ok=true 반환', () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit({ key, limit: 10, windowMs: 60_000, namespace: 'rl-ok' });
      expect(r.ok).toBe(true);
      expect(r.count).toBe(i + 1);
    }
  });

  it('한도 초과 시 ok=false + retryAfter > 0', () => {
    const key = `test-over-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit({ key, limit: 3, windowMs: 60_000, namespace: 'rl-over' }).ok).toBe(true);
    }
    const blocked = rateLimit({ key, limit: 3, windowMs: 60_000, namespace: 'rl-over' });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.count).toBe(4);
  });

  it('namespace 가 다르면 독립 카운트', () => {
    const key = `shared-${Math.random()}`;
    const a = rateLimit({ key, limit: 5, windowMs: 60_000, namespace: 'ns-A' });
    const b = rateLimit({ key, limit: 5, windowMs: 60_000, namespace: 'ns-B' });
    expect(a.count).toBe(1);
    expect(b.count).toBe(1);
  });

  it('윈도우 만료 시 카운트 리셋', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const key = `expire-${Math.random()}`;
      rateLimit({ key, limit: 2, windowMs: 1000, namespace: 'rl-exp' });
      rateLimit({ key, limit: 2, windowMs: 1000, namespace: 'rl-exp' });
      expect(rateLimit({ key, limit: 2, windowMs: 1000, namespace: 'rl-exp' }).ok).toBe(false);
      // 2초 진행 — 윈도우 지남
      vi.setSystemTime(new Date('2026-01-01T00:00:02Z'));
      expect(rateLimit({ key, limit: 2, windowMs: 1000, namespace: 'rl-exp' }).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('clientIp', () => {
  it('x-forwarded-for 첫 번째 IP 추출', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(clientIp(req)).toBe('1.2.3.4');
  });

  it('x-forwarded-for 없으면 x-real-ip 사용', () => {
    const req = new Request('http://x', { headers: { 'x-real-ip': '9.9.9.9' } });
    expect(clientIp(req)).toBe('9.9.9.9');
  });

  it('헤더 둘 다 없으면 anon 반환', () => {
    const req = new Request('http://x');
    expect(clientIp(req)).toBe('anon');
  });
});
