/**
 * 도구 퍼지 검색 엔진 — 의존성 없는 경량 랭커.
 *
 * registry 의 단순 부분일치(`includes`) 를 대체한다. 다음을 지원:
 *   1. 다중 토큰 AND  — "pdf 압축" → 두 토큰이 모두 매칭돼야 결과 포함
 *   2. 필드 가중치     — 제목 > 키워드 > 설명 순으로 점수 가중
 *   3. 매칭 등급       — 완전일치 > 접두 > 단어경계 > 부분 > 서브시퀀스(오타)
 *   4. 한글 초성 검색  — "ㅇㄱㅁㅈㅇㅋ" → "얼굴 모자이크" 매칭
 *   5. 동의어 확장     — "사진"→이미지, "줄이기"→압축 등 한·영 동작/대상 동의어
 *   6. 신호 가중(선택) — 인기도(사용 횟수)·최근 사용을 점수에 반영(호출자 주입)
 *
 * 순환 의존을 피하려고 ToolMeta 는 type-only import (런타임 미참조).
 * 검색 대상 풀은 호출자가 넘긴다(registry.filterTools 가 TOOLS 를 전달).
 */

import type { ToolMeta } from './registry';

/* ────────────────────────── 동의어 ────────────────────────── */

/**
 * 검색어 동의어 — 사용자가 쓰는 일상어를 도구의 실제 키워드로 확장한다.
 * 키(왼쪽)가 입력 토큰에 들어오면 값(오른쪽) 토큰들도 OR 로 함께 매칭한다.
 * 양방향이 필요한 쌍은 양쪽에 등록한다(예: 사진↔이미지). 과확장은 노이즈가
 * 되므로 의미가 또렷한 것만 둔다.
 */
const SYNONYMS: Record<string, string[]> = {
  // 대상(명사)
  사진: ['이미지', 'image', 'photo'],
  이미지: ['image', '사진', 'photo'],
  photo: ['image', '사진', '이미지'],
  image: ['이미지', '사진'],
  동영상: ['비디오', 'video', '영상'],
  영상: ['비디오', 'video', '동영상'],
  video: ['비디오', '영상'],
  소리: ['오디오', 'audio', '음성'],
  음성: ['오디오', 'audio', '소리'],
  audio: ['오디오', '소리'],
  글자: ['텍스트', 'text', '문자'],
  텍스트: ['text', '글자'],
  암호: ['비밀번호', 'password', '패스워드'],
  비밀번호: ['password', '암호', '패스워드'],
  password: ['비밀번호', '암호'],
  // 동작(동사)
  줄이기: ['압축', 'compress', '용량'],
  줄여: ['압축', 'compress', '용량'],
  압축: ['compress', '용량', '줄이기'],
  compress: ['압축', '용량'],
  합치기: ['병합', 'merge', '결합'],
  병합: ['merge', '합치기'],
  merge: ['병합', '합치기'],
  나누기: ['분할', 'split', '쪼개기'],
  분할: ['split', '나누기'],
  split: ['분할', '나누기'],
  바꾸기: ['변환', 'convert', '전환'],
  변환: ['convert', '바꾸기'],
  convert: ['변환', '바꾸기'],
  자르기: ['크롭', 'crop', 'trim', '잘라'],
  크롭: ['crop', '자르기'],
  crop: ['크롭', '자르기'],
  가리기: ['모자이크', 'blur', '블러', '마스킹'],
  모자이크: ['blur', '가리기', '블러'],
  만들기: ['생성', 'generate', 'maker'],
  생성: ['generate', '만들기', 'maker'],
  지우기: ['제거', 'remove', '삭제'],
  제거: ['remove', '지우기', '삭제'],
  remove: ['제거', '지우기'],
};

/** 입력 토큰들을 동의어로 확장한 OR 그룹 배열로 변환. */
export function expandTokens(tokens: string[]): string[][] {
  return tokens.map((tk) => {
    const syn = SYNONYMS[tk];
    return syn ? [tk, ...syn] : [tk];
  });
}

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
 * 토큰 OR 그룹(동의어 확장 결과)의 도구 점수.
 * 그룹 안 어느 토큰이든 매칭되면 그 중 최고 점수를 쓴다(원토큰 우선이라 그룹
 * 첫 항목이 보통 동률에서 이긴다). 동의어로 매칭된 항목은 살짝 감점해 직접
 * 입력어 매칭이 위로 오게 한다.
 */
function groupScore(tool: ToolMeta, group: string[]): number {
  let best = 0;
  for (let i = 0; i < group.length; i++) {
    const token = group[i];
    const s = tokenScore(tool, token, isChoseongQuery(token));
    // 동의어(인덱스>0)는 8% 감점 — 원어 매칭을 우선.
    const adjusted = i === 0 ? s : s * 0.92;
    if (adjusted > best) best = adjusted;
  }
  return best;
}

/**
 * 도구 한 개의 쿼리 적합도. 0 이면 결과에서 제외.
 * 모든 토큰이 매칭돼야(AND) 하며, 토큰 점수의 합이 총점.
 * `tokens` 는 평문 토큰 배열이며, 내부에서 동의어로 확장한다.
 */
export function scoreTool(tool: ToolMeta, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  let total = 0;
  for (const group of expandTokens(tokens)) {
    const s = groupScore(tool, group);
    if (s <= 0) return 0; // 한 토큰이라도(동의어 포함) 미매칭 → 탈락
    total += s;
  }
  return total;
}

/** 검색 랭킹에 반영할 사용 신호(선택). 클라이언트에서만 주입. */
export interface SearchSignals {
  /** 도구 id → 누적 사용 횟수 */
  usage?: Record<string, number>;
  /** 최근 사용한 도구 id (최신 우선). 상위 일부에 소폭 가산. */
  recentIds?: string[];
}

/**
 * 관련도 점수에 인기도·최근성 신호를 더한 최종 점수.
 * 신호는 텍스트 관련도를 뒤집지 않도록 작게(로그 스케일) 가산한다 —
 * 우선은 어디까지나 "쿼리에 맞는가"이고, 동률 부근을 신호로 가른다.
 */
function signalBoost(toolId: string, signals?: SearchSignals): number {
  if (!signals) return 0;
  let boost = 0;
  const uses = signals.usage?.[toolId] ?? 0;
  if (uses > 0) boost += Math.min(12, Math.log2(uses + 1) * 3); // 1→3, 7→9, 최대 12
  const ri = signals.recentIds?.indexOf(toolId) ?? -1;
  if (ri >= 0 && ri < 5) boost += 5 - ri; // 최근 5개에 5..1 가산
  return boost;
}

/* ────────────────────────── 공개 API ────────────────────────── */

/**
 * 풀에서 쿼리에 맞는 도구를 관련도 내림차순으로 반환.
 * 동점이면 ready 우선 → phase 오름차순 → 제목 길이 오름차순.
 * `signals` 를 주면 인기도·최근성을 소폭 가산한다(클라이언트 전용).
 * (빈 쿼리 처리는 호출자 책임 — 여기선 토큰이 비면 전부 통과)
 */
export function searchTools(
  query: string,
  pool: ToolMeta[],
  signals?: SearchSignals,
): ToolMeta[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [...pool];

  const scored: Array<{ tool: ToolMeta; score: number }> = [];
  for (const tool of pool) {
    const score = scoreTool(tool, tokens);
    if (score > 0) scored.push({ tool, score: score + signalBoost(tool.id, signals) });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.tool.status !== b.tool.status) return a.tool.status === 'ready' ? -1 : 1;
    if (a.tool.phase !== b.tool.phase) return a.tool.phase - b.tool.phase;
    return a.tool.title.length - b.tool.title.length;
  });

  return scored.map((s) => s.tool);
}

/* ────────────────────────── 하이라이트 ────────────────────────── */

/** 하이라이트 세그먼트 — `match` 가 true 면 강조 표시 대상. */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * 쿼리 토큰(및 동의어)이 등장하는 구간을 표시한 세그먼트 배열을 만든다.
 * 결과 목록에서 매칭 부분을 굵게/강조하는 데 쓴다. 초성 쿼리는 원문 글자와
 * 1:1 대응이 어긋날 수 있어 강조하지 않는다(미매칭 세그먼트 1개로 반환).
 * 정규식을 쓰지 않아(사용자 입력 그대로) ReDoS·이스케이프 이슈가 없다.
 */
export function highlightMatch(text: string, query: string): HighlightSegment[] {
  const raw = query.trim().toLowerCase();
  if (!raw || !text) return [{ text, match: false }];

  // 동의어까지 포함한 모든 후보 토큰(초성·1글자 제외) 수집.
  const needles = new Set<string>();
  for (const group of expandTokens(raw.split(/\s+/).filter(Boolean))) {
    for (const tk of group) {
      if (tk.length >= 1 && !isChoseongQuery(tk)) needles.add(tk);
    }
  }
  if (needles.size === 0) return [{ text, match: false }];

  const lower = text.toLowerCase();
  // 각 위치에서 매칭 여부를 마킹(겹침 허용 → OR).
  const marked = new Array<boolean>(text.length).fill(false);
  for (const needle of needles) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(needle, from);
      if (at === -1) break;
      for (let i = at; i < at + needle.length; i++) marked[i] = true;
      from = at + needle.length;
    }
  }

  // 인접한 같은 상태를 묶어 세그먼트로.
  const segs: HighlightSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const state = marked[i];
    let j = i + 1;
    while (j < text.length && marked[j] === state) j++;
    segs.push({ text: text.slice(i, j), match: state });
    i = j;
  }
  return segs;
}
