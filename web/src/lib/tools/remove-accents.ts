/**
 * 발음 기호(분음 기호) 제거 — café → cafe.
 * (remove-accents 도구 page.tsx 에서 추출 — 동작 동일)
 */

// 결합 분음 기호 범위 U+0300–U+036F.
const COMBINING_MARKS = /[̀-ͯ]/g;

/** 분해 정규화(NFD) 후 결합 분음 기호를 제거한다. café → cafe */
export function removeAccents(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '');
}
