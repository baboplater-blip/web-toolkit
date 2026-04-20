/**
 * 인-메모리 토큰 버킷 레이트 리미터.
 *
 * Vercel 서버리스 함수는 인스턴스가 여러 개라 100% 정확하지 않지만,
 * 실수/스크립트 연타 같은 "가벼운 남용" 을 막는 데 충분하다.
 *
 * 정밀한 제어가 필요하면 Upstash Redis 등 외부 스토어로 교체.
 *
 * 사용 예:
 *   const rl = rateLimit({ key: req.headers.get('x-forwarded-for') ?? 'anon', limit: 60, windowMs: 60_000 });
 *   if (!rl.ok) return NextResponse.json({ error: 'rate_limited', retry_after: rl.retryAfter }, { status: 429 });
 */

interface Bucket {
  count: number;
  resetAt: number;
}

// 모듈 수준 맵 — 서버리스 인스턴스 생존 동안만 유지.
// 주기적 cleanup 으로 메모리 누수 방지.
const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
  // 맵이 너무 커지면 전체 초기화 (공격성 호출 방어)
  if (buckets.size > 10_000) buckets.clear();
}

export interface RateLimitOptions {
  /** 리미터 구분 키 — 일반적으로 IP 또는 user_id 기반. */
  key: string;
  /** 윈도우 내 허용 요청 수. */
  limit: number;
  /** 윈도우 밀리초. */
  windowMs: number;
  /** 리미터를 구분하는 namespace (엔드포인트별로 분리하고 싶을 때). */
  namespace?: string;
}

export interface RateLimitResult {
  ok: boolean;
  /** 이번 윈도우 내 이미 소비한 요청 수 (ok=false 면 limit 이상). */
  count: number;
  /** 윈도우가 리셋되기까지 남은 초 (ok=false 때만 의미). */
  retryAfter: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  cleanup();
  const fullKey = `${opts.namespace ?? 'default'}:${opts.key}`;
  const now = Date.now();
  const existing = buckets.get(fullKey);
  if (!existing || existing.resetAt < now) {
    buckets.set(fullKey, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, count: 1, retryAfter: 0 };
  }
  existing.count += 1;
  if (existing.count > opts.limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, count: existing.count, retryAfter };
  }
  return { ok: true, count: existing.count, retryAfter: 0 };
}

/**
 * Request 에서 클라이언트 IP 추출. Vercel Edge/Node 둘 다 지원.
 * 없으면 'anon' 반환.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // 첫 번째만 사용 (이후는 프록시 체인)
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri;
  return 'anon';
}

/**
 * 표준 429 응답 생성. Retry-After 헤더 포함.
 */
export function rateLimitedResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: 'rate_limited', retry_after: retryAfterSec }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}
