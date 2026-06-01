/**
 * Tools that run fully offline.
 *
 * Every tool on the site is browser-only, but some fetch a large WASM payload
 * from a CDN at runtime (FFmpeg, Tesseract, ONNX background-removal, HEIC).
 * Those won't work offline until that payload has been cached. The tools below
 * use only bundled JavaScript, the Canvas API, or the Web Crypto API — no
 * external runtime download — so they keep working with no connection once the
 * app shell is cached.
 *
 * This drives the "Offline" badge in the UI. The service worker (public/sw.js)
 * pre-caches these routes' HTML so popular offline tools open instantly even
 * when offline — keep its PRECACHE list in sync with this set.
 */

export const OFFLINE_TOOL_IDS: ReadonlySet<string> = new Set([
  // util
  'qr-code',
  'barcode',
  'base64',
  'json-format',
  'color-palette',
  'file-hash',
  'unit-converter',
  'percentage',
  'age-calc',
  'dday',
  // dev
  'jwt-decoder',
  'uuid-gen',
  'password-gen',
  'url-encoder',
  'url-parser',
  'color-converter',
  'timestamp-converter',
  'lorem-ipsum',
  'cron-explainer',
  'sql-format',
  'jsonpath',
  'json-xml',
  'md-table',
  // text
  'regex-tester',
  'text-diff',
  'text-count',
  'text-case',
  'text-sort',
  'html-entities',
  // docs (pure-JS parsers, bundled)
  'csv-json',
  'yaml-json',
  // security (Web Crypto, no network)
  'totp',
  'rsa-keypair',
  'text-encrypt',
  'file-encrypt',
  'redact',
  // 오피스 계산기·생성기 (순수 JS/Canvas, 외부 다운로드 없음)
  'salary-calc',
  'severance-calc',
  'leave-calc',
  'vat-calc',
  'seal-stamp',
  'vcard-qr',
  'id-photo',
  'excel-formula',
]);

export function isOfflineCapable(id: string): boolean {
  return OFFLINE_TOOL_IDS.has(id);
}
