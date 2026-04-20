/**
 * 웹이 "지금 배포된" 에이전트 패키지의 권장 버전. 이 값보다 낮은 버전을 쓰는
 * 에이전트가 있으면 UI 에서 재설치 안내를 표시한다.
 *
 * 업데이트 규칙: agent-package/package.json 과 함께 올린다.
 */
export const RECOMMENDED_AGENT_VERSION = '1.2.5';

function toNums(v: string | null | undefined): number[] {
  if (!v) return [];
  return v
    .split('.')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
}

/** a < b 이면 true. 둘 중 하나라도 파싱 실패면 false (경고 안 냄). */
export function isVersionOutdated(
  agentVersion: string | null | undefined,
  recommended: string = RECOMMENDED_AGENT_VERSION,
): boolean {
  const a = toNums(agentVersion);
  const b = toNums(recommended);
  if (a.length === 0 || b.length === 0) return false;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}
