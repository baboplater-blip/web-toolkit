/**
 * 가이드 간 교차링크용 "워크플로 클러스터" 큐레이션 맵.
 *
 * 기존 관련 도구 추천은 "같은 카테고리에서 phase 순 N개"라 의미적 관련성이
 * 약했다(예: PDF 합치기 옆에 무관한 PDF 도구). 검색 트래픽이 큰 도구는 여기에
 * 사용자가 실제로 이어서 쓰거나 비교하는 도구를 손으로 묶어 내부링크 동선을
 * 강화한다 — 체류 시간·크롤링 깊이·문맥적 앵커텍스트 모두에 이롭다.
 *
 * 언어 중립(도구 id 만 담음) — 표시되는 이름·태그라인은 각 로케일 카피에서
 * 가져온다. `getRelatedTools` 가 큐레이션을 먼저 채우고(존재·ready·로케일 카피
 * 보유 검증), 모자라면 같은 카테고리로 채운다. **존재하지 않는 id 는 조용히
 * 건너뛰므로 죽은 링크가 생기지 않는다.**
 */

import type { ToolMeta } from '@/lib/tools/registry';

/** 도구 id → 이어 쓰기/비교 좋은 도구 id 목록(우선순위 순). */
export const RELATED_TOOLS: Record<string, string[]> = {
  // ── PDF 워크플로 ──
  'pdf-merge': ['pdf-split', 'pdf-organize', 'pdf-to-jpg', 'compress'],
  'pdf-split': ['pdf-merge', 'pdf-organize', 'pdf-to-jpg', 'compress'],
  'pdf-to-jpg': ['pdf-from-jpg', 'pdf-to-word', 'pdf-split', 'compress'],
  'pdf-from-jpg': ['pdf-to-jpg', 'pdf-merge', 'image-convert', 'compress'],
  'pdf-to-word': ['pdf-to-txt', 'pdf-to-md', 'pdf-to-jpg', 'pdf-to-html'],
  compress: ['pdf-merge', 'image-resize', 'image-convert', 'pdf-split'],

  // ── 이미지 워크플로 ──
  'image-resize': ['image-convert', 'compress', 'image-crop', 'image-heic-to-jpg'],
  'image-convert': ['image-resize', 'image-heic-to-jpg', 'compress', 'image-crop'],
  'image-heic-to-jpg': ['image-convert', 'image-resize', 'compress', 'image-crop'],
  'image-crop': ['image-resize', 'image-rotate', 'image-watermark', 'image-convert'],
  'image-rotate': ['image-crop', 'image-resize', 'image-watermark', 'image-convert'],
  'image-watermark': ['image-resize', 'image-crop', 'image-rotate', 'image-convert'],

  // ── 개발: JSON/데이터 ──
  'json-format': ['json-to-go', 'json-flatten', 'yaml-json', 'csv-json'],
  'json-to-go': ['json-format', 'json-to-python', 'json-flatten', 'json-sort-keys'],
  'json-flatten': ['json-format', 'csv-json', 'yaml-json', 'json-to-go'],
  'sql-format': ['json-format', 'code-case', 'regex-tester', 'json-to-go'],
  'csv-json': ['yaml-json', 'json-format', 'csv-merge', 'json-flatten'],
  'yaml-json': ['csv-json', 'json-format', 'toml-json', 'json-flatten'],

  // ── 개발: 인코딩/식별자/색상 ──
  base64: ['url-encoder', 'html-entities', 'file-hash', 'json-format'],
  'url-encoder': ['base64', 'html-entities', 'jwt-decoder', 'json-format'],
  'jwt-decoder': ['base64', 'url-encoder', 'totp', 'hmac-gen'],
  'css-units': ['color-converter', 'color-name', 'css-minify', 'css-specificity'],
  'color-converter': ['color-name', 'css-units', 'color-contrast', 'css-gradient'],
  'color-name': ['color-converter', 'css-units', 'color-contrast', 'css-gradient'],
  'code-case': ['text-case', 'slugify', 'json-to-go', 'css-units'],
  'http-status': ['user-agent-parser', 'url-encoder', 'curl-to-code', 'json-format'],
  'timestamp-converter': ['cron-explainer', 'date-diff', 'timezone', 'age-calc'],
  'cron-explainer': ['timestamp-converter', 'regex-tester', 'chmod-calc', 'code-case'],
  'chmod-calc': ['cron-explainer', 'subnet-calc', 'file-hash', 'base64'],
  'lorem-ipsum': ['lorem-ko', 'text-count', 'text-case', 'slugify'],
  'uuid-gen': ['password-gen', 'uuid-namespace', 'totp', 'json-format'],
  'password-gen': ['uuid-gen', 'diceware', 'password-strength', 'totp'],

  // ── 텍스트 ──
  'text-diff': ['text-count', 'text-case', 'regex-tester', 'remove-accents'],
  'text-count': ['text-diff', 'word-frequency', 'count-occurrences', 'text-case'],
  'text-case': ['code-case', 'slugify', 'text-count', 'remove-accents'],
  'regex-tester': ['text-diff', 'text-case', 'json-format', 'text-count'],
  'remove-accents': ['slugify', 'text-case', 'text-count', 'html-entities'],
  slugify: ['remove-accents', 'text-case', 'code-case', 'lorem-ipsum'],
  'html-entities': ['url-encoder', 'base64', 'json-escape', 'text-case'],

  // ── 유틸/계산 ──
  'unit-converter': ['percentage', 'tip-calc', 'ratio-calc', 'number-to-words'],
  percentage: ['unit-converter', 'tip-calc', 'discount', 'vat-calc'],
  'tip-calc': ['percentage', 'unit-converter', 'discount', 'vat-calc'],
  'subnet-calc': ['chmod-calc', 'base32', 'http-status', 'file-hash'],
  'file-hash': ['base64', 'checksum-verify', 'text-hash', 'password-gen'],
  'qr-code': ['wifi-qr', 'barcode', 'vcard-qr', 'qr-logo'],
  'wifi-qr': ['qr-code', 'vcard-qr', 'qr-logo', 'barcode'],

  // ── 보안 ──
  bcrypt: ['password-gen', 'password-strength', 'text-hash', 'totp'],
  totp: ['qr-code', 'bcrypt', 'password-gen', 'jwt-decoder'],

  // ── 문서 ──
  'markdown-toc': ['markdown-stats', 'csv-to-md', 'md-to-epub', 'text-count'],

  // ── 비디오/GIF ──
  'video-to-gif': ['gif-maker', 'video-trim', 'video-compress', 'gif-optimize'],
  'video-convert': ['video-compress', 'video-trim', 'video-to-audio', 'video-to-gif'],
  'video-compress': ['video-convert', 'video-trim', 'compress', 'video-to-gif'],
  'video-trim': ['video-compress', 'video-convert', 'video-to-audio', 'video-to-gif'],
  'video-to-audio': ['audio-convert', 'audio-trim', 'video-trim', 'video-convert'],
  'gif-maker': ['video-to-gif', 'gif-optimize', 'gif-resize', 'image-convert'],
  'gif-optimize': ['gif-maker', 'video-to-gif', 'gif-resize', 'compress'],

  // ── 오디오 ──
  'audio-convert': ['audio-trim', 'video-to-audio', 'audio-compress', 'audio-merge'],
  'audio-trim': ['audio-convert', 'audio-fade', 'video-to-audio', 'audio-merge'],

  // ── 문서 변환 ──
  'docx-to-pdf': ['pdf-merge', 'docx-to-md', 'pdf-to-word', 'compress'],

  // ── 이미지 생성/편집 ──
  'favicon-gen': ['image-convert', 'image-resize', 'qr-logo', 'image-crop'],
  'meme-gen': ['image-watermark', 'image-crop', 'image-resize', 'fancy-text'],

  // ── 개발: CSS/색상/타입 ──
  'json-to-ts': ['json-to-go', 'json-to-python', 'json-format', 'mock-data'],
  'css-gradient': ['box-shadow', 'color-converter', 'color-name', 'css-units'],
  'color-contrast': ['color-converter', 'color-name', 'css-gradient', 'css-units'],
  'box-shadow': ['css-gradient', 'css-units', 'color-converter', 'cubic-bezier'],
  'base-converter': ['color-converter', 'chmod-calc', 'subnet-calc', 'json-format'],

  // ── 유틸/텍스트(변환·재미) ──
  'number-to-words': ['roman-numeral', 'unit-converter', 'percentage', 'base-converter'],
  'roman-numeral': ['number-to-words', 'base-converter', 'unit-converter', 'date-diff'],
  'morse-code': ['caesar-cipher', 'binary-text', 'nato-phonetic', 'fancy-text'],
  'caesar-cipher': ['morse-code', 'base64', 'binary-text', 'text-case'],
};

/**
 * 큐레이션 우선 + 같은 카테고리 폴백으로 관련 도구를 반환한다.
 * @param tool   현재 도구
 * @param all    전체 도구 목록(TOOLS)
 * @param opts   limit(기본 4), has(로케일 카피 보유 검사 — EN/JA/ZH 용)
 */
export function getRelatedTools(
  tool: ToolMeta,
  all: ToolMeta[],
  opts?: { limit?: number; has?: (id: string) => boolean },
): ToolMeta[] {
  const limit = opts?.limit ?? 4;
  const has = opts?.has ?? (() => true);
  const byId = new Map(all.map((t) => [t.id, t] as const));

  const eligible = (t: ToolMeta | undefined): t is ToolMeta =>
    !!t && t.status === 'ready' && t.id !== tool.id && has(t.id);

  const out: ToolMeta[] = [];
  const seen = new Set<string>([tool.id]);

  // 1) 큐레이션 클러스터(순서 유지, 존재·자격 검증 — 없는 id 는 스킵)
  for (const id of RELATED_TOOLS[tool.id] ?? []) {
    if (seen.has(id)) continue;
    const t = byId.get(id);
    if (eligible(t)) {
      out.push(t);
      seen.add(id);
      if (out.length >= limit) return out;
    }
  }

  // 2) 같은 카테고리로 채우기(phase 순)
  const sameCategory = all
    .filter((t) => t.category === tool.category && !seen.has(t.id) && eligible(t))
    .sort((a, b) => a.phase - b.phase);
  for (const t of sameCategory) {
    out.push(t);
    seen.add(t.id);
    if (out.length >= limit) break;
  }

  return out;
}
