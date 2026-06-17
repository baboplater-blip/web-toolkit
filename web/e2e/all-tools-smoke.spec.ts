import { test, expect } from '@playwright/test';

/**
 * 전 도구(286) + 주요 허브 라우트 마운트 스모크.
 *
 * 헤더 스타일(ToolHeader vs 표준형 sticky 헤더)에 무관하게 보편적으로 검증한다:
 *   ① HTTP 200 응답(404·500 아님)
 *   ② 페이지에 heading(h1 등)이 렌더됨
 *   ③ 클라이언트 마운트/하이드레이션 중 uncaught 에러(pageerror) 0
 *
 * 마운트 시 throw(잘못된 import·초기 상태 버그·하이드레이션 깨짐)가 가장 흔한
 * 회귀라 이를 전 도구에 대해 저비용으로 포착한다. (기능 단언은 new-tools.spec 참조)
 *
 * TOOL_ROUTES 는 registry.ts 의 href 스냅샷이다. 도구 추가 시 갱신:
 *   grep -oE "href: '/tools/[^']+'" src/lib/tools/registry.ts | sed ... | sort
 */

const HUB_ROUTES: string[] = [
  '/',
  '/tools',
  '/guide',
  '/guide/category/pdf',
  '/en',
  '/en/tools',
  '/ja/tools',
  '/zh/tools',
];

const TOOL_ROUTES: string[] = [
  '/tools/ai/language-detect',
  '/tools/ai/sentiment',
  '/tools/ai/summarize',
  '/tools/audio/compress',
  '/tools/audio/convert',
  '/tools/audio/fade',
  '/tools/audio/from-video',
  '/tools/audio/merge',
  '/tools/audio/normalize',
  '/tools/audio/record',
  '/tools/audio/reverse',
  '/tools/audio/silence-trim',
  '/tools/audio/speed',
  '/tools/audio/tone',
  '/tools/audio/trim',
  '/tools/audio/volume',
  '/tools/compress',
  '/tools/dev/base-converter',
  '/tools/dev/box-shadow',
  '/tools/dev/chart',
  '/tools/dev/chmod-calc',
  '/tools/dev/color',
  '/tools/dev/color-contrast',
  '/tools/dev/color-name',
  '/tools/dev/cron',
  '/tools/dev/css-gradient',
  '/tools/dev/css-units',
  '/tools/dev/cubic-bezier',
  '/tools/dev/curl-to-code',
  '/tools/dev/dotenv-json',
  '/tools/dev/gitignore',
  '/tools/dev/html-format',
  '/tools/dev/http-status',
  '/tools/dev/json-diff',
  '/tools/dev/json-to-go',
  '/tools/dev/json-to-ts',
  '/tools/dev/json-xml',
  '/tools/dev/jsonpath',
  '/tools/dev/jwt',
  '/tools/dev/lorem',
  '/tools/dev/md-table',
  '/tools/dev/mock-data',
  '/tools/dev/password',
  '/tools/dev/sql-format',
  '/tools/dev/svg-optimize',
  '/tools/dev/timestamp',
  '/tools/dev/url',
  '/tools/dev/url-parser',
  '/tools/dev/user-agent-parser',
  '/tools/dev/uuid',
  '/tools/docs/csv-diff',
  '/tools/docs/csv-json',
  '/tools/docs/csv-merge',
  '/tools/docs/csv-split',
  '/tools/docs/csv-to-md',
  '/tools/docs/csv-viewer',
  '/tools/docs/docx-to-md',
  '/tools/docs/docx-to-pdf',
  '/tools/docs/epub-compress',
  '/tools/docs/epub-cover-extract',
  '/tools/docs/epub-cover-replace',
  '/tools/docs/epub-images-extract',
  '/tools/docs/epub-merge',
  '/tools/docs/epub-metadata',
  '/tools/docs/epub-reader',
  '/tools/docs/epub-split',
  '/tools/docs/epub-stats',
  '/tools/docs/epub-to-html',
  '/tools/docs/epub-to-md',
  '/tools/docs/epub-to-pdf',
  '/tools/docs/epub-to-txt',
  '/tools/docs/epub-validate',
  '/tools/docs/excel-formula',
  '/tools/docs/hwpx-viewer',
  '/tools/docs/ical',
  '/tools/docs/ini-json',
  '/tools/docs/json-escape',
  '/tools/docs/json-flatten',
  '/tools/docs/jsonl-viewer',
  '/tools/docs/markdown-preview',
  '/tools/docs/markdown-toc',
  '/tools/docs/md-html',
  '/tools/docs/md-to-epub',
  '/tools/docs/toml-json',
  '/tools/docs/txt-to-epub',
  '/tools/docs/vcard-parse',
  '/tools/docs/xlsx-convert',
  '/tools/docs/xml-format',
  '/tools/docs/yaml-json',
  '/tools/gif/crop',
  '/tools/gif/effects',
  '/tools/gif/maker',
  '/tools/gif/optimize',
  '/tools/gif/resize',
  '/tools/gif/text',
  '/tools/gif/trim',
  '/tools/image/ascii-art',
  '/tools/image/avatar',
  '/tools/image/base64',
  '/tools/image/batch-compress',
  '/tools/image/batch-watermark',
  '/tools/image/blur',
  '/tools/image/blur-face',
  '/tools/image/border',
  '/tools/image/collage',
  '/tools/image/color-adjust',
  '/tools/image/color-picker',
  '/tools/image/convert',
  '/tools/image/crop',
  '/tools/image/denoise',
  '/tools/image/diff',
  '/tools/image/duotone',
  '/tools/image/exif-batch',
  '/tools/image/exif-strip',
  '/tools/image/exif-view',
  '/tools/image/favicon',
  '/tools/image/filters',
  '/tools/image/flip',
  '/tools/image/gradient',
  '/tools/image/heic-to-jpg',
  '/tools/image/histogram',
  '/tools/image/id-photo',
  '/tools/image/meme',
  '/tools/image/pixelate',
  '/tools/image/placeholder',
  '/tools/image/remove-background',
  '/tools/image/resize',
  '/tools/image/rotate',
  '/tools/image/round-corners',
  '/tools/image/seal',
  '/tools/image/slideshow',
  '/tools/image/split',
  '/tools/image/svg-to-png',
  '/tools/image/target-size',
  '/tools/image/upscale',
  '/tools/image/watermark',
  '/tools/ocr',
  '/tools/pdf/background',
  '/tools/pdf/booklet',
  '/tools/pdf/bookmarks',
  '/tools/pdf/compare',
  '/tools/pdf/crop',
  '/tools/pdf/form-fill',
  '/tools/pdf/from-html',
  '/tools/pdf/from-jpg',
  '/tools/pdf/image-extract',
  '/tools/pdf/insert',
  '/tools/pdf/linearize',
  '/tools/pdf/merge',
  '/tools/pdf/metadata',
  '/tools/pdf/nup',
  '/tools/pdf/organize',
  '/tools/pdf/page-numbers',
  '/tools/pdf/previews',
  '/tools/pdf/protect',
  '/tools/pdf/repair',
  '/tools/pdf/reverse',
  '/tools/pdf/rotate',
  '/tools/pdf/scan',
  '/tools/pdf/search',
  '/tools/pdf/sign',
  '/tools/pdf/split',
  '/tools/pdf/stats',
  '/tools/pdf/to-epub',
  '/tools/pdf/to-excel',
  '/tools/pdf/to-html',
  '/tools/pdf/to-jpg',
  '/tools/pdf/to-md',
  '/tools/pdf/to-txt',
  '/tools/pdf/to-word',
  '/tools/pdf/unlock',
  '/tools/pdf/visual-diff',
  '/tools/pdf/watermark',
  '/tools/security/base32',
  '/tools/security/bcrypt',
  '/tools/security/diceware',
  '/tools/security/file-encrypt',
  '/tools/security/hmac-gen',
  '/tools/security/htpasswd',
  '/tools/security/jwt-encoder',
  '/tools/security/password-strength',
  '/tools/security/pdf-flatten',
  '/tools/security/redact',
  '/tools/security/rsa-keypair',
  '/tools/security/secret-split',
  '/tools/security/text-encrypt',
  '/tools/security/text-hash',
  '/tools/security/totp',
  '/tools/security/wifi-qr',
  '/tools/text/ascii-banner',
  '/tools/text/binary',
  '/tools/text/bionic-reading',
  '/tools/text/caesar',
  '/tools/text/case',
  '/tools/text/column-extract',
  '/tools/text/count',
  '/tools/text/dedupe-lines',
  '/tools/text/diff',
  '/tools/text/fancy',
  '/tools/text/hanja',
  '/tools/text/html-entities',
  '/tools/text/jamo',
  '/tools/text/keyboard-flip',
  '/tools/text/ko-sort',
  '/tools/text/ko-spacing',
  '/tools/text/ko-spellcheck',
  '/tools/text/line-numbers',
  '/tools/text/manuscript-count',
  '/tools/text/markdown-stats',
  '/tools/text/morse',
  '/tools/text/nato',
  '/tools/text/regex',
  '/tools/text/replace',
  '/tools/text/reverse-text',
  '/tools/text/slugify',
  '/tools/text/sort',
  '/tools/text/subtitle-convert',
  '/tools/text/subtitle-edit',
  '/tools/text/syllable-spread',
  '/tools/text/text-repeat',
  '/tools/text/tts',
  '/tools/text/whitespace',
  '/tools/text/word-frequency',
  '/tools/text/zalgo-text',
  '/tools/util/age',
  '/tools/util/aspect-ratio',
  '/tools/util/barcode',
  '/tools/util/base64',
  '/tools/util/bmi',
  '/tools/util/coin-flip',
  '/tools/util/color-blind',
  '/tools/util/date-diff',
  '/tools/util/dday',
  '/tools/util/dice-roller',
  '/tools/util/discount',
  '/tools/util/fuel-cost',
  '/tools/util/gpa',
  '/tools/util/hash',
  '/tools/util/json',
  '/tools/util/leave',
  '/tools/util/loan',
  '/tools/util/lottery-number',
  '/tools/util/number-to-words',
  '/tools/util/palette',
  '/tools/util/percentage',
  '/tools/util/pomodoro',
  '/tools/util/qr',
  '/tools/util/qr-logo',
  '/tools/util/random-number',
  '/tools/util/random-pick',
  '/tools/util/reaction-time',
  '/tools/util/roman-numeral',
  '/tools/util/salary',
  '/tools/util/scientific-calc',
  '/tools/util/screen-ruler',
  '/tools/util/severance',
  '/tools/util/subnet-calc',
  '/tools/util/tdee',
  '/tools/util/timer-stopwatch',
  '/tools/util/timezone',
  '/tools/util/tip-calc',
  '/tools/util/typing-speed',
  '/tools/util/unit',
  '/tools/util/vat',
  '/tools/util/vcard-qr',
  '/tools/video/audio-replace',
  '/tools/video/blur-face',
  '/tools/video/burn-subtitle',
  '/tools/video/compress',
  '/tools/video/convert',
  '/tools/video/crop',
  '/tools/video/extract-frames',
  '/tools/video/flip',
  '/tools/video/loop',
  '/tools/video/merge',
  '/tools/video/mute',
  '/tools/video/poster',
  '/tools/video/resize',
  '/tools/video/reverse',
  '/tools/video/rotate',
  '/tools/video/screen-record',
  '/tools/video/speed',
  '/tools/video/to-gif',
  '/tools/video/trim',
  '/tools/video/watermark',
  '/tools/video/webcam',
];

/** 마운트 시 무관한 외부 노이즈(확장프로그램·SW 등)는 회귀로 보지 않는다. */
function isBenign(message: string): boolean {
  return /ResizeObserver loop/i.test(message) || /^Script error\.?$/i.test(message);
}

/**
 * 하이드레이션 불일치 시그니처.
 * 개발 모드에서는 pageerror 로 throw 되지만, **프로덕션 빌드(정적 out 서빙, CI)** 에서는
 * throw 되지 않고 React 가 console.error 로 축약 코드(#418 HTML 불일치 / #423·#425 텍스트
 * 불일치)만 남긴다. CI 가 정적 산출물을 serve 하므로 console 까지 감시해야 회귀를 잡는다.
 */
function isHydrationError(message: string): boolean {
  return (
    /Minified React error #(418|421|423|425)/.test(message) ||
    /react\.dev\/errors\/(418|421|423|425)/.test(message) ||
    /Hydration failed/i.test(message) ||
    /did not match the (client|server)/i.test(message) ||
    /server rendered (HTML|text) didn't match/i.test(message)
  );
}

async function smoke(page: import('@playwright/test').Page, route: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => {
    if (!isBenign(e.message)) errors.push(e.message);
  });
  // 프로덕션 React 는 하이드레이션 불일치를 throw 하지 않고 console.error 로만 남긴다.
  page.on('console', (msg) => {
    if (msg.type() === 'error' && isHydrationError(msg.text())) {
      errors.push(`[hydration] ${msg.text()}`);
    }
  });

  const resp = await page.goto(route, { waitUntil: 'load' });
  expect(resp?.status() ?? 200, `HTTP status for ${route}`).toBeLessThan(400);

  // 헤더 스타일 무관: 페이지에 heading 이 하나라도 보여야 함
  await expect(page.getByRole('heading').first()).toBeVisible();
  // 하이드레이션 등 늦게 발생하는 콘솔 에러를 수집할 짧은 여유.
  await page.waitForTimeout(120);

  expect(errors, `error on ${route}: ${errors.join(' | ')}`).toEqual([]);
}

test.describe('허브 라우트 스모크', () => {
  for (const route of HUB_ROUTES) {
    test(`hub ${route}`, async ({ page }) => {
      await smoke(page, route);
    });
  }
});

test.describe('전 도구 마운트 스모크 (286)', () => {
  for (const route of TOOL_ROUTES) {
    test(route, async ({ page }) => {
      await smoke(page, route);
    });
  }
});
