import { test, expect } from '@playwright/test';

/**
 * 도구별 맞춤 가이드(CUSTOM_GUIDES) 회귀 가드.
 *
 * `/guide/*` 본문은 기본적으로 카테고리 패턴으로 자동생성되지만, 검색 수요가 큰
 * 도구는 `lib/guide-content{,-en,-ja,-zh}.ts` 의 `CUSTOM_GUIDES*` 맵에서
 * 도구별 본문으로 덮어쓴다(필드 단위 머지). 이 스펙은 그 override 가 실제로
 * 적용돼 정적 HTML 에 박히는지 검증한다.
 *
 * 두 층위로 가드한다:
 *   ① 메커니즘: 각 맞춤 도구 가이드에 "자동생성 intro 꼬리말"이 **없어야** 한다.
 *      (override.intro 가 적용되면 빌더 템플릿 꼬리말이 사라진다. 키가 빠지거나
 *       머지 로직이 깨지면 자동생성으로 폴백 → 꼬리말이 다시 등장 → 실패.)
 *      음성 대조로 비맞춤 도구(age-calc)에는 꼬리말이 **있어야** 함도 확인.
 *   ② 본문: 대표 도구의 실제 맞춤 문구(예시값·FAQ)가 렌더되는지 스팟 체크.
 *
 * ※ CUSTOM_GUIDE_IDS 는 CUSTOM_GUIDES 키의 스냅샷이다. 맞춤 가이드 추가 시 갱신:
 *   awk '/export const CUSTOM_GUIDES:/,/^};/' src/lib/guide-content.ts | grep -E "^  ['\"]?[a-z0-9-]+['\"]?: \{"
 */

// 4개국어 각 90종 맞춤 가이드(2026-06-17 기준) — 키는 도구 id.
const CUSTOM_GUIDE_IDS: string[] = [
  // 라운드1 (12)
  'css-units', 'chmod-calc', 'http-status', 'json-to-go', 'color-name', 'code-case',
  'tip-calc', 'subnet-calc', 'bcrypt', 'wifi-qr', 'remove-accents', 'json-flatten',
  // 라운드2 코어 (18)
  'qr-code', 'base64', 'json-format', 'password-gen', 'uuid-gen', 'jwt-decoder',
  'url-encoder', 'regex-tester', 'text-diff', 'text-count', 'pdf-merge', 'pdf-split',
  'image-resize', 'image-convert', 'image-heic-to-jpg', 'unit-converter', 'percentage', 'compress',
  // 라운드3 다음 티어 (20)
  'color-converter', 'timestamp-converter', 'cron-explainer', 'pdf-to-jpg', 'pdf-from-jpg',
  'pdf-to-word', 'csv-json', 'yaml-json', 'text-case', 'lorem-ipsum', 'image-crop',
  'image-rotate', 'image-watermark', 'sql-format', 'html-entities', 'file-hash', 'totp',
  'slugify', 'markdown-toc', 'video-to-gif',
  // 라운드4 미디어·개발 (20)
  'docx-to-pdf', 'video-convert', 'video-compress', 'video-trim', 'video-to-audio',
  'audio-convert', 'audio-trim', 'gif-maker', 'gif-optimize', 'favicon-gen', 'meme-gen',
  'json-to-ts', 'css-gradient', 'color-contrast', 'box-shadow', 'base-converter',
  'number-to-words', 'roman-numeral', 'morse-code', 'caesar-cipher',
  // 라운드5 개발·계산·기타 (20)
  'html-format', 'svg-optimize', 'json-diff', 'cubic-bezier', 'mock-data', 'json-xml',
  'bmi-calc', 'loan-calc', 'discount', 'timezone', 'date-diff', 'aspect-ratio',
  'password-strength', 'rsa-keypair', 'barcode', 'image-color-picker', 'avatar-crop',
  'word-frequency', 'md-html', 'pdf-to-txt',
  // 라운드A(팩6) 신규 30종 (CUSTOM_GUIDES 155→185)
  'age-difference', 'base58', 'bmr-calculator', 'business-days', 'cooking-converter',
  'credit-card-type', 'css-grid', 'css-triangle', 'dog-age-calc', 'ean-validate',
  'email-validator', 'hashtag-generator', 'html-to-markdown', 'image-glitch', 'image-posterize',
  'leetspeak', 'letter-frequency', 'love-calculator', 'mac-address', 'nanoid-gen',
  'noise-generator', 'random-letter', 'random-words', 'regex-cheatsheet', 'remove-duplicate-words',
  'shoe-size-converter', 'text-shadow', 'tsv-to-csv', 'uuid-validate', 'week-number',
];

// 자동생성 intro 의 마지막 문장(빌더 템플릿). override.intro 가 적용되면 사라진다.
const LOCALES = [
  { id: 'ko', prefix: '', genericTail: '회원가입·설치·업로드 없이 브라우저 안에서 즉시 동작합니다' },
  { id: 'en', prefix: '/en', genericTail: 'no signup, no installation, and nothing is uploaded to a server' },
  { id: 'ja', prefix: '/ja', genericTail: 'サーバーへのアップロードは一切ありません' },
  { id: 'zh', prefix: '/zh', genericTail: '绝不会向服务器上传任何内容' },
];

// 속도를 위해 KO 는 70종 전수, 타 언어는 카테고리 대표 16종으로 메커니즘만 확인.
const SUBSET_FOR_NON_KO = new Set([
  'css-units', 'chmod-calc', 'qr-code', 'base64', 'json-format',
  'jwt-decoder', 'pdf-merge', 'image-convert', 'unit-converter', 'compress',
  // 라운드3 대표
  'cron-explainer', 'pdf-to-word', 'csv-json',
  // 라운드4 대표
  'video-convert', 'color-contrast', 'base-converter',
  // 라운드5 대표
  'bmi-calc', 'rsa-keypair', 'md-html',
  // 라운드A(팩6) 대표
  'base58', 'bmr-calculator', 'ean-validate', 'css-grid', 'html-to-markdown', 'week-number',
]);

test.describe('맞춤 가이드 — override 적용(자동생성 폴백 아님)', () => {
  for (const loc of LOCALES) {
    const ids =
      loc.id === 'ko'
        ? CUSTOM_GUIDE_IDS
        : CUSTOM_GUIDE_IDS.filter((id) => SUBSET_FOR_NON_KO.has(id));

    for (const id of ids) {
      test(`[${loc.id}] /guide/${id} — 맞춤 본문 렌더(generic 꼬리말 없음)`, async ({ page }) => {
        const resp = await page.goto(`${loc.prefix}/guide/${id}`, { waitUntil: 'load' });
        expect(resp?.status() ?? 200).toBeLessThan(400);

        // 가이드 페이지가 렌더됨
        await expect(page.getByRole('heading').first()).toBeVisible();

        // override.intro 가 적용됐다면 자동생성 꼬리말이 없어야 한다.
        const html = await page.content();
        expect(
          html.includes(loc.genericTail),
          `${loc.prefix}/guide/${id} 가 자동생성 intro 로 폴백됨(override 미적용)`,
        ).toBe(false);
      });
    }
  }

  // 음성 대조: 맞춤 대상이 아닌 도구는 자동생성 꼬리말이 있어야 한다(가드가 실제 신호를 잡는지 확인).
  test('[ko] /guide/age-calc — 비맞춤 도구는 자동생성 intro 유지(가드 음성 대조)', async ({ page }) => {
    await page.goto('/guide/age-calc', { waitUntil: 'load' });
    const html = await page.content();
    expect(html).toContain('회원가입·설치·업로드 없이 브라우저 안에서 즉시 동작합니다');
  });
});

test.describe('맞춤 가이드 — 실제 본문 문구 스팟 체크', () => {
  const MARKERS: Array<{ path: string; phrase: string; note: string }> = [
    { path: '/guide/css-units', phrase: '0.75pt', note: 'KO px↔pt 환산식' },
    { path: '/guide/chmod-calc', phrase: 'rwxr-xr-x', note: 'KO 755 기호표기' },
    { path: '/guide/qr-code', phrase: '오류 복원', note: 'KO QR 오류복원' },
    { path: '/en/guide/base64', phrase: '33%', note: 'EN Base64 크기 증가' },
    { path: '/en/guide/jwt-decoder', phrase: 'Does NOT verify the signature', note: 'EN 서명 미검증 경고' },
    { path: '/ja/guide/image-convert', phrase: 'AVIF', note: 'JA AVIF vs WebP' },
    { path: '/zh/guide/jwt-decoder', phrase: '验签', note: 'ZH 解码≠验签' },
    { path: '/zh/guide/compress', phrase: '画质', note: 'ZH 압축 화질 FAQ' },
    // 라운드3
    { path: '/guide/cron-explainer', phrase: '5분마다', note: 'KO cron */5 풀이' },
    { path: '/en/guide/totp', phrase: 'Google Authenticator', note: 'EN TOTP 호환' },
    { path: '/zh/guide/color-converter', phrase: 'OKLCH', note: 'ZH OKLCH 변환' },
    // 라운드4
    { path: '/guide/roman-numeral', phrase: 'MMXXIV', note: 'KO 2024=MMXXIV' },
    { path: '/en/guide/color-contrast', phrase: '4.5:1', note: 'EN WCAG AA 기준' },
    { path: '/en/guide/caesar-cipher', phrase: 'ROT13', note: 'EN ROT13' },
    // 라운드5
    { path: '/guide/aspect-ratio', phrase: '1080', note: 'KO 16:9 1920→1080' },
    { path: '/en/guide/cubic-bezier', phrase: '0.42', note: 'EN ease-in-out 값' },
    { path: '/en/guide/discount', phrase: '24,000', note: 'EN 20% off 30k' },
    // 라운드6 — 신규 34종 맞춤 가이드(4개국어)
    { path: '/guide/meta-tags', phrase: 'Open Graph', note: 'KO OG 메타태그' },
    { path: '/guide/iban-validator', phrase: '97', note: 'KO IBAN mod-97' },
    { path: '/guide/readability-score', phrase: 'Flesch', note: 'KO 가독성 Flesch' },
    { path: '/en/guide/tailwind-shades', phrase: '950', note: 'EN Tailwind 50-950' },
    { path: '/en/guide/luhn-generator', phrase: 'Luhn', note: 'EN Luhn 체크섬' },
    { path: '/ja/guide/meta-tags', phrase: 'OG', note: 'JA OG 메타태그' },
    { path: '/zh/guide/ideal-weight', phrase: 'BMI', note: 'ZH 이상체중 BMI' },
    // 라운드11 — 팩5 31종 맞춤 가이드(4개국어)
    { path: '/guide/vin-validate', phrase: '3779', note: 'KO VIN ISO 3779' },
    { path: '/guide/imei-validate', phrase: 'Luhn', note: 'KO IMEI Luhn' },
    { path: '/en/guide/isbn-validate', phrase: 'ISBN-13', note: 'EN ISBN 13' },
    { path: '/en/guide/semver-checker', phrase: 'prerelease', note: 'EN semver precedence' },
    { path: '/ja/guide/pregnancy-due-date', phrase: '280', note: 'JA 출산예정일 280일' },
    { path: '/zh/guide/image-threshold', phrase: '0.299', note: 'ZH 휘도 계수' },
    // 라운드A — 팩6 30종 맞춤 가이드(4개국어)
    { path: '/guide/base58', phrase: '9Ajdvzr', note: 'KO base58 Hello→9Ajdvzr' },
    { path: '/guide/bmr-calculator', phrase: 'Mifflin', note: 'KO BMR Mifflin-St Jeor' },
    { path: '/guide/ean-validate', phrase: 'GTIN', note: 'KO EAN GTIN 체크디지트' },
    { path: '/en/guide/base58', phrase: 'Bitcoin', note: 'EN base58 Bitcoin 알파벳' },
    { path: '/en/guide/week-number', phrase: 'ISO', note: 'EN ISO-8601 주차' },
    { path: '/ja/guide/bmr-calculator', phrase: 'Mifflin', note: 'JA BMR Mifflin' },
    { path: '/zh/guide/ean-validate', phrase: 'GTIN', note: 'ZH EAN GTIN' },
    { path: '/zh/guide/leetspeak', phrase: 'l337', note: 'ZH leet 변환' },
  ];

  for (const { path, phrase, note } of MARKERS) {
    test(`${path} — "${phrase}" 렌더 (${note})`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      const html = await page.content();
      expect(html, `${path} 에 맞춤 문구 "${phrase}" 누락`).toContain(phrase);
    });
  }
});

test.describe('맞춤 가이드 — 큐레이션 워크플로 교차링크', () => {
  // guide-related.ts 의 RELATED_TOOLS 가 같은 카테고리 휴리스틱이 아니라
  // 의미 기반 클러스터로 렌더되는지 검증(내부링크 동선 회귀 가드).
  const CLUSTERS: Array<{ guide: string; prefix: string; expectLinks: string[] }> = [
    { guide: 'pdf-merge', prefix: '', expectLinks: ['pdf-split', 'pdf-organize', 'pdf-to-jpg', 'compress'] },
    { guide: 'base64', prefix: '', expectLinks: ['url-encoder', 'html-entities', 'file-hash', 'json-format'] },
    { guide: 'image-resize', prefix: '', expectLinks: ['image-convert', 'compress', 'image-crop'] },
    { guide: 'qr-code', prefix: '/en', expectLinks: ['wifi-qr', 'barcode', 'vcard-qr', 'qr-logo'] },
    { guide: 'video-convert', prefix: '', expectLinks: ['video-compress', 'video-trim', 'video-to-audio'] },
    { guide: 'morse-code', prefix: '', expectLinks: ['caesar-cipher', 'binary-text', 'nato-phonetic'] },
    { guide: 'bmi-calc', prefix: '', expectLinks: ['tdee', 'loan-calc', 'unit-converter'] },
    { guide: 'pdf-to-txt', prefix: '', expectLinks: ['pdf-to-word', 'pdf-to-md', 'pdf-to-html'] },
    // 라운드6 — 신규 34종 클러스터
    { guide: 'meta-tags', prefix: '', expectLinks: ['robots-txt', 'json-schema', 'html-format'] },
    { guide: 'image-sepia', prefix: '', expectLinks: ['image-black-white', 'image-duotone', 'image-tint'] },
    { guide: 'iban-validator', prefix: '/en', expectLinks: ['cc-validate', 'luhn-generator', 'checksum-verify'] },
    { guide: 'world-clock', prefix: '', expectLinks: ['timezone', 'countdown', 'dday'] },
    { guide: 'pdf-delete-pages', prefix: '', expectLinks: ['pdf-organize', 'pdf-split', 'pdf-insert'] },
    // 라운드12 — 팩5 클러스터
    { guide: 'isbn-validate', prefix: '', expectLinks: ['cc-validate', 'iban-validator', 'luhn-generator'] },
    { guide: 'ovulation-calc', prefix: '', expectLinks: ['pregnancy-due-date', 'date-add', 'dday'] },
    { guide: 'image-threshold', prefix: '/en', expectLinks: ['image-black-white', 'image-duotone', 'image-filters'] },
    // 라운드B — 팩6 클러스터
    { guide: 'base58', prefix: '', expectLinks: ['base64', 'base-converter', 'url-encoder'] },
    { guide: 'bmr-calculator', prefix: '', expectLinks: ['bmi-calc', 'tdee', 'ideal-weight'] },
    { guide: 'credit-card-type', prefix: '/en', expectLinks: ['cc-validate', 'luhn-generator', 'ean-validate'] },
  ];

  for (const { guide, prefix, expectLinks } of CLUSTERS) {
    test(`${prefix}/guide/${guide} — 큐레이션 관련 도구 링크`, async ({ page }) => {
      await page.goto(`${prefix}/guide/${guide}`, { waitUntil: 'load' });
      const html = await page.content();
      for (const id of expectLinks) {
        expect(
          html.includes(`href="${prefix}/guide/${id}"`),
          `${prefix}/guide/${guide} 에 큐레이션 링크 /guide/${id} 누락`,
        ).toBe(true);
      }
    });
  }
});

test.describe('맞춤 가이드 — 인-프로즈 본문 링크', () => {
  // 본문(steps/faqs)의 [라벨](guide:id) 구문이 ① 가시 영역에 <a> 로 렌더되고
  // ② FAQ JSON-LD 구조화 데이터에는 원문 구문이 새지 않는지(stripInlineGuide) 검증.
  const INLINE = [
    { path: '/guide/barcode', prefix: '', linkTo: 'qr-code' },
    { path: '/guide/pdf-to-word', prefix: '', linkTo: 'ocr' },
    { path: '/en/guide/image-resize', prefix: '/en', linkTo: 'compress' },
  ];

  for (const { path, prefix, linkTo } of INLINE) {
    test(`${path} — 본문에 인라인 링크 <a href=.../guide/${linkTo}>`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      const html = await page.content();
      // 가시 영역에 실제 앵커로 렌더
      expect(
        html.includes(`href="${prefix}/guide/${linkTo}"`),
        `${path} 에 인라인 링크 ${prefix}/guide/${linkTo} 누락`,
      ).toBe(true);
    });
  }

  test('JSON-LD·정적 HTML 에 원문 [..](guide:..) 구문이 새지 않음', async ({ page }) => {
    // 어떤 맞춤 가이드든 본문 링크 원문 구문이 렌더 결과(스크립트 포함)에 남으면 안 됨.
    for (const path of ['/guide/barcode', '/guide/pdf-to-word', '/en/guide/image-resize']) {
      await page.goto(path, { waitUntil: 'load' });
      const html = await page.content();
      expect(html.includes('](guide:'), `${path} 에 미렌더 인라인 구문 누출`).toBe(false);
    }
  });
});
