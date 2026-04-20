/**
 * 첫 교환 이후 대화 제목을 더 읽기 좋게 정제한다.
 *
 * 규칙:
 *   - 코드 펜스(```)·인라인 코드·Markdown 링크·이미지·HTML 태그 제거.
 *   - 연속 공백·줄바꿈 압축.
 *   - 명령형 서두("해줘", "알려줘") 가 끝에 오면 잘라내 명사구로.
 *   - 최대 40자, 단어 경계 존중.
 */

const STRIP_PATTERNS: RegExp[] = [
  /```[\s\S]*?```/g,
  /`[^`\n]*`/g,
  /!?\[[^\]]*\]\([^)]*\)/g,
  /<[^>]+>/g,
];

const TRAILING_PHRASES = [
  '해줘',
  '해주세요',
  '해 줘',
  '해 주세요',
  '알려줘',
  '알려주세요',
  '설명해줘',
  '설명해주세요',
  '부탁해',
  '부탁해요',
];

const MAX_LEN = 40;

export function refineTitle(raw: string): string {
  if (!raw) return '';
  let text = raw;
  if (text.startsWith('[CTX]')) text = text.slice(5);

  for (const re of STRIP_PATTERNS) {
    text = text.replace(re, ' ');
  }
  // 첫 문장·첫 줄만 사용
  const firstLine = text.split(/[\n\r]+/).map((s) => s.trim()).find(Boolean) ?? '';
  let candidate = firstLine.split(/(?<=[.!?。！？])\s/)[0] ?? firstLine;
  candidate = candidate.replace(/\s+/g, ' ').trim();

  // 명령형 꼬리 제거
  for (const tail of TRAILING_PHRASES) {
    if (candidate.endsWith(tail)) {
      candidate = candidate.slice(0, -tail.length).replace(/[\s,·]+$/, '').trim();
      break;
    }
  }

  if (candidate.length <= MAX_LEN) return candidate;
  // 단어 경계에서 자르기 (한글은 공백 기준이 약하므로 정확히 MAX_LEN 절단 후 ellipsis)
  const sliced = candidate.slice(0, MAX_LEN);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > MAX_LEN * 0.6) {
    return sliced.slice(0, lastSpace) + '…';
  }
  return sliced + '…';
}
