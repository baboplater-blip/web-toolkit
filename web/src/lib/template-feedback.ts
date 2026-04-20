/**
 * 템플릿 사용·반응 카운터 (로컬 스토리지 기반, 단말 전용).
 *
 * 용도: 템플릿 목록을 "👍 많이 받은 프롬프트" 순으로 살짝 보정해 정렬한다.
 *
 * 모델:
 *   picks[id]     : 템플릿을 선택(→ 입력창에 삽입)한 횟수.
 *   positives[id] : 선택 직후 N분 내에 assistant 응답에 👍 반응한 횟수.
 *   lastPicked    : { id, ts } — reaction 시각이 이 이후 PICK_ATTRIBUTE_WINDOW_MS 내면
 *                   해당 템플릿의 포지티브로 가산.
 *
 * 단일 사용자 단말 가정. 정확한 통계 대신 "경험 기반 랭킹 보정"이 목표.
 */

const KEY_PICKS = 'acp:tmpl-picks';
const KEY_POS = 'acp:tmpl-positives';
const KEY_LAST = 'acp:tmpl-last-picked';
const PICK_ATTRIBUTE_WINDOW_MS = 3 * 60 * 1000;

function readMap(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, value: Record<string, number>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function noteTemplatePicked(templateId: string): void {
  if (typeof localStorage === 'undefined') return;
  const picks = readMap(KEY_PICKS);
  picks[templateId] = (picks[templateId] ?? 0) + 1;
  writeMap(KEY_PICKS, picks);
  try {
    localStorage.setItem(KEY_LAST, JSON.stringify({ id: templateId, ts: Date.now() }));
  } catch {}
}

export function notePositiveReaction(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEY_LAST);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { id?: string; ts?: number };
    if (!parsed?.id || typeof parsed.ts !== 'number') return;
    if (Date.now() - parsed.ts > PICK_ATTRIBUTE_WINDOW_MS) return;
    const pos = readMap(KEY_POS);
    pos[parsed.id] = (pos[parsed.id] ?? 0) + 1;
    writeMap(KEY_POS, pos);
  } catch {}
}

export function getTemplateScore(templateId: string): number {
  const picks = readMap(KEY_PICKS)[templateId] ?? 0;
  const pos = readMap(KEY_POS)[templateId] ?? 0;
  // 👍 는 3배 가중.
  return pos * 3 + picks;
}

export function hasPositiveFeedback(templateId: string): boolean {
  return (readMap(KEY_POS)[templateId] ?? 0) > 0;
}
