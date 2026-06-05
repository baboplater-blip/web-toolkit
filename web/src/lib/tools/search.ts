/**
 * 도구 퍼지 검색 엔진 — 의존성 없는 경량 랭커.
 *
 * registry 의 단순 부분일치(`includes`) 를 대체한다. 다음을 지원:
 *   1. 다중 토큰 AND  — "pdf 압축" → 두 토큰이 모두 매칭돼야 결과 포함
 *   2. 필드 가중치     — 제목 > 키워드 > 설명 순으로 점수 가중
 *   3. 매칭 등급       — 완전일치 > 접두 > 단어경계 > 부분 > 서브시퀀스(오타)
 *   4. 한글 초성 검색  — "ㅇㄱㅁㅈㅇㅋ" → "얼굴 모자이크" 매칭
 *
 * 순환 의존을 피하려고 ToolMeta 는 type-only import (런타임 미참조).
 * 검색 대상 풀은 호출자가 넘긴다(registry.filterTools 가 TOOLS 를 전달).
 */

import type { ToolMeta } from './registry';

/* ────────────────────────── 한글 초성 ────────────────────────── */

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

/** 문자열을 초성 시퀀스로 변환. 음절이 아닌 문자는 그대로 둔다. */
export function toChoseong(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
      out += CHOSEONG[Math.floor((code - HANGUL_BASE) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

/** 호환 자모 초성(ㄱ~ㅎ)으로만 이뤄진 토큰인지 — 초성 검색 트리거. */
export function isChoseongQuery(token: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(token);
}

/* ────────────────────────── 매칭 점수 ────────────────────────── */

/** 토큰이 필드 문자열 어디서 어떻게 매칭되는지 0~100 점수. 미매칭 0. */
function matchScore(field: string, token: string): number {
  if (!field || !token) return 0;
  if (field === token) return 100; // 완전 일치
  if (field.startsWith(token)) return 90; // 접두 일치
  // 단어 경계 접두 (공백/구분자 뒤에서 시작)
  for (const word of field.split(/[\s/\-_.,]+/)) {
    if (word && word.startsWith(token)) return 80;
  }
  if (field.includes(token)) return 62; // 부분 일치
  return subsequenceScore(field, token); // 서브시퀀스(오타 허용)
}

/**
 * 토큰 글자가 순서대로 field 에 등장하면 점수(최대 ~46).
 * 인접도가 높을수록(연속 매칭) 가산 → 오타·축약 입력 흡수.
 */
function subsequenceScore(field: string, token: string): number {
  if (token.length < 2) return 0; // 1글자 서브시퀀스는 노이즈
  let fi = 0;
  let matched = 0;
  let run = 0;
  let bonus = 0;
  for (let ti = 0; ti < token.length; ti++) {
    const c = token[ti];
    let found = false;
    while (fi < field.length) {
      if (field[fi] === c) {
        found = true;
        fi++;
        run++;
        bonus += run; // 연속 매칭 가중
        break;
      }
      fi++;
      run = 0;
    }
    if (!found) return 0; // 순서대로 다 못 찾으면 미매칭
    matched++;
  }
  const coverage = matched / token.length; // 항상 1 (위에서 전부 매칭)
  const density = bonus / token.length;
  return Math.min(46, Math.round(20 * coverage + 6 * density));
}

const FIELD_WEIGHT = { title: 1, keywords: 0.85, description: 0.5 } as const;

/** 단일 토큰의 도구 전체 점수 (필드별 최대값에 가중치). */
function tokenScore(tool: ToolMeta, token: string, choseong: boolean): number {
  const title = tool.title.toLowerCase();
  const desc = tool.description.toLowerCase();
  const keys = (tool.keywords ?? []).map((k) => k.toLowerCase());

  let best =
    matchScore(title, token) * FIELD_WEIGHT.title;
  for (const k of keys) {
    best = Math.max(best, matchScore(k, token) * FIELD_WEIGHT.keywords);
  }
  best = Math.max(best, matchScore(desc, token) * FIELD_WEIGHT.description);

  // 초성 검색: 토큰이 초성으로만 이뤄졌을 때 제목/키워드 초성과 비교
  if (choseong) {
    const titleCho = toChoseong(tool.title);
    let choBest = matchScore(titleCho, token) * FIELD_WEIGHT.title;
    for (const k of tool.keywords ?? []) {
      choBest = Math.max(choBest, matchScore(toChoseong(k), token) * FIELD_WEIGHT.keywords);
    }
    best = Math.max(best, choBest);
  }
  return best;
}

/**
 * 도구 한 개의 쿼리 적합도. 0 이면 결과에서 제외.
 * 모든 토큰이 매칭돼야(AND) 하며, 토큰 점수의 합이 총점.
 */
export function scoreTool(tool: ToolMeta, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  let total = 0;
  for (const token of tokens) {
    const s = tokenScore(tool, token, isChoseongQuery(token));
    if (s <= 0) return 0; // 한 토큰이라도 미매칭 → 탈락
    total += s;
  }
  return total;
}

/* ────────────────────────── 공개 API ────────────────────────── */

/**
 * 풀에서 쿼리에 맞는 도구를 관련도 내림차순으로 반환.
 * 동점이면 ready 우선 → phase 오름차순 → 제목 길이 오름차순.
 * (빈 쿼리 처리는 호출자 책임 — 여기선 토큰이 비면 전부 통과)
 */
export function searchTools(query: string, pool: ToolMeta[]): ToolMeta[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [...pool];

  const scored: Array<{ tool: ToolMeta; score: number }> = [];
  for (const tool of pool) {
    const score = scoreTool(tool, tokens);
    if (score > 0) scored.push({ tool, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.tool.status !== b.tool.status) return a.tool.status === 'ready' ? -1 : 1;
    if (a.tool.phase !== b.tool.phase) return a.tool.phase - b.tool.phase;
    return a.tool.title.length - b.tool.title.length;
  });

  return scored.map((s) => s.tool);
}
