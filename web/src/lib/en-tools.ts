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

  // ── Round 2 expansion ────────────────────────────────────────────────────
  'color-palette': {
    name: 'Color Palette Generator',
    tagline: 'Build and export color palettes from a base color or image.',
    description:
      'Generate harmonious color palettes from a base color or an uploaded image, and export the swatches — all in your browser.',
    keywords: ['color palette generator', 'color scheme', 'palette from image', 'color combinations'],
  },
  'file-hash': {
    name: 'File Hash Checker (MD5 / SHA)',
    tagline: 'Compute MD5, SHA-1 and SHA-256 checksums for any file.',
    description:
      'Compute MD5, SHA-1, SHA-256 and SHA-512 checksums for any file to verify integrity — processed locally, never uploaded.',
    keywords: ['file hash', 'md5 checksum', 'sha256 hash', 'checksum calculator', 'verify file hash'],
  },
  jsonpath: {
    name: 'JSONPath Tester',
    tagline: 'Evaluate JSONPath expressions against your JSON live.',
    description:
      'Query JSON data with JSONPath expressions and see matching results instantly. Runs entirely in your browser.',
    keywords: ['jsonpath tester', 'jsonpath evaluator', 'query json', 'jsonpath online'],
  },
  'json-xml': {
    name: 'JSON ↔ XML Converter',
    tagline: 'Convert between JSON and XML in both directions.',
    description:
      'Convert JSON to XML and XML to JSON instantly in your browser, with formatting — no upload, no limits.',
    keywords: ['json to xml', 'xml to json', 'json xml converter', 'convert json xml'],
  },
  'md-table': {
    name: 'Markdown Table Generator',
    tagline: 'Build Markdown tables visually and copy the source.',
    description:
      'Create and edit Markdown tables in a visual grid, then copy clean Markdown source. Works fully offline.',
    keywords: ['markdown table generator', 'markdown table', 'md table maker', 'create markdown table'],
  },
  'text-case': {
    name: 'Text Case Converter',
    tagline: 'Convert text to UPPER, lower, Title, camelCase and more.',
    description:
      'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case instantly.',
    keywords: ['text case converter', 'uppercase lowercase', 'title case', 'camelcase converter', 'change case'],
  },
  'text-sort': {
    name: 'Line Sorter & Dedupe',
    tagline: 'Sort, reverse and deduplicate lines of text.',
    description:
      'Sort lines alphabetically or numerically, reverse, shuffle and remove duplicates — all locally in your browser.',
    keywords: ['sort lines', 'line sorter', 'alphabetize text', 'remove duplicate lines', 'text sorter'],
  },
  percentage: {
    name: 'Percentage Calculator',
    tagline: 'Work out percentages, increases and differences.',
    description:
      'Calculate percentages, percentage increase/decrease and percentage differences with simple inputs. Instant and free.',
    keywords: ['percentage calculator', 'percent calculator', 'percentage increase', 'percent of a number'],
  },
  'file-encrypt': {
    name: 'File Encryptor (AES)',
    tagline: 'Encrypt and decrypt files with AES, locally.',
    description:
      'Encrypt or decrypt any file with AES-GCM and a passphrase using the Web Crypto API. Your file never leaves your device.',
    keywords: ['encrypt file', 'aes file encryption', 'file encryptor', 'password protect file', 'decrypt file'],
  },
  'text-encrypt': {
    name: 'Text Encryptor (AES)',
    tagline: 'Encrypt and decrypt text with a passphrase.',
    description:
      'Encrypt or decrypt text with AES-GCM and a passphrase in your browser. Share secrets safely — nothing is uploaded.',
    keywords: ['encrypt text', 'text encryption', 'aes text', 'encrypt message', 'decrypt text'],
  },
  totp: {
    name: 'TOTP / 2FA Code Generator',
    tagline: 'Generate time-based one-time codes from a secret.',
    description:
      'Generate TOTP two-factor authentication codes from a secret key, with a live countdown. Computed locally, never uploaded.',
    keywords: ['totp generator', '2fa code', 'authenticator code', 'one time password', 'totp online'],
  },
  'rsa-keypair': {
    name: 'RSA Key Pair Generator',
    tagline: 'Generate RSA public/private key pairs in the browser.',
    description:
      'Generate RSA public and private key pairs (PEM) with the Web Crypto API entirely in your browser — keys never leave your device.',
    keywords: ['rsa key generator', 'generate rsa keypair', 'public private key', 'rsa pem generator'],
  },
  'pdf-protect': {
    name: 'Password-Protect PDF',
    tagline: 'Add a password and encryption to a PDF.',
    description:
      'Add password protection to a PDF so only people with the password can open it — encrypted locally, nothing uploaded.',
    keywords: ['password protect pdf', 'encrypt pdf', 'add password to pdf', 'lock pdf', 'secure pdf'],
  },
  'pdf-unlock': {
    name: 'Unlock PDF (Remove Password)',
    tagline: 'Remove a known password from a PDF.',
    description:
      'Remove the password from a PDF you can already open, so it opens without prompting. Processed entirely in your browser.',
    keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf', 'pdf password remover'],
  },
  'pdf-to-jpg': {
    name: 'PDF to JPG Converter',
    tagline: 'Convert PDF pages to JPG or PNG images.',
    description:
      'Convert each page of a PDF into a JPG or PNG image and download them — rendered locally with PDF.js, nothing uploaded.',
    keywords: ['pdf to jpg', 'pdf to image', 'pdf to png', 'convert pdf to jpg', 'pdf pages to images'],
  },
  'pdf-from-jpg': {
    name: 'JPG to PDF Converter',
    tagline: 'Combine images into a single PDF.',
    description:
      'Turn JPG, PNG and other images into a single PDF, with page size and order control. Processed in your browser.',
    keywords: ['jpg to pdf', 'image to pdf', 'png to pdf', 'photos to pdf', 'convert jpg to pdf'],
  },
  'pdf-to-word': {
    name: 'PDF to Word Converter',
    tagline: 'Extract a PDF into an editable Word document.',
    description:
      'Convert a PDF into an editable Word (DOCX) document right in your browser — your file is never uploaded to a server.',
    keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word', 'pdf to editable'],
  },
  'pdf-watermark': {
    name: 'Add Watermark to PDF',
    tagline: 'Stamp text or image watermarks across PDF pages.',
    description:
      'Add text or image watermarks to every page of a PDF, with opacity and position control. Processed locally.',
    keywords: ['pdf watermark', 'add watermark to pdf', 'stamp pdf', 'watermark pdf pages'],
  },
  'image-crop': {
    name: 'Crop Image',
    tagline: 'Crop photos to a region or fixed aspect ratio.',
    description:
      'Crop JPG, PNG and WebP images to any region or a fixed aspect ratio with a live preview — processed in your browser.',
    keywords: ['crop image', 'image cropper', 'crop photo', 'crop picture', 'aspect ratio crop'],
  },
  'image-rotate': {
    name: 'Rotate & Flip Image',
    tagline: 'Rotate or flip images by any angle.',
    description:
      'Rotate images by 90°, any custom angle, or flip them horizontally and vertically — fast and local, nothing uploaded.',
    keywords: ['rotate image', 'flip image', 'image rotator', 'turn photo', 'rotate picture'],
  },
  'image-watermark': {
    name: 'Add Watermark to Image',
    tagline: 'Overlay text or logo watermarks on images.',
    description:
      'Add text or logo watermarks to your images with adjustable opacity, size and position. Processed in your browser.',
    keywords: ['image watermark', 'add watermark to photo', 'watermark image', 'logo watermark'],
  },
  'image-svg-to-png': {
    name: 'SVG to PNG Converter',
    tagline: 'Rasterize SVG files to PNG at any size.',
    description:
      'Convert SVG vector files to PNG raster images at your chosen resolution, with transparency — all in your browser.',
    keywords: ['svg to png', 'convert svg', 'svg converter', 'rasterize svg', 'svg to image'],
  },
  'image-batch-compress': {
    name: 'Compress Images (Batch)',
    tagline: 'Shrink many images at once without quality loss.',
    description:
      'Compress JPG, PNG and WebP images in bulk to reduce file size with quality control, then download as a ZIP. Local only.',
    keywords: ['compress image', 'image compressor', 'reduce image size', 'batch compress images', 'shrink photos'],
  },
  'csv-json': {
    name: 'CSV to JSON Converter',
    tagline: 'Convert CSV to JSON and back, with header control.',
    description:
      'Convert CSV data to JSON and JSON to CSV with delimiter and header options. Instant, in-browser, nothing uploaded.',
    keywords: ['csv to json', 'json to csv', 'csv json converter', 'convert csv', 'csv parser'],
  },
  'yaml-json': {
    name: 'YAML ↔ JSON Converter',
    tagline: 'Convert between YAML and JSON in both directions.',
    description:
      'Convert YAML to JSON and JSON to YAML with validation and formatting, entirely in your browser.',
    keywords: ['yaml to json', 'json to yaml', 'yaml json converter', 'convert yaml'],
  },
  'docx-to-pdf': {
    name: 'Word (DOCX) to PDF',
    tagline: 'Convert Word documents to PDF locally.',
    description:
      'Convert Word DOCX documents into PDF files right in your browser, preserving layout — your file is never uploaded.',
    keywords: ['docx to pdf', 'word to pdf', 'convert word to pdf', 'doc to pdf'],
  },
  'epub-to-pdf': {
    name: 'EPUB to PDF Converter',
    tagline: 'Turn EPUB e-books into PDF files.',
    description:
      'Convert EPUB e-books into paginated PDF files locally — great for printing or archiving. Nothing leaves your browser.',
    keywords: ['epub to pdf', 'convert epub', 'ebook to pdf', 'epub converter'],
  },
  'audio-convert': {
    name: 'Audio Converter',
    tagline: 'Convert audio between MP3, WAV, OGG and more.',
    description:
      'Convert audio files between MP3, WAV, OGG, M4A and other formats with in-browser FFmpeg — nothing uploaded.',
    keywords: ['audio converter', 'convert mp3', 'wav to mp3', 'audio format converter', 'convert audio'],
  },
  'video-convert': {
    name: 'Video Converter',
    tagline: 'Convert video between MP4, WebM, MOV and more.',
    description:
      'Convert video files between MP4, WebM, MOV and other formats with in-browser FFmpeg — your video never leaves your device.',
    keywords: ['video converter', 'convert mp4', 'mov to mp4', 'webm converter', 'convert video'],
  },
  'video-to-audio': {
    name: 'Video to Audio (Extract MP3)',
    tagline: 'Extract the audio track from a video as MP3.',
    description:
      'Extract the audio from a video and save it as MP3 or another format, powered by in-browser FFmpeg. Nothing uploaded.',
    keywords: ['video to audio', 'video to mp3', 'extract audio from video', 'mp4 to mp3'],
  },
  'gif-maker': {
    name: 'GIF Maker',
    tagline: 'Create animated GIFs from images or clips.',
    description:
      'Make animated GIFs from a set of images or a video clip, with frame timing and size control — all in your browser.',
    keywords: ['gif maker', 'create gif', 'make animated gif', 'images to gif', 'gif creator'],
  },
  ocr: {
    name: 'Image to Text (OCR)',
    tagline: 'Extract text from images and scans.',
    description:
      'Recognize and extract text from images and scanned documents with Tesseract OCR (Korean + English) — processed locally.',
    keywords: ['image to text', 'ocr online', 'extract text from image', 'photo to text', 'free ocr'],
  },
  'remove-background': {
    name: 'Remove Image Background',
    tagline: 'Erase photo backgrounds automatically with AI.',
    description:
      'Remove the background from a photo automatically with an in-browser AI model and download a transparent PNG. Nothing uploaded.',
    keywords: ['remove background', 'background remover', 'transparent png', 'erase background', 'remove bg'],
  },
  'image-upscale': {
    name: 'AI Image Upscaler',
    tagline: 'Enlarge images without losing sharpness.',
    description:
      'Upscale and sharpen images with an in-browser AI super-resolution model — increase resolution while keeping detail. Local only.',
    keywords: ['image upscaler', 'ai upscale', 'enlarge image', 'increase image resolution', 'upscale photo'],
  },

  // ── Office / business tools (globally relevant subset) ───────────────────
  'vat-calc': {
    name: 'VAT / Sales Tax Calculator',
    tagline: 'Add or extract VAT from any amount, at any rate.',
    description:
      'Add VAT to a net amount, or extract it from a gross total, at any rate you set — instantly in your browser.',
    keywords: ['vat calculator', 'sales tax calculator', 'add vat', 'remove vat', 'reverse vat'],
  },
  'seal-stamp': {
    name: 'Round Stamp & Seal Generator',
    tagline: 'Create a round company stamp or seal as a transparent PNG.',
    description:
      'Generate a round stamp or seal from a company name or initials and download it as a transparent PNG for documents and signatures.',
    keywords: ['stamp generator', 'seal maker', 'round stamp', 'company stamp', 'digital stamp'],
  },
  'vcard-qr': {
    name: 'vCard QR Code Generator',
    tagline: 'Turn contact details into a scannable vCard QR code.',
    description:
      'Create a vCard QR code from a name, phone, email and company — scanning it saves the contact instantly. For business cards and email signatures.',
    keywords: ['vcard qr code', 'contact qr code', 'business card qr', 'qr contact card', 'vcard generator'],
  },
  'id-photo': {
    name: 'Passport & ID Photo Resizer',
    tagline: 'Crop and resize photos to passport or ID specs.',
    description:
      'Crop and resize a photo to passport, visa or ID specifications at print quality (300dpi) with a background color — all in your browser.',
    keywords: ['passport photo', 'id photo maker', 'passport photo size', 'visa photo', 'id photo resizer'],
  },
  redact: {
    name: 'Redact Sensitive Info',
    tagline: 'Auto-detect and mask emails, card and phone numbers.',
    description:
      'Automatically detect and mask emails, card numbers, phone numbers and IDs in pasted text before sharing or screenshotting. Processed locally.',
    keywords: ['redact text', 'mask sensitive data', 'hide personal info', 'redaction tool', 'mask phone number'],
  },
  'excel-formula': {
    name: 'Excel Formula Generator & Explainer',
    tagline: 'Build VLOOKUP/SUMIFS formulas, or explain any formula.',
    description:
      'Generate common Excel formulas (VLOOKUP, SUMIFS, IFERROR…) by filling in the blanks, or paste a formula to see each function explained.',
    keywords: ['excel formula generator', 'vlookup generator', 'excel formula explainer', 'sumifs formula', 'excel help'],
  },
  'scan-to-pdf': {
    name: 'Scan to PDF (Photo to PDF)',
    tagline: 'Turn document photos into one clean PDF.',
    description:
      'Turn photos of documents into a single clean PDF with contrast enhancement — a phone scanner in your browser. Nothing uploaded.',
    keywords: ['scan to pdf', 'photo to pdf', 'document scanner', 'images to pdf', 'jpg to pdf scanner'],
  },
  'pdf-to-excel': {
    name: 'PDF Table to Excel',
    tagline: 'Extract tables from a PDF into xlsx or CSV.',
    description:
      'Extract tables from a text-based PDF into Excel (xlsx) or CSV by detecting rows and columns — processed entirely in your browser.',
    keywords: ['pdf to excel', 'pdf table to excel', 'extract pdf table', 'pdf to xlsx', 'pdf to csv'],
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
