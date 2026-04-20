/**
 * 작업 타임아웃 결정 로직 — 순수 함수로 분리해 단위 테스트 가능.
 *
 * 우선순위:
 *   1. messages.timeout_extended = true  → 아래 해상도의 2배
 *   2. conversations.timeout_override_minutes (양수)
 *   3. agents.task_timeout_minutes        (양수)
 *   4. 환경변수 기반 default
 *   5. 기본 30 분
 * 상한: 12 시간 (MAX_MS).
 */

export const MAX_TIMEOUT_MS = 12 * 60 * 60 * 1000;
export const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export interface TimeoutInputs {
  /** messages.timeout_extended (×2 연장) */
  messageExtended: boolean;
  /** conversations.timeout_override_minutes (양수 아니면 무시) */
  conversationOverrideMin: number | null | undefined;
  /** agents.task_timeout_minutes (양수 아니면 무시) */
  agentDefaultMin: number | null | undefined;
  /** 환경변수에서 파싱된 default (ms). 없으면 DEFAULT_TIMEOUT_MS. */
  envDefaultMs?: number;
}

export interface TimeoutResult {
  timeoutMs: number;
  source: string;
}

function isPositive(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

export function computeTaskTimeoutMs(inputs: TimeoutInputs): TimeoutResult {
  const envDefault =
    inputs.envDefaultMs && inputs.envDefaultMs > 0
      ? inputs.envDefaultMs
      : DEFAULT_TIMEOUT_MS;

  let base: number;
  let source: string;
  if (isPositive(inputs.conversationOverrideMin)) {
    base = inputs.conversationOverrideMin * 60_000;
    source = '대화 설정';
  } else if (isPositive(inputs.agentDefaultMin)) {
    base = inputs.agentDefaultMin * 60_000;
    source = 'PC 설정';
  } else {
    base = envDefault;
    source = '기본값';
  }

  if (inputs.messageExtended) {
    base = Math.min(MAX_TIMEOUT_MS, base * 2);
    source += ' ×2 (연장)';
  }

  return { timeoutMs: Math.min(MAX_TIMEOUT_MS, base), source };
}
