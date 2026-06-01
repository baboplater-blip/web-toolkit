/**
 * Curated English copy for high-value tools.
 *
 * The registry (`lib/tools/registry.ts`) stores Korean titles/descriptions.
 * For the English SEO surface we don't translate all 157 tools — we curate the
 * tools with the strongest English search intent (generators, dev/text
 * utilities, and a few popular file converters) and write bespoke English copy.
 *
 * This single module powers BOTH English surfaces for a tool:
 *   - /en/tools/{id}  — transactional landing page ("free online X, no upload")
 *   - /en/guide/{id}  — informational how-to guide (built in guide-content-en.ts)
 *
 * To expand English coverage in a later round, add entries here — the pages,
 * sitemap, and catalog links pick them up automatically.
 */

export interface EnToolCopy {
  /** English display name — used as H1 / <title> seed. */
  name: string;
  /** One-line transactional tagline (under the H1). */
  tagline: string;
  /** Meta description seed (~140 chars). "free / no upload" handled by pages. */
  description: string;
  /** English search keywords for <meta keywords> and copy. */
  keywords: string[];
}

export const EN_TOOLS: Record<string, EnToolCopy> = {
  // ── Generators / utilities ──────────────────────────────────────────────
  'qr-code': {
    name: 'QR Code Generator & Reader',
    tagline: 'Create QR codes from text or URLs, and decode QR images instantly.',
    description:
      'Generate QR codes from any text or URL, or upload an image to decode an existing QR. Runs entirely in your browser.',
    keywords: ['qr code generator', 'qr code reader', 'create qr code', 'scan qr code', 'free qr code'],
  },
  barcode: {
    name: 'Barcode Generator',
    tagline: 'Generate EAN, UPC, Code128 and Code39 barcodes as PNG or SVG.',
    description:
      'Create EAN-13, UPC, Code128 and Code39 barcodes and download them as PNG or SVG — generated locally, nothing uploaded.',
    keywords: ['barcode generator', 'ean barcode', 'code128', 'upc barcode', 'create barcode'],
  },
  'password-gen': {
    name: 'Password Generator',
    tagline: "Strong, random passwords from your browser's secure crypto.",
    description:
      'Generate strong random passwords with custom length and character sets using the Web Crypto API. Nothing leaves your browser.',
    keywords: ['password generator', 'strong password', 'random password', 'secure password generator'],
  },
  'uuid-gen': {
    name: 'UUID Generator',
    tagline: 'Generate v4 and v7 UUIDs in bulk and copy with one click.',
    description:
      'Create cryptographically secure v4 and time-ordered v7 UUIDs in bulk and copy them instantly. Works fully offline.',
    keywords: ['uuid generator', 'guid generator', 'v4 uuid', 'v7 uuid', 'random uuid'],
  },
  base64: {
    name: 'Base64 Encode / Decode',
    tagline: 'Encode and decode Base64 text and files locally.',
    description:
      'Convert text or files to and from Base64 instantly in your browser — no upload, no size limits, no tracking.',
    keywords: ['base64 encode', 'base64 decode', 'base64 converter', 'encode base64', 'decode base64'],
  },
  'json-format': {
    name: 'JSON Formatter & Validator',
    tagline: 'Pretty-print, minify and validate JSON in real time.',
    description:
      'Beautify, minify and validate JSON with instant error messages — entirely in your browser, your data never uploaded.',
    keywords: ['json formatter', 'json validator', 'format json', 'json beautifier', 'minify json'],
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    tagline: 'Decode and inspect JWT header, payload and claims.',
    description:
      'Paste a JSON Web Token to inspect its header, payload and expiry. Decoding happens locally — your token never leaves the browser.',
    keywords: ['jwt decoder', 'decode jwt', 'json web token', 'jwt parser', 'jwt debugger'],
  },
  'url-encoder': {
    name: 'URL Encoder / Decoder',
    tagline: 'Percent-encode and decode URLs and query components.',
    description:
      'Percent-encode or decode full URLs and query string components instantly in your browser. No upload, no limits.',
    keywords: ['url encoder', 'url decoder', 'percent encoding', 'encode url', 'decode url'],
  },
  'color-converter': {
    name: 'Color Converter (HEX / RGB / HSL)',
    tagline: 'Convert colors between HEX, RGB, HSL and HSV with a live preview.',
    description:
      'Translate colors between HEX, RGB, HSL and HSV with a live swatch preview. Runs fully in your browser.',
    keywords: ['color converter', 'hex to rgb', 'rgb to hex', 'hsl converter', 'color code converter'],
  },
  'unit-converter': {
    name: 'Unit Converter',
    tagline: 'Convert length, weight, temperature, data sizes and more.',
    description:
      'Convert length, weight, temperature, area, volume, speed and data sizes instantly. Offline-capable, nothing uploaded.',
    keywords: ['unit converter', 'metric converter', 'length converter', 'temperature converter', 'measurement converter'],
  },
  'lorem-ipsum': {
    name: 'Lorem Ipsum Generator',
    tagline: 'Generate placeholder paragraphs, sentences or words.',
    description:
      'Produce placeholder Lorem Ipsum paragraphs, sentences or words for mockups and layouts, and copy with one click.',
    keywords: ['lorem ipsum generator', 'placeholder text', 'dummy text generator', 'filler text', 'lipsum'],
  },
  'timestamp-converter': {
    name: 'Unix Timestamp Converter',
    tagline: 'Convert Unix time to human dates and back, in any timezone.',
    description:
      'Turn epoch seconds or milliseconds into readable dates and back across timezones — instantly in your browser.',
    keywords: ['unix timestamp converter', 'epoch converter', 'timestamp to date', 'epoch time', 'unix time'],
  },
  // ── Text / dev ──────────────────────────────────────────────────────────
  'regex-tester': {
    name: 'Regex Tester',
    tagline: 'Test regular expressions live with match highlighting.',
    description:
      'Build and debug regular expressions with live match highlighting, capture groups and flags. Everything runs in your browser.',
    keywords: ['regex tester', 'regular expression tester', 'regex online', 'test regex', 'regex debugger'],
  },
  'text-diff': {
    name: 'Text Diff Checker',
    tagline: 'Compare two texts and highlight every difference.',
    description:
      'Compare two blocks of text or code side by side and highlight added, removed and changed lines — processed locally.',
    keywords: ['text diff', 'diff checker', 'compare text', 'text comparison', 'difference checker'],
  },
  'text-count': {
    name: 'Word & Character Counter',
    tagline: 'Count words, characters, sentences and reading time live.',
    description:
      'Get live counts of words, characters, sentences, paragraphs and estimated reading time as you type. Nothing uploaded.',
    keywords: ['word counter', 'character counter', 'count words', 'text counter', 'letter counter'],
  },
  'sql-format': {
    name: 'SQL Formatter',
    tagline: 'Beautify and standardize SQL queries across dialects.',
    description:
      'Beautify and standardize SQL queries across major dialects with one click, fully in your browser.',
    keywords: ['sql formatter', 'format sql', 'beautify sql', 'sql beautifier', 'pretty print sql'],
  },
  'cron-explainer': {
    name: 'Cron Expression Explainer',
    tagline: 'Translate cron schedules into plain English.',
    description:
      'Paste a cron schedule to see when it runs in plain English, plus the upcoming run times. Runs locally.',
    keywords: ['cron explainer', 'cron expression', 'crontab generator', 'cron schedule', 'cron parser'],
  },
  'html-entities': {
    name: 'HTML Entity Encoder / Decoder',
    tagline: 'Encode and decode HTML entities safely.',
    description:
      'Convert special characters to and from HTML entities to prevent rendering and injection issues — processed in your browser.',
    keywords: ['html entities', 'html encode', 'html decode', 'escape html', 'html entity converter'],
  },
  // ── Popular file converters (guides funnel to the in-browser tool) ───────
  'pdf-merge': {
    name: 'Merge PDF',
    tagline: 'Combine multiple PDF files into one — nothing uploaded.',
    description:
      'Combine and reorder multiple PDFs into a single document right in your browser. Your files never leave your device.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'pdf merger', 'merge pdf files'],
  },
  'pdf-split': {
    name: 'Split PDF',
    tagline: 'Extract pages or split a PDF into separate files.',
    description:
      'Extract specific pages or break a PDF into separate files locally — nothing is uploaded to any server.',
    keywords: ['split pdf', 'extract pdf pages', 'pdf splitter', 'separate pdf', 'split pdf pages'],
  },
  'image-resize': {
    name: 'Resize Image',
    tagline: 'Resize images by exact pixels or percentage.',
    description:
      'Resize JPG, PNG, WebP and GIF images by pixels or percentage with aspect-ratio lock — processed entirely in your browser.',
    keywords: ['resize image', 'image resizer', 'resize photo', 'change image size', 'image size changer'],
  },
  'image-convert': {
    name: 'Image Converter (PNG / JPG / WebP)',
    tagline: 'Convert between PNG, JPG, WebP and more.',
    description:
      'Convert images between PNG, JPG, WebP and other formats locally — fast, batch-capable, with nothing uploaded.',
    keywords: ['image converter', 'png to jpg', 'jpg to webp', 'convert image', 'webp converter'],
  },
  'image-heic-to-jpg': {
    name: 'HEIC to JPG Converter',
    tagline: 'Convert iPhone HEIC photos to universal JPG.',
    description:
      'Turn iPhone HEIC/HEIF photos into universal JPG images right in your browser — no upload, batch supported.',
    keywords: ['heic to jpg', 'heic converter', 'convert heic', 'iphone photo converter', 'heic to jpeg'],
  },
  'video-to-gif': {
    name: 'Video to GIF Converter',
    tagline: 'Turn video clips into optimized animated GIFs.',
    description:
      'Turn MP4 and other clips into optimized animated GIFs with custom fps and size — powered by in-browser FFmpeg, nothing uploaded.',
    keywords: ['video to gif', 'mp4 to gif', 'convert video to gif', 'make gif from video', 'gif maker'],
  },
};

/** IDs that have curated English copy, in insertion order. */
export const EN_TOOL_IDS: string[] = Object.keys(EN_TOOLS);

const EN_TOOL_ID_SET = new Set(EN_TOOL_IDS);

export function getEnCopy(id: string): EnToolCopy | undefined {
  return EN_TOOLS[id];
}

export function hasEnCopy(id: string): boolean {
  return EN_TOOL_ID_SET.has(id);
}
