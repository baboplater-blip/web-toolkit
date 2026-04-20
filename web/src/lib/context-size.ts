/**
 * 대화 컨텍스트 크기 대략 추정 — Claude 토큰 수 근사.
 *
 * 정확한 토크나이저 없이도 운영 판단에 쓸만한 수준:
 *   - 영문: chars / 4
 *   - 한글: chars / 2
 *   - 혼합: 한글 비율에 따라 가중.
 *
 * Claude Sonnet 4.5 컨텍스트 200k 기준, 70% 이상이면 경고.
 */

const CLAUDE_CONTEXT_LIMIT = 200_000;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  let korean = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) korean += 1;
  }
  const other = text.length - korean;
  return Math.ceil(korean / 2 + other / 4);
}

export function estimateConversationTokens(
  messages: Array<{ content: string }>,
): number {
  let total = 0;
  for (const m of messages) total += estimateTokens(m.content);
  return total;
}

export function contextUsageLevel(tokens: number): 'ok' | 'warn' | 'danger' {
  const ratio = tokens / CLAUDE_CONTEXT_LIMIT;
  if (ratio >= 0.9) return 'danger';
  if (ratio >= 0.7) return 'warn';
  return 'ok';
}

export { CLAUDE_CONTEXT_LIMIT };
