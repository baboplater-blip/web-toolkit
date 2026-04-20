/**
 * 가벼운 런타임 검증 유틸. 모든 validator 는 throw 대신 null / false 를 반환해
 * 호출부가 사용자 친화적으로 폴백할 수 있게 한다.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

/** URL 파라미터가 UUID 형식이면 그대로, 아니면 null. */
export function safeUuidParam(v: string | null | undefined): string | null {
  return v && isUuid(v) ? v : null;
}
