/**
 * 긴 응답을 접었을 때 한 줄 미리보기를 생성한다.
 * 우선순위: 첫 heading → 첫 bullet → 첫 문장 → 앞 60자.
 */
const HEADING = /^#{1,6}\s+(.+)$/m;
const BULLET = /^[\s>]*[-*+]\s+(.+)$/m;

export function summarizePreview(content: string, maxLen = 80): string {
  if (!content) return '';
  const head = HEADING.exec(content)?.[1];
  if (head) return truncate(head.trim(), maxLen);

  const bullet = BULLET.exec(content)?.[1];
  if (bullet) return truncate(bullet.trim(), maxLen);

  // 첫 문장 — Markdown 제거 후 첫 `.`/`!`/`?`/`。`/`！`/`？` 까지.
  const stripped = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const firstSentence = stripped.split(/(?<=[.!?。！？])\s/)[0] ?? stripped;
  return truncate(firstSentence, maxLen);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + '…';
}
