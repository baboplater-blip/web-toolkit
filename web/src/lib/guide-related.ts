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
  'css-units': ['css-clamp', 'color-converter', 'color-name', 'css-minify'],
  'color-converter': ['color-name', 'color-mix', 'tailwind-shades', 'css-units'],
  'color-name': ['color-converter', 'tailwind-shades', 'css-units', 'color-contrast'],
  'code-case': ['text-case', 'slugify', 'json-to-go', 'css-units'],
  'http-status': ['user-agent-parser', 'url-encoder', 'curl-to-code', 'json-format'],
  'timestamp-converter': ['cron-explainer', 'date-diff', 'timezone', 'age-calc'],
  'cron-explainer': ['crontab-builder', 'timestamp-converter', 'regex-tester', 'chmod-calc'],
  'chmod-calc': ['cron-explainer', 'subnet-calc', 'file-hash', 'base64'],
  'lorem-ipsum': ['lorem-ko', 'text-count', 'text-case', 'slugify'],
  'uuid-gen': ['password-gen', 'uuid-namespace', 'totp', 'json-format'],
  'password-gen': ['uuid-gen', 'diceware', 'password-strength', 'totp'],

  // ── 텍스트 ──
  'text-diff': ['text-count', 'text-case', 'regex-tester', 'remove-accents'],
  'text-count': ['readability-score', 'text-diff', 'word-frequency', 'count-occurrences'],
  'text-case': ['code-case', 'slugify', 'text-count', 'remove-accents'],
  'regex-tester': ['regex-escape', 'text-diff', 'text-case', 'json-format'],
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

  // ── 라운드5: 개발 도구 ──
  'html-format': ['css-minify', 'json-format', 'sql-format', 'svg-optimize'],
  'svg-optimize': ['image-svg-to-png', 'css-minify', 'html-format', 'image-convert'],
  'json-diff': ['json-format', 'text-diff', 'json-flatten', 'json-to-go'],
  'cubic-bezier': ['css-gradient', 'box-shadow', 'css-units', 'color-converter'],
  'mock-data': ['json-to-ts', 'uuid-gen', 'lorem-ipsum', 'json-format'],
  'json-xml': ['json-format', 'yaml-json', 'csv-json', 'xml-format'],

  // ── 라운드5: 계산/유틸 ──
  'bmi-calc': ['ideal-weight', 'tdee', 'loan-calc', 'unit-converter'],
  'loan-calc': ['compound-interest', 'percentage', 'discount', 'bmi-calc'],
  discount: ['percentage', 'tip-calc', 'vat-calc', 'loan-calc'],
  timezone: ['timestamp-converter', 'date-diff', 'unit-converter', 'cron-explainer'],
  'date-diff': ['date-add', 'timezone', 'timestamp-converter', 'age-calc'],
  'aspect-ratio': ['image-resize', 'unit-converter', 'image-crop', 'percentage'],

  // ── 라운드5: 보안 ──
  'password-strength': ['password-gen', 'diceware', 'bcrypt', 'text-hash'],
  'rsa-keypair': ['bcrypt', 'jwt-decoder', 'hmac-gen', 'password-gen'],

  // ── 라운드5: 유틸/이미지/텍스트/문서/PDF ──
  barcode: ['qr-code', 'wifi-qr', 'qr-logo', 'vcard-qr'],
  'image-color-picker': ['color-converter', 'color-name', 'image-crop', 'color-contrast'],
  'avatar-crop': ['image-crop', 'image-resize', 'image-round-corners', 'image-convert'],
  'word-frequency': ['text-count', 'count-occurrences', 'text-diff', 'remove-accents'],
  'md-html': ['markdown-toc', 'markdown-stats', 'html-format', 'docx-to-md'],
  'pdf-to-txt': ['pdf-to-word', 'pdf-to-md', 'pdf-to-html', 'pdf-to-jpg'],

  // ── 라운드6: 신규 34종(+cc-validate) 워크플로 클러스터 ──
  // 개발: SEO/CSS/JSON/문자열
  'meta-tags': ['robots-txt', 'json-schema', 'html-format', 'url-encoder'],
  'robots-txt': ['meta-tags', 'json-schema', 'http-status', 'url-parser'],
  'css-clamp': ['css-units', 'tailwind-shades', 'css-gradient', 'css-minify'],
  'json-schema': ['json-format', 'json-to-ts', 'json-to-go', 'mock-data'],
  'string-escape': ['url-encoder', 'html-entities', 'base64', 'json-escape'],
  'unicode-lookup': ['ascii-table', 'string-escape', 'html-entities', 'text-count'],
  'crontab-builder': ['cron-explainer', 'timestamp-converter', 'timezone', 'chmod-calc'],
  'tailwind-shades': ['css-clamp', 'color-converter', 'color-name', 'css-gradient'],
  // 텍스트: 분석/리스트/유니코드 스타일
  'readability-score': ['text-count', 'word-frequency', 'syllable-counter', 'markdown-stats'],
  'sort-numbers': ['text-sort', 'dedupe-lines', 'list-shuffle', 'number-to-words'],
  'list-shuffle': ['text-sort', 'sort-numbers', 'random-pick', 'dedupe-lines'],
  'syllable-counter': ['readability-score', 'text-count', 'word-frequency', 'manuscript-count'],
  'strikethrough-text': ['fancy-text', 'superscript-text', 'zalgo-text', 'upside-down'],
  'superscript-text': ['fancy-text', 'strikethrough-text', 'unicode-lookup', 'zalgo-text'],
  // 유틸: 시간/랜덤결정/돈/건강/운세
  'world-clock': ['timezone', 'countdown', 'dday', 'date-diff'],
  countdown: ['dday', 'world-clock', 'timer-stopwatch', 'date-diff'],
  'magic-8-ball': ['decision-wheel', 'coin-flip', 'dice-roller', 'random-pick'],
  'decision-wheel': ['magic-8-ball', 'random-pick', 'coin-flip', 'lottery-number'],
  'bill-split': ['tip-calc', 'vat-calc', 'discount', 'percentage'],
  'ideal-weight': ['bmi-calc', 'tdee', 'sleep-calc', 'pace-calc'],
  zodiac: ['numerology', 'age-calc', 'dday', 'date-diff'],
  numerology: ['zodiac', 'age-calc', 'lottery-number', 'random-number'],
  // 보안: 해시/체크섬/랜덤
  'hash-identifier': ['text-hash', 'bcrypt', 'checksum-verify', 'base32'],
  'iban-validator': ['cc-validate', 'luhn-generator', 'checksum-verify', 'random-bytes'],
  'luhn-generator': ['cc-validate', 'iban-validator', 'random-pin', 'random-bytes'],
  'random-pin': ['password-gen', 'random-bytes', 'luhn-generator', 'diceware'],
  'cc-validate': ['luhn-generator', 'iban-validator', 'checksum-verify', 'base32'],
  // 이미지: 필터/효과
  'image-sepia': ['image-black-white', 'image-duotone', 'image-tint', 'image-filters'],
  'image-vignette': ['image-blur', 'image-sepia', 'image-filters', 'image-border'],
  'image-tint': ['image-duotone', 'image-sepia', 'image-color-adjust', 'image-filters'],
  'screenshot-shadow': ['image-border', 'image-round-corners', 'image-watermark', 'gradient-image'],
  // 문서: 표 변환
  'csv-to-html': ['csv-to-md', 'csv-viewer', 'markdown-table-gen', 'csv-json'],
  'markdown-table-gen': ['md-table', 'csv-to-md', 'markdown-toc', 'csv-to-html'],
  // PDF: 페이지 편집
  'pdf-delete-pages': ['pdf-organize', 'pdf-split', 'pdf-insert', 'pdf-reverse'],
  // 오디오
  metronome: ['tone-gen', 'audio-speed', 'mic-record', 'audio-waveform'],

  // ── 라운드12: 팩5 31종 워크플로 클러스터 ──
  // 개발
  'mime-type-lookup': ['http-status', 'user-agent-parser', 'base64', 'url-parser'],
  'semver-checker': ['git-command-builder', 'gitignore-gen', 'json-to-ts', 'code-case'],
  'sql-in-clause': ['csv-to-sql', 'sql-format', 'regex-tester', 'code-case'],
  'color-mix': ['color-converter', 'color-name', 'tailwind-shades', 'css-gradient'],
  'git-command-builder': ['gitignore-gen', 'semver-checker', 'cron-explainer', 'code-case'],
  'htaccess-redirect': ['robots-txt', 'meta-tags', 'http-status', 'url-encoder'],
  'query-string-builder': ['url-encoder', 'url-parser', 'string-escape', 'json-format'],
  'regex-escape': ['regex-tester', 'string-escape', 'text-replace', 'slugify'],
  // 텍스트
  'reverse-words': ['reverse-text', 'text-sort', 'sort-numbers', 'word-frequency'],
  'pig-latin': ['caesar-cipher', 'morse-code', 'fancy-text', 'reverse-words'],
  'remove-emoji': ['remove-numbers', 'remove-accents', 'whitespace-clean', 'remove-line-breaks'],
  'remove-numbers': ['remove-emoji', 'whitespace-clean', 'remove-accents', 'text-replace'],
  'smart-quotes': ['remove-accents', 'text-replace', 'whitespace-clean', 'fancy-text'],
  // 유틸: 시간/건강/계산/랜덤
  'time-card-calc': ['salary-calc', 'date-diff', 'time-duration', 'timezone'],
  'date-add': ['date-diff', 'age-calc', 'dday', 'timezone'],
  'grade-calc': ['gpa', 'percentage', 'ratio-calc', 'number-to-words'],
  'ovulation-calc': ['pregnancy-due-date', 'date-add', 'dday', 'bmi-calc'],
  'pregnancy-due-date': ['ovulation-calc', 'date-add', 'dday', 'age-calc'],
  'paint-calc': ['unit-converter', 'aspect-ratio', 'ratio-calc', 'percentage'],
  'currency-format': ['number-to-words', 'percentage', 'discount', 'vat-calc'],
  'random-team-generator': ['random-pick', 'list-shuffle', 'decision-wheel', 'random-number'],
  'random-emoji': ['random-pick', 'decision-wheel', 'magic-8-ball', 'fancy-text'],
  'markup-calc': ['discount', 'vat-calc', 'percentage', 'loan-calc'],
  // 보안: 체크섬 검증
  'isbn-validate': ['cc-validate', 'iban-validator', 'luhn-generator', 'checksum-verify'],
  'vin-validate': ['isbn-validate', 'imei-validate', 'cc-validate', 'checksum-verify'],
  'imei-validate': ['luhn-generator', 'cc-validate', 'vin-validate', 'isbn-validate'],
  // 문서
  'csv-to-sql': ['csv-to-html', 'csv-to-md', 'sql-in-clause', 'csv-json'],
  'markdown-to-text': ['markdown-preview', 'md-html', 'markdown-toc', 'markdown-stats'],
  // 이미지
  'image-noise': ['image-denoise', 'image-filters', 'image-sepia', 'image-pixelate'],
  'image-threshold': ['image-black-white', 'image-duotone', 'image-filters', 'image-pixelate'],
  // 오디오
  'bpm-tap': ['metronome', 'tone-gen', 'audio-speed', 'audio-waveform'],
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
