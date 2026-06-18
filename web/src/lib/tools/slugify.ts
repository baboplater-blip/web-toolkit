/**
 * URL 슬러그 변환 — 한글 로마자 음역 + 발음기호 제거.
 * (slugify 도구 page.tsx 에서 추출 — 동작 동일)
 */

// 국어의 로마자 표기법(개정안) 기반 자모 매핑.
// 한글 음절(가~힣)을 초성/중성/종성으로 분해해 로마자로 음역한다.
const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

const CHOSEONG: readonly string[] = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const JUNGSEONG: readonly string[] = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];

// 종성은 받침의 대표음(끝소리 규칙)을 따른 로마자 표기.
const JONGSEONG: readonly string[] = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k',
  'm', 'p', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't',
  't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

export function romanizeHangul(input: string): string {
  let result = '';
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (code < HANGUL_BASE || code > HANGUL_END) {
      result += char;
      continue;
    }
    const offset = code - HANGUL_BASE;
    const cho = Math.floor(offset / (JUNG_COUNT * JONG_COUNT));
    const jung = Math.floor((offset % (JUNG_COUNT * JONG_COUNT)) / JONG_COUNT);
    const jong = offset % JONG_COUNT;
    result += CHOSEONG[cho] + JUNGSEONG[jung] + JONGSEONG[jong];
  }
  return result;
}

export function slugify(input: string, separator: string, lowercase: boolean): string {
  // 1. 한글 음절을 로마자로 음역
  let text = romanizeHangul(input);
  // 2. 라틴 발음기호 제거(é → e 등)
  text = text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  // 3. 대소문자 처리
  if (lowercase) text = text.toLowerCase();
  // 4. 영숫자 외 문자를 구분자로
  text = text.replace(/[^a-zA-Z0-9]+/g, separator);
  // 5. 연속 구분자 축약 + 양끝 구분자 제거
  if (separator) {
    const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sepRe = new RegExp(`${escaped}{2,}`, 'g');
    text = text.replace(sepRe, separator);
    const edgeRe = new RegExp(`^${escaped}+|${escaped}+$`, 'g');
    text = text.replace(edgeRe, '');
  }
  return text;
}
