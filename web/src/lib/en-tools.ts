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

  // ── Full coverage expansion (2026-06) ───────────────────────────────────
  // PDF
  'html-to-pdf': {
    name: 'HTML to PDF Converter',
    tagline: 'Turn HTML code into a PDF with CSS and images.',
    description:
      'Convert HTML markup into a PDF with CSS styling and inline images, rendered entirely in your browser — nothing uploaded.',
    keywords: ['html to pdf', 'convert html to pdf', 'webpage to pdf', 'html pdf converter'],
  },
  'pdf-background': {
    name: 'Add Background to PDF',
    tagline: 'Lay a color or image behind every page.',
    description:
      'Add a background color or image to every page of a PDF for watermark or stationery styles — processed locally, no upload.',
    keywords: ['pdf background', 'add background to pdf', 'pdf watermark background', 'pdf stationery'],
  },
  'pdf-bookmarks': {
    name: 'PDF Bookmarks Viewer',
    tagline: 'View the outline tree and export it to Markdown.',
    description:
      'Show a PDF’s bookmark/outline tree and export it as Markdown — read the table of contents at a glance in your browser.',
    keywords: ['pdf bookmarks', 'pdf outline', 'pdf table of contents', 'view pdf bookmarks'],
  },
  'pdf-compare': {
    name: 'Compare PDF Text',
    tagline: 'Diff two PDFs line by line.',
    description:
      'Extract the text from two PDFs and highlight added, removed and changed lines — a text diff for documents, all in your browser.',
    keywords: ['compare pdf', 'pdf diff', 'pdf text compare', 'compare two pdfs'],
  },
  'pdf-crop': {
    name: 'Crop PDF Margins',
    tagline: 'Trim page boxes to remove white margins.',
    description:
      'Crop the page box of a PDF to remove unwanted margins or white space — cleaner pages for reading and printing. Processed locally.',
    keywords: ['crop pdf', 'pdf margins', 'trim pdf', 'remove pdf white space'],
  },
  'pdf-flatten': {
    name: 'Flatten PDF',
    tagline: 'Lock form fields and remove annotations for printing.',
    description:
      'Bake form values into the page and strip annotations and links to finalize a PDF for print or distribution — flattens editable fields. No upload.',
    keywords: ['flatten pdf', 'flatten pdf form', 'lock pdf fields', 'finalize pdf'],
  },
  'pdf-form-fill': {
    name: 'Fill PDF Forms',
    tagline: 'Fill AcroForm text, checkbox and dropdown fields.',
    description:
      'Fill in a PDF’s AcroForm text, checkbox, radio and dropdown fields and save the result — entirely in your browser, nothing uploaded.',
    keywords: ['fill pdf form', 'pdf form filler', 'acroform', 'complete pdf form'],
  },
  'pdf-image-extract': {
    name: 'Extract Images from PDF',
    tagline: 'Pull embedded images out as PNGs in a ZIP.',
    description:
      'Extract the images embedded in a PDF’s pages and download them as PNGs in a ZIP — all processed locally, no upload.',
    keywords: ['extract images from pdf', 'pdf image extractor', 'pdf to images', 'save pdf images'],
  },
  'pdf-insert': {
    name: 'Insert Pages into PDF',
    tagline: 'Insert another PDF’s pages at any position.',
    description:
      'Insert pages from another PDF at the front, back or after a specific page — merge selectively, all in your browser.',
    keywords: ['insert pdf pages', 'add pages to pdf', 'merge pdf at position', 'pdf insert'],
  },
  'pdf-linearize': {
    name: 'Optimize PDF for Web',
    tagline: 'Remove duplicate objects and rebuild compression.',
    description:
      'Clean up a PDF by removing duplicate objects and rebuilding compressed streams for a smaller, web-friendly file. Processed locally.',
    keywords: ['optimize pdf', 'linearize pdf', 'compress pdf web', 'pdf web optimized'],
  },
  'pdf-metadata': {
    name: 'Edit PDF Metadata',
    tagline: 'Change title, author, subject and keywords.',
    description:
      'Edit a PDF’s title, author, subject and keyword metadata in your browser — tidy document properties before sharing. No upload.',
    keywords: ['pdf metadata', 'edit pdf properties', 'change pdf author', 'pdf title editor'],
  },
  'pdf-nup': {
    name: 'PDF N-up (Pages per Sheet)',
    tagline: 'Place 2/4/6/9 pages on one sheet.',
    description:
      'Arrange 2, 4, 6 or 9 PDF pages onto a single sheet for compact printing or proof sheets — processed entirely in your browser.',
    keywords: ['pdf n-up', 'pages per sheet', 'multiple pages on one page pdf', 'pdf booklet'],
  },
  'pdf-organize': {
    name: 'Organize PDF Pages',
    tagline: 'Reorder, delete and duplicate pages by thumbnail.',
    description:
      'Reorder, delete and duplicate PDF pages visually with thumbnails, then export — all in your browser, your file never uploaded.',
    keywords: ['organize pdf', 'reorder pdf pages', 'delete pdf pages', 'rearrange pdf'],
  },
  'pdf-page-numbers': {
    name: 'Add Page Numbers to PDF',
    tagline: 'Stamp page numbers across the whole document.',
    description:
      'Add page numbers to every page of a PDF with position and format options — processed locally, nothing uploaded.',
    keywords: ['add page numbers to pdf', 'pdf page numbers', 'number pdf pages', 'pdf pagination'],
  },
  'pdf-previews': {
    name: 'PDF Pages to PNG',
    tagline: 'Render every page to PNG/JPG in a ZIP.',
    description:
      'Render all pages of a PDF to PNG or JPG images and download them in a ZIP — great for thumbnails and previews. All local.',
    keywords: ['pdf to png', 'pdf pages to image', 'pdf thumbnails', 'render pdf pages'],
  },
  'pdf-repair': {
    name: 'Repair PDF',
    tagline: 'Two-stage recovery for corrupted PDFs.',
    description:
      'Recover a damaged PDF with structure restoration and a raster reassembly fallback — fix files that won’t open, all in your browser.',
    keywords: ['repair pdf', 'fix corrupted pdf', 'recover pdf', 'pdf repair tool'],
  },
  'pdf-rotate': {
    name: 'Rotate PDF Pages',
    tagline: 'Rotate selected pages 90/180/270 degrees.',
    description:
      'Rotate chosen PDF pages by 90, 180 or 270 degrees and save — fix sideways scans and mixed orientations in your browser.',
    keywords: ['rotate pdf', 'rotate pdf pages', 'turn pdf page', 'fix pdf orientation'],
  },
  'pdf-search': {
    name: 'Search Multiple PDFs',
    tagline: 'Find a keyword across many PDFs at once.',
    description:
      'Search a keyword across several PDFs at once and see each match in context — find documents fast, all processed locally.',
    keywords: ['search pdf', 'search multiple pdfs', 'pdf keyword search', 'find text in pdf'],
  },
  'pdf-sign': {
    name: 'Sign PDF',
    tagline: 'Draw your signature and place it on a PDF.',
    description:
      'Draw a signature with your mouse or touch and drop it onto a PDF — sign documents in your browser, nothing uploaded.',
    keywords: ['sign pdf', 'pdf signature', 'electronic signature pdf', 'add signature to pdf'],
  },
  'pdf-stats': {
    name: 'PDF Statistics',
    tagline: 'Analyze pages, words, fonts and metadata.',
    description:
      'Analyze a PDF’s pages, word and character counts, fonts, outline and metadata — a full document report, all in your browser.',
    keywords: ['pdf statistics', 'pdf word count', 'pdf analyzer', 'pdf info'],
  },
  'pdf-to-epub': {
    name: 'PDF to EPUB Converter',
    tagline: 'Turn a PDF into a reflowable EPUB e-book.',
    description:
      'Extract a PDF’s text into a chaptered EPUB so it reflows on phones and e-readers — convert in your browser, no upload.',
    keywords: ['pdf to epub', 'convert pdf to epub', 'pdf to ebook', 'pdf ereader'],
  },
  'pdf-to-html': {
    name: 'PDF to HTML Converter',
    tagline: 'Convert a PDF into a structured HTML page.',
    description:
      'Convert a PDF’s text into an HTML page with heading and paragraph structure — processed entirely in your browser.',
    keywords: ['pdf to html', 'convert pdf to html', 'pdf to webpage', 'pdf html converter'],
  },
  'pdf-to-md': {
    name: 'PDF to Markdown Converter',
    tagline: 'Convert a PDF into structured Markdown.',
    description:
      'Convert a PDF into Markdown, inferring # / ## / ### headings from font sizes — great for notes and docs, all in your browser.',
    keywords: ['pdf to markdown', 'convert pdf to md', 'pdf to text markdown', 'pdf md converter'],
  },
  'pdf-to-txt': {
    name: 'PDF to Text Converter',
    tagline: 'Extract a PDF’s text into a plain .txt file.',
    description:
      'Extract all text from a PDF and save it as a plain text file — quick copy and reuse, processed locally with no upload.',
    keywords: ['pdf to text', 'pdf to txt', 'extract text from pdf', 'convert pdf to text'],
  },
  'pdf-visual-diff': {
    name: 'PDF Visual Compare',
    tagline: 'Compare pages pixel by pixel.',
    description:
      'Compare the same page of two PDFs pixel by pixel and highlight visual differences — catch layout changes, all in your browser.',
    keywords: ['pdf visual diff', 'compare pdf pages', 'pdf pixel compare', 'pdf visual compare'],
  },

  // Image
  'blur-face': {
    name: 'Blur Faces & License Plates',
    tagline: 'Auto-detect faces and cover them with blur or mosaic.',
    description:
      'Automatically detect faces with AI and cover them with blur, mosaic, emoji or a black bar — batch folders, invert and plate modes. All local.',
    keywords: ['blur face', 'blur faces in photo', 'mosaic face', 'anonymize photo', 'blur license plate'],
  },
  compress: {
    name: 'Compress Files (Image & PDF)',
    tagline: 'Shrink images and PDFs in your browser.',
    description:
      'Compress images and PDFs to smaller file sizes right in your browser — faster uploads and email, nothing ever uploaded.',
    keywords: ['compress file', 'compress image', 'compress pdf', 'reduce file size', 'shrink file'],
  },
  'image-ascii-art': {
    name: 'Image to ASCII Art',
    tagline: 'Turn a photo into text characters.',
    description:
      'Convert an image into ASCII art made of text characters and export as TXT or PNG — a fun, retro effect, all in your browser.',
    keywords: ['image to ascii', 'ascii art generator', 'photo to ascii', 'text art from image'],
  },
  'image-batch-watermark': {
    name: 'Batch Watermark Images',
    tagline: 'Apply one watermark to many photos at once.',
    description:
      'Add the same text or logo watermark to many images at once and download them together — protect a whole set in your browser.',
    keywords: ['batch watermark', 'watermark multiple images', 'bulk watermark', 'add watermark to photos'],
  },
  'image-collage': {
    name: 'Image Collage Maker',
    tagline: 'Combine several images into one grid.',
    description:
      'Arrange several images into a grid and export a single JPG collage — quick photo grids, all processed in your browser.',
    keywords: ['collage maker', 'photo collage', 'image grid', 'combine images', 'picture collage'],
  },
  'image-color-adjust': {
    name: 'Adjust Image Colors',
    tagline: 'Brightness, contrast, saturation and more — live.',
    description:
      'Tune brightness, contrast, saturation, hue, blur, sepia and invert with a live preview — quick photo edits in your browser.',
    keywords: ['adjust image color', 'brightness contrast', 'photo color editor', 'image saturation'],
  },
  'image-denoise': {
    name: 'Reduce Image Noise',
    tagline: 'Smooth out grain with a median filter.',
    description:
      'Reduce noise and grain in a photo with a median filter for a cleaner image — processed entirely in your browser.',
    keywords: ['reduce image noise', 'denoise photo', 'remove grain', 'image noise reduction'],
  },
  'image-diff': {
    name: 'Image Visual Compare',
    tagline: 'Highlight pixel differences between two images.',
    description:
      'Compare two images pixel by pixel and mark the differences in red — spot edits and changes, all in your browser.',
    keywords: ['image diff', 'compare images', 'image pixel compare', 'spot the difference tool'],
  },
  'image-exif-batch': {
    name: 'Batch Strip EXIF',
    tagline: 'Remove GPS and camera data from many photos.',
    description:
      'Remove GPS location and camera EXIF data from many photos at once before sharing — protect your privacy, all local.',
    keywords: ['batch strip exif', 'remove exif from photos', 'bulk remove gps', 'clear photo metadata'],
  },
  'image-exif-strip': {
    name: 'Strip EXIF Data',
    tagline: 'Remove location and camera info from a photo.',
    description:
      'Remove GPS and camera EXIF metadata from a photo to protect your privacy before posting — processed locally, no upload.',
    keywords: ['remove exif', 'strip exif data', 'remove photo gps', 'delete image metadata'],
  },
  'image-exif-view': {
    name: 'EXIF Viewer',
    tagline: 'See a photo’s camera, GPS and capture info.',
    description:
      'View a photo’s EXIF metadata — camera model, settings, GPS location and capture time — entirely in your browser.',
    keywords: ['exif viewer', 'view photo metadata', 'check image gps', 'photo exif data'],
  },
  'image-pixelate': {
    name: 'Pixelate / Mosaic Image',
    tagline: 'Mosaic the whole image or just a region.',
    description:
      'Apply a mosaic/pixelation effect to an entire image or a selected region to hide sensitive parts — all in your browser.',
    keywords: ['pixelate image', 'mosaic photo', 'censor image', 'blur part of image'],
  },
  'image-slideshow': {
    name: 'Images to Slideshow Video',
    tagline: 'Turn photos into an MP4 slideshow.',
    description:
      'Combine several images into an MP4 slideshow video with timing control — share a photo reel, made in your browser.',
    keywords: ['image slideshow', 'photos to video', 'slideshow maker', 'images to mp4'],
  },

  // GIF
  'gif-crop': {
    name: 'Crop GIF',
    tagline: 'Crop an animated GIF to a region.',
    description:
      'Crop an animated GIF down to a chosen region across all frames — keep just the part you want, all in your browser.',
    keywords: ['crop gif', 'gif crop tool', 'trim gif area', 'edit gif'],
  },
  'gif-effects': {
    name: 'GIF Effects',
    tagline: 'Reverse, speed up or ping-pong a GIF.',
    description:
      'Apply reverse, speed-change and ping-pong loop effects to an animated GIF — fun loops made entirely in your browser.',
    keywords: ['gif effects', 'reverse gif', 'gif speed', 'ping pong gif'],
  },
  'gif-optimize': {
    name: 'Optimize GIF',
    tagline: 'Shrink a GIF with palette and frame dropping.',
    description:
      'Reduce a GIF’s file size by optimizing its palette and dropping frames — smaller loops that still play smoothly. All local.',
    keywords: ['optimize gif', 'compress gif', 'reduce gif size', 'shrink gif'],
  },
  'gif-resize': {
    name: 'Resize GIF',
    tagline: 'Change a GIF’s dimensions, keep the loop.',
    description:
      'Resize an animated GIF to new dimensions with or without aspect ratio lock, shrinking the file size too — all in your browser.',
    keywords: ['resize gif', 'change gif size', 'scale gif', 'gif dimensions'],
  },
  'gif-text': {
    name: 'Add Text to GIF',
    tagline: 'Caption an animated GIF.',
    description:
      'Add text or captions that show across an animated GIF — meme captions and labels, all rendered in your browser.',
    keywords: ['add text to gif', 'gif caption', 'caption gif', 'gif text'],
  },
  'gif-trim': {
    name: 'Trim GIF',
    tagline: 'Cut an animated GIF to a time range.',
    description:
      'Trim an animated GIF to a start/end time and save just that range — drop unwanted frames, all in your browser.',
    keywords: ['trim gif', 'cut gif', 'gif trimmer', 'shorten gif'],
  },

  // Audio
  'audio-compress': {
    name: 'Compress Audio',
    tagline: 'Lower the bitrate to shrink audio files.',
    description:
      'Reduce an audio file’s size by lowering its bitrate with in-browser FFmpeg — smaller files for sharing, nothing uploaded.',
    keywords: ['compress audio', 'reduce audio size', 'shrink mp3', 'lower audio bitrate'],
  },
  'audio-fade': {
    name: 'Audio Fade In / Out',
    tagline: 'Add smooth fades to the start and end.',
    description:
      'Add smooth fade-in and fade-out to the beginning and end of an audio track — polished intros and outros, all in your browser.',
    keywords: ['audio fade', 'fade in fade out', 'fade audio', 'add fade to mp3'],
  },
  'audio-merge': {
    name: 'Merge Audio Files',
    tagline: 'Join audio files in order with crossfade.',
    description:
      'Join several audio files into one in order, with optional crossfade — combine tracks and clips, all in your browser.',
    keywords: ['merge audio', 'join audio files', 'combine mp3', 'concatenate audio'],
  },
  'audio-silence-trim': {
    name: 'Auto-Remove Silence',
    tagline: 'Cut silent gaps automatically.',
    description:
      'Automatically detect and cut silent gaps from audio for a tighter recording — clean up voice and podcasts in your browser.',
    keywords: ['remove silence', 'trim silence audio', 'cut silent gaps', 'auto silence remover'],
  },
  'audio-speed': {
    name: 'Change Audio Speed',
    tagline: 'Speed 0.25x–4x while keeping pitch.',
    description:
      'Change audio playback speed from 0.25x to 4x while preserving pitch (atempo filter) — speed up or slow down, all in your browser.',
    keywords: ['change audio speed', 'speed up audio', 'slow down audio', 'audio tempo'],
  },
  'audio-trim': {
    name: 'Trim Audio',
    tagline: 'Cut an audio file to a time range.',
    description:
      'Set start and end times to cut just the part you want from an audio file — supports MP3, WAV, OGG and more, all in your browser.',
    keywords: ['trim audio', 'cut mp3', 'audio cutter', 'crop audio'],
  },
  'audio-volume': {
    name: 'Adjust Audio Volume',
    tagline: 'Boost in dB or normalize loudness (LUFS).',
    description:
      'Increase or decrease audio volume in dB, or normalize loudness to a LUFS target — consistent levels, all in your browser.',
    keywords: ['adjust audio volume', 'increase mp3 volume', 'normalize audio', 'louder audio'],
  },

  // Video
  'video-audio-replace': {
    name: 'Replace Video Audio',
    tagline: 'Swap or mix a video’s audio track.',
    description:
      'Replace a video’s audio track with another sound file, or mix them together — change the soundtrack, all in your browser.',
    keywords: ['replace video audio', 'change video sound', 'add music to video', 'swap audio track'],
  },
  'video-blur-face': {
    name: 'Blur Faces in Video',
    tagline: 'Track and blur faces across a video.',
    description:
      'Track faces through a video with AI and cover them with blur, mosaic or emoji while keeping the audio — all in your browser.',
    keywords: ['blur face in video', 'video face blur', 'anonymize video', 'mosaic face video'],
  },
  'video-burn-subtitle': {
    name: 'Burn Subtitles into Video',
    tagline: 'Permanently embed SRT/VTT/ASS captions.',
    description:
      'Burn SRT, VTT or ASS subtitles permanently into a video so they always show — hardcoded captions, all in your browser.',
    keywords: ['burn subtitles', 'hardcode subtitles', 'add subtitles to video', 'embed captions'],
  },
  'video-compress': {
    name: 'Compress Video',
    tagline: 'Shrink video by resolution and bitrate.',
    description:
      'Reduce a video’s file size by adjusting resolution and bitrate with in-browser FFmpeg — fit upload limits, nothing uploaded.',
    keywords: ['compress video', 'reduce video size', 'shrink mp4', 'make video smaller'],
  },
  'video-extract-frames': {
    name: 'Extract Video Frames',
    tagline: 'Save each frame as an image.',
    description:
      'Extract frames from a video and save them as images — grab stills or every frame, processed entirely in your browser.',
    keywords: ['extract video frames', 'video to images', 'save video frame', 'frame grabber'],
  },
  'video-merge': {
    name: 'Merge Videos',
    tagline: 'Join clips in order, codecs unified.',
    description:
      'Join several video clips into one in order, auto-unifying codecs — stitch footage together, all in your browser.',
    keywords: ['merge videos', 'join video clips', 'combine videos', 'concatenate video'],
  },
  'video-poster': {
    name: 'Extract Video Poster Frame',
    tagline: 'Capture a still from any timestamp.',
    description:
      'Capture a still image from a chosen moment in a video for a thumbnail or poster frame — all in your browser.',
    keywords: ['video poster', 'video thumbnail', 'capture video frame', 'video still image'],
  },
  'video-rotate': {
    name: 'Rotate Video',
    tagline: 'Rotate 90/180° and flip horizontally/vertically.',
    description:
      'Rotate a video 90 or 180 degrees and flip it horizontally or vertically — fix sideways clips, all in your browser.',
    keywords: ['rotate video', 'flip video', 'turn video sideways', 'fix video orientation'],
  },
  'video-trim': {
    name: 'Trim Video',
    tagline: 'Cut a clip to a start/end time, fast.',
    description:
      'Set start and end times to cut just the section you need from a video — fast, re-encode-free splitting in your browser.',
    keywords: ['trim video', 'cut video', 'video trimmer', 'crop video length'],
  },

  // EPUB / e-book
  'epub-compress': {
    name: 'Compress EPUB',
    tagline: 'Re-encode images to shrink an EPUB.',
    description:
      'Reduce an EPUB’s file size by re-encoding and downscaling its images — smaller e-books, processed entirely in your browser.',
    keywords: ['compress epub', 'reduce epub size', 'shrink ebook', 'optimize epub'],
  },
  'epub-cover-extract': {
    name: 'Extract EPUB Cover',
    tagline: 'Pull the cover image out of an EPUB.',
    description:
      'Extract an EPUB’s cover image at full original quality — grab the artwork, processed locally with no upload.',
    keywords: ['extract epub cover', 'epub cover image', 'get ebook cover', 'epub cover'],
  },
  'epub-cover-replace': {
    name: 'Replace EPUB Cover',
    tagline: 'Swap an EPUB’s cover for a new image.',
    description:
      'Replace an EPUB’s cover image with a new picture and download the updated e-book — all in your browser, nothing uploaded.',
    keywords: ['replace epub cover', 'change ebook cover', 'new epub cover', 'edit epub cover'],
  },
  'epub-images-extract': {
    name: 'Extract EPUB Images',
    tagline: 'Save every image in an EPUB as a ZIP.',
    description:
      'Extract every image (cover and illustrations) from an EPUB into a ZIP — collect the artwork, all in your browser.',
    keywords: ['extract epub images', 'epub image extractor', 'get images from ebook', 'epub illustrations'],
  },
  'epub-merge': {
    name: 'Merge EPUBs',
    tagline: 'Combine several EPUBs into one.',
    description:
      'Merge several EPUB files into a single e-book in order — combine volumes or chapters, processed entirely in your browser.',
    keywords: ['merge epub', 'combine epub files', 'join ebooks', 'epub merger'],
  },
  'epub-metadata': {
    name: 'Edit EPUB Metadata',
    tagline: 'Change title, author, language and tags.',
    description:
      'Edit an EPUB’s title, author, language, description and tags so it sorts neatly in your reader — all in your browser.',
    keywords: ['epub metadata', 'edit ebook metadata', 'change epub author', 'epub title editor'],
  },
  'epub-reader': {
    name: 'EPUB Reader',
    tagline: 'Read EPUB e-books right in your browser.',
    description:
      'Open and read EPUB e-books in your browser with a table of contents, themes and adjustable font size — nothing uploaded.',
    keywords: ['epub reader', 'read epub online', 'open epub', 'ebook reader browser'],
  },
  'epub-split': {
    name: 'Split EPUB Chapters',
    tagline: 'Split each chapter into its own EPUB.',
    description:
      'Split an EPUB’s chapters into separate EPUB files bundled in a ZIP — break a big book into parts, all in your browser.',
    keywords: ['split epub', 'epub chapter split', 'separate epub chapters', 'divide ebook'],
  },
  'epub-stats': {
    name: 'EPUB Statistics',
    tagline: 'Count words, chapters and images.',
    description:
      'Analyze an EPUB’s word, character, chapter and image counts plus per-chapter length — a reading report, all in your browser.',
    keywords: ['epub statistics', 'epub word count', 'ebook stats', 'count epub words'],
  },
  'epub-to-html': {
    name: 'EPUB to HTML Converter',
    tagline: 'Export an EPUB as HTML.',
    description:
      'Convert an EPUB to a single HTML file with inline images, or per-chapter HTML in a ZIP — all processed in your browser.',
    keywords: ['epub to html', 'convert epub to html', 'ebook to html', 'epub html'],
  },
  'epub-to-md': {
    name: 'EPUB to Markdown Converter',
    tagline: 'Convert EPUB chapters to Markdown.',
    description:
      'Convert an EPUB’s chapters to Markdown as one file or a per-chapter ZIP — reuse book text as notes, all in your browser.',
    keywords: ['epub to markdown', 'convert epub to md', 'ebook to markdown', 'epub md'],
  },
  'epub-to-txt': {
    name: 'EPUB to Text Converter',
    tagline: 'Extract an EPUB’s text to plain .txt.',
    description:
      'Convert an EPUB’s body text to a plain text file — quick copy and reuse, processed locally with no upload.',
    keywords: ['epub to text', 'epub to txt', 'extract text from epub', 'ebook to text'],
  },
  'epub-validate': {
    name: 'Validate EPUB Structure',
    tagline: 'Check OPF, spine, manifest and assets.',
    description:
      'Check an EPUB’s structure — OPF, spine, manifest, cover and missing assets — to catch problems, all in your browser.',
    keywords: ['validate epub', 'epub checker', 'epub structure check', 'fix epub errors'],
  },
  'md-to-epub': {
    name: 'Markdown to EPUB Converter',
    tagline: 'Turn Markdown into a chaptered EPUB.',
    description:
      'Convert Markdown into an EPUB, splitting chapters by heading and optionally adding a cover — make an e-book in your browser.',
    keywords: ['markdown to epub', 'md to epub', 'convert markdown to ebook', 'make epub from markdown'],
  },
  'txt-to-epub': {
    name: 'Text to EPUB Converter',
    tagline: 'Turn plain text into an EPUB e-book.',
    description:
      'Convert a TXT file or pasted text into an EPUB e-book you can read on any e-reader — made entirely in your browser.',
    keywords: ['text to epub', 'txt to epub', 'convert text to ebook', 'make epub from text'],
  },

  // Docs / data
  chart: {
    name: 'Chart to PNG',
    tagline: 'Make bar, line and pie charts as PNG.',
    description:
      'Enter data to instantly generate bar, line or pie charts as PNG images — drop them straight into reports and slides. All local.',
    keywords: ['chart maker', 'chart to png', 'bar chart generator', 'graph maker', 'create chart image'],
  },
  'csv-diff': {
    name: 'Compare CSV Files',
    tagline: 'Row-level diff by key column.',
    description:
      'Compare two CSV files row by row against a key column and highlight added, removed and changed rows — all in your browser.',
    keywords: ['compare csv', 'csv diff', 'csv compare tool', 'diff csv files'],
  },
  'docx-to-md': {
    name: 'DOCX to Markdown Converter',
    tagline: 'Convert Word documents to Markdown.',
    description:
      'Convert a Word DOCX document into clean Markdown for notes, wikis and version control — processed entirely in your browser.',
    keywords: ['docx to markdown', 'word to markdown', 'convert docx to md', 'doc to markdown'],
  },
  'md-html': {
    name: 'Markdown ↔ HTML Converter',
    tagline: 'Convert between Markdown and HTML with preview.',
    description:
      'Convert Markdown to HTML and back with a live preview — author content and reuse it on the web, all in your browser.',
    keywords: ['markdown to html', 'html to markdown', 'md to html', 'markdown converter'],
  },
  'markdown-stats': {
    name: 'Markdown Statistics',
    tagline: 'Analyze words, headings, links and images.',
    description:
      'Analyze a Markdown document’s structure — words, headings, links, images and code blocks — at a glance in your browser.',
    keywords: ['markdown stats', 'markdown word count', 'analyze markdown', 'md statistics'],
  },
  'markdown-toc': {
    name: 'Markdown Table of Contents',
    tagline: 'Auto-generate a TOC from headings.',
    description:
      'Generate a table of contents from a Markdown document’s headings, with insert, numbering and link options — all in your browser.',
    keywords: ['markdown toc', 'table of contents markdown', 'generate md toc', 'markdown outline'],
  },
  'xlsx-convert': {
    name: 'XLSX ↔ CSV ↔ JSON Converter',
    tagline: 'Convert freely between Excel, CSV and JSON.',
    description:
      'Convert between Excel (XLSX), CSV and JSON with sheet selection — move tabular data anywhere, all in your browser.',
    keywords: ['xlsx to csv', 'excel to json', 'csv to xlsx', 'xlsx converter', 'excel to csv'],
  },
  'subtitle-convert': {
    name: 'Subtitle Format Converter',
    tagline: 'Convert between SRT, VTT, ASS, LRC and TXT.',
    description:
      'Convert subtitles freely between SRT, VTT, ASS, LRC and TXT to fix platform compatibility — all in your browser.',
    keywords: ['subtitle converter', 'srt to vtt', 'vtt to srt', 'convert subtitles', 'ass to srt'],
  },
  'subtitle-edit': {
    name: 'Subtitle Editor & Time Sync',
    tagline: 'Edit and re-time SRT/VTT/ASS/LRC subtitles.',
    description:
      'Edit subtitle text and shift timings in bulk or convert formats for SRT, VTT, ASS and LRC — finish captions in your browser.',
    keywords: ['subtitle editor', 'subtitle sync', 'fix subtitle timing', 'shift subtitle time', 'edit srt'],
  },

  // Utility / dev / text
  'text-replace': {
    name: 'Find & Replace Text',
    tagline: 'Bulk replace with regex and capture groups.',
    description:
      'Find and replace text in bulk with regex and capture-group support and a live match count — clean up text in your browser.',
    keywords: ['find and replace', 'bulk text replace', 'regex replace', 'replace text online'],
  },
  'url-parser': {
    name: 'URL Parser',
    tagline: 'Break down and rebuild URLs and query params.',
    description:
      'Parse a URL into its parts and visually edit query parameters, then rebuild it — inspect and tweak links in your browser.',
    keywords: ['url parser', 'parse url', 'query string editor', 'url query parameters'],
  },
  'random-pick': {
    name: 'Random Picker',
    tagline: 'Draw a fair winner from a list.',
    description:
      'Pick a random winner from a list with a uniform, Web Crypto–based draw — fair raffles and giveaways, all in your browser.',
    keywords: ['random picker', 'random name picker', 'raffle picker', 'random winner', 'pick from list'],
  },
  'timer-stopwatch': {
    name: 'Timer & Stopwatch',
    tagline: 'Presets like Pomodoro, laps and an alarm.',
    description:
      'A timer and stopwatch with presets like Pomodoro, lap recording and an alarm when time is up — runs in your browser.',
    keywords: ['online timer', 'stopwatch', 'pomodoro timer', 'countdown timer', 'lap timer'],
  },
  'age-calc': {
    name: 'Age Calculator',
    tagline: 'Compute exact age and milestone days.',
    description:
      'Calculate exact age in years, months and days from a birth date, plus milestone day counts — instantly in your browser.',
    keywords: ['age calculator', 'calculate age', 'age from birthday', 'how old am i', 'date of birth age'],
  },
  dday: {
    name: 'D-Day Countdown Calculator',
    tagline: 'Track countdowns to many events at once.',
    description:
      'Track D-day countdowns to multiple events on one screen — days until exams, trips and deadlines, all in your browser.',
    keywords: ['d-day calculator', 'countdown calculator', 'days until date', 'event countdown', 'days between dates'],
  },
  'base-converter': {
    name: 'Number Base Converter',
    tagline: 'Convert between binary, octal, decimal and hexadecimal instantly.',
    description:
      'Convert numbers between base 2, 8, 10 and 16 and see the bit representation. Runs entirely in your browser.',
    keywords: ['base converter', 'binary to decimal', 'hex converter', 'decimal to hex', 'number base'],
  },
  'json-to-ts': {
    name: 'JSON to TypeScript',
    tagline: 'Generate TypeScript interfaces from any JSON payload.',
    description:
      'Paste JSON and get clean TypeScript interfaces with inferred types. Nothing is uploaded — it runs locally.',
    keywords: ['json to typescript', 'generate interface', 'json to type', 'typescript generator'],
  },
  'color-contrast': {
    name: 'Color Contrast Checker',
    tagline: 'Check WCAG AA/AAA contrast ratio between two colors.',
    description:
      'Enter foreground and background colors to get the WCAG contrast ratio and pass/fail for AA and AAA. Browser-only.',
    keywords: ['color contrast checker', 'wcag contrast', 'aa aaa ratio', 'accessibility contrast'],
  },
  'css-gradient': {
    name: 'CSS Gradient Generator',
    tagline: 'Design linear and radial CSS gradients and copy the code.',
    description:
      'Pick colors and angle, preview the gradient live and copy the CSS. Everything runs in your browser.',
    keywords: ['css gradient generator', 'linear gradient', 'radial gradient', 'background gradient css'],
  },
  'html-format': {
    name: 'HTML Formatter',
    tagline: 'Beautify or minify HTML with proper indentation.',
    description:
      'Paste messy HTML and pretty-print it with clean indentation, or minify it to a single line. Local-only.',
    keywords: ['html formatter', 'beautify html', 'prettify html', 'html minifier'],
  },
  'favicon-gen': {
    name: 'Favicon Generator',
    tagline: 'Turn any image into favicon.ico and all the PWA icon sizes.',
    description:
      'Upload an image and download a complete favicon set (16/32/48/180/512px + favicon.ico) as a zip. Browser-only.',
    keywords: ['favicon generator', 'create favicon', 'ico generator', 'apple touch icon', 'pwa icons'],
  },
  'meme-gen': {
    name: 'Meme Generator',
    tagline: 'Add top and bottom captions to any image to make a meme.',
    description:
      'Upload an image, type top and bottom text in the classic Impact style, and download your meme. Nothing uploaded.',
    keywords: ['meme generator', 'caption image', 'impact font meme', 'make a meme'],
  },
  'image-flip': {
    name: 'Image Flip',
    tagline: 'Flip an image horizontally or vertically.',
    description:
      'Mirror an image left-right or top-bottom and download the result. Runs entirely in your browser.',
    keywords: ['flip image', 'mirror image', 'flip horizontal', 'flip vertical'],
  },
  'image-split': {
    name: 'Image Splitter',
    tagline: 'Cut an image into an N×M grid of tiles.',
    description:
      'Split a photo into a grid (e.g. for an Instagram carousel) and download every tile as a zip. Local-only.',
    keywords: ['image splitter', 'split image grid', 'instagram grid maker', 'cut image into pieces'],
  },
  'image-base64': {
    name: 'Image to Base64',
    tagline: 'Convert images to Base64 data URIs and back.',
    description:
      'Encode an image as a Base64 data URI for inlining in CSS/HTML, or decode a data URI back to an image. Browser-only.',
    keywords: ['image to base64', 'base64 to image', 'data uri encoder', 'inline image base64'],
  },
  'image-round-corners': {
    name: 'Round Image Corners',
    tagline: 'Add rounded corners to an image with transparency.',
    description:
      'Round the corners of an image by an adjustable radius and export a transparent PNG. Runs locally.',
    keywords: ['round image corners', 'rounded corners png', 'image radius', 'circle crop'],
  },
  'video-crop': {
    name: 'Crop Video',
    tagline: 'Crop a video to a rectangular region in your browser.',
    description:
      'Select a rectangle and keep only that area of your video. Powered by FFmpeg.wasm — nothing is uploaded.',
    keywords: ['crop video', 'trim video frame', 'cut video area', 'reframe video'],
  },
  'video-speed': {
    name: 'Change Video Speed',
    tagline: 'Speed up or slow down a video from 0.25× to 4×.',
    description:
      'Adjust playback speed with synced audio pitch using FFmpeg.wasm. Make slow-motion or timelapse clips locally.',
    keywords: ['change video speed', 'speed up video', 'slow motion video', 'video timelapse'],
  },
  'video-mute': {
    name: 'Mute Video',
    tagline: 'Remove the audio track from a video.',
    description:
      'Strip the sound from a video and export a silent clip. Powered by FFmpeg.wasm, fully in your browser.',
    keywords: ['mute video', 'remove audio from video', 'silent video', 'strip sound'],
  },
  'video-watermark': {
    name: 'Add Watermark to Video',
    tagline: 'Overlay a logo or text watermark onto a video.',
    description:
      'Place a logo image or text watermark on your video with adjustable position and opacity. FFmpeg.wasm, local-only.',
    keywords: ['video watermark', 'add logo to video', 'overlay watermark', 'brand video'],
  },
  'screen-record': {
    name: 'Screen Recorder',
    tagline: 'Record your screen, tab or window to a webm file.',
    description:
      'Capture your screen with optional microphone audio and download a webm — no upload, no install, browser-only.',
    keywords: ['screen recorder', 'record screen browser', 'free screen recording', 'webm screen capture'],
  },
  'dedupe-lines': {
    name: 'Remove Duplicate Lines',
    tagline: 'Delete duplicate lines while keeping the original order.',
    description:
      'Paste a list and remove repeated lines, optionally ignoring case and trimming whitespace. Runs locally.',
    keywords: ['remove duplicate lines', 'unique lines', 'dedupe text', 'delete repeated lines'],
  },
  'whitespace-clean': {
    name: 'Whitespace Cleaner',
    tagline: 'Trim trailing spaces, collapse blank lines and fix tabs.',
    description:
      'Clean up messy text: strip trailing whitespace, collapse multiple blank lines and normalize indentation. Local-only.',
    keywords: ['whitespace cleaner', 'trim spaces', 'remove blank lines', 'clean text'],
  },
  'slugify': {
    name: 'Slugify Text',
    tagline: 'Convert titles into clean URL slugs.',
    description:
      'Turn any text into a URL-safe slug (kebab-case), transliterating accents. Great for permalinks. Runs locally.',
    keywords: ['slugify', 'url slug generator', 'text to slug', 'permalink generator'],
  },
  'word-frequency': {
    name: 'Word Frequency Counter',
    tagline: 'Count how often each word appears in your text.',
    description:
      'Paste text to see word counts ranked by frequency, with optional stopword filtering. Everything stays local.',
    keywords: ['word frequency counter', 'count word occurrences', 'word frequency analysis', 'keyword density'],
  },
  'column-extract': {
    name: 'Column Extractor',
    tagline: 'Pull specific columns out of delimited text.',
    description:
      'Split text by a delimiter and extract only the columns you choose, reordering as needed. Browser-only.',
    keywords: ['column extractor', 'extract column from text', 'delimited text columns', 'cut columns'],
  },
  'bmi-calc': {
    name: 'BMI Calculator',
    tagline: 'Calculate your Body Mass Index from height and weight.',
    description:
      'Enter height and weight to get your BMI and the WHO category. Supports metric and imperial. Runs locally.',
    keywords: ['bmi calculator', 'body mass index', 'calculate bmi', 'bmi metric imperial'],
  },
  'loan-calc': {
    name: 'Loan Calculator',
    tagline: 'Estimate monthly payments and total interest on a loan.',
    description:
      'Enter principal, rate and term to get the monthly payment and total interest (amortized). Browser-only.',
    keywords: ['loan calculator', 'monthly payment calculator', 'amortization', 'mortgage calculator'],
  },
  'aspect-ratio': {
    name: 'Aspect Ratio Calculator',
    tagline: 'Compute width or height for a target aspect ratio.',
    description:
      'Lock an aspect ratio like 16:9 and get the matching dimension when you change width or height. Runs locally.',
    keywords: ['aspect ratio calculator', '16:9 calculator', 'resize ratio', 'resolution calculator'],
  },
  'pomodoro': {
    name: 'Pomodoro Timer',
    tagline: 'Focus with 25-minute work and 5-minute break cycles.',
    description:
      'A simple Pomodoro timer that alternates focus and break sessions with a notification. Browser-only, no signup.',
    keywords: ['pomodoro timer', 'focus timer', '25 minute timer', 'productivity timer'],
  },
  'roman-numeral': {
    name: 'Roman Numeral Converter',
    tagline: 'Convert between Arabic numbers and Roman numerals.',
    description:
      'Translate numbers to Roman numerals (I, V, X, L, C, D, M) and back. Runs entirely in your browser.',
    keywords: ['roman numeral converter', 'number to roman', 'roman to number', 'roman numerals'],
  },
  'text-hash': {
    name: 'Text Hash Generator',
    tagline: 'Generate MD5, SHA-1, SHA-256 and SHA-512 of any text.',
    description:
      'Hash text with MD5, SHA-1, SHA-256 and SHA-512 instantly. All hashing happens locally in your browser.',
    keywords: ['text hash generator', 'md5 generator', 'sha256 hash', 'sha512 online'],
  },
  'password-strength': {
    name: 'Password Strength Checker',
    tagline: 'Estimate password entropy and crack time.',
    description:
      'Check how strong a password is — entropy bits and estimated crack time — without sending it anywhere. Local-only.',
    keywords: ['password strength checker', 'password entropy', 'how strong is my password', 'crack time'],
  },
  'diceware': {
    name: 'Diceware Passphrase Generator',
    tagline: 'Create memorable word-based passphrases with strong randomness.',
    description:
      'Generate Diceware-style passphrases using cryptographically secure randomness. Choose word count. Browser-only.',
    keywords: ['diceware generator', 'passphrase generator', 'memorable password', 'word password'],
  },
  'jwt-encoder': {
    name: 'JWT Encoder',
    tagline: 'Build and sign HS256 JSON Web Tokens.',
    description:
      'Create a signed JWT from a header, payload and secret using HMAC-SHA256 — all locally in your browser.',
    keywords: ['jwt encoder', 'sign jwt', 'create jwt', 'hs256 token generator'],
  },
  'xml-format': {
    name: 'XML Formatter',
    tagline: 'Beautify or minify XML with proper indentation.',
    description:
      'Pretty-print messy XML with clean indentation or minify it. Validates structure as it formats. Runs locally.',
    keywords: ['xml formatter', 'beautify xml', 'prettify xml', 'xml minifier'],
  },
  'csv-viewer': {
    name: 'CSV Viewer',
    tagline: 'Preview CSV files as a sortable, searchable table.',
    description:
      'Open a CSV in your browser and view it as a table with column sorting and search. Nothing is uploaded.',
    keywords: ['csv viewer', 'open csv online', 'view csv as table', 'csv preview'],
  },
  'ical-gen': {
    name: 'iCal (.ics) Generator',
    tagline: 'Create downloadable calendar events as .ics files.',
    description:
      'Fill in a title, time and location to generate an .ics file that adds the event to any calendar app. Local-only.',
    keywords: ['ics generator', 'ical file creator', 'calendar event file', 'add to calendar ics'],
  },
  'vcard-parse': {
    name: 'vCard (.vcf) Parser',
    tagline: 'Read .vcf contact files and export them as CSV.',
    description:
      'Open a vCard file to view its contacts (name, phone, email) in a table and export them to CSV. Browser-only.',
    keywords: ['vcard parser', 'vcf to csv', 'read vcf file', 'contact file viewer'],
  },
  'audio-reverse': {
    name: 'Reverse Audio',
    tagline: 'Play and export audio in reverse.',
    description:
      'Reverse an audio clip in time and download the result. Powered by FFmpeg.wasm, fully in your browser.',
    keywords: ['reverse audio', 'play audio backwards', 'reverse mp3', 'backwards audio'],
  },
  'audio-normalize': {
    name: 'Normalize Audio',
    tagline: 'Even out audio loudness to a consistent level.',
    description:
      'Apply loudness normalization (EBU R128 loudnorm) so quiet and loud parts match. FFmpeg.wasm, local-only.',
    keywords: ['normalize audio', 'audio loudness', 'loudnorm', 'level audio volume'],
  },
  'tone-gen': {
    name: 'Tone Generator',
    tagline: 'Generate sine, square and triangle test tones.',
    description:
      'Create a pure tone at any frequency, waveform and duration and download it as WAV. Uses the Web Audio API locally.',
    keywords: ['tone generator', 'frequency generator', 'test tone', 'sine wave generator hz'],
  },
  'mic-record': {
    name: 'Microphone Recorder',
    tagline: 'Record audio from your microphone and download it.',
    description:
      'Record voice from your mic and save it as an audio file — no upload, no install, runs in your browser.',
    keywords: ['microphone recorder', 'record audio online', 'voice recorder browser', 'mic to file'],
  },
  'json-diff': {
    name: 'JSON Diff',
    tagline: 'Compare two JSON documents structurally.',
    description:
      'Find added, removed and changed keys between two JSON objects with a structural diff. Runs in your browser.',
    keywords: ['json diff', 'compare json', 'json compare tool', 'structural diff'],
  },
  'box-shadow': {
    name: 'CSS Box Shadow Generator',
    tagline: 'Design and copy CSS box-shadow visually.',
    description:
      'Adjust offset, blur, spread and color to build a box-shadow, preview it live and copy the CSS. Browser-only.',
    keywords: ['box shadow generator', 'css box-shadow', 'shadow css', 'box shadow maker'],
  },
  'cubic-bezier': {
    name: 'Cubic Bezier Editor',
    tagline: 'Craft CSS easing curves with a draggable bezier.',
    description:
      'Drag control points to design a cubic-bezier timing function for CSS transitions and copy the value. Local-only.',
    keywords: ['cubic bezier', 'easing editor', 'css timing function', 'bezier curve css'],
  },
  'mock-data': {
    name: 'Mock Data Generator',
    tagline: 'Generate fake names, emails and records as JSON or CSV.',
    description:
      'Create realistic mock data (names, emails, addresses, dates) and export as JSON or CSV for testing. Browser-only.',
    keywords: ['mock data generator', 'fake data', 'test data generator', 'dummy json csv'],
  },
  'svg-optimize': {
    name: 'SVG Optimizer',
    tagline: 'Shrink SVG files by stripping cruft.',
    description:
      'Remove editor metadata, redundant whitespace and excess precision from SVG markup to reduce size. Local-only.',
    keywords: ['svg optimizer', 'optimize svg', 'minify svg', 'svg cleaner'],
  },
  'gitignore-gen': {
    name: '.gitignore Generator',
    tagline: 'Build a .gitignore from languages, frameworks and OS.',
    description:
      'Pick stacks and platforms to assemble a ready-to-use .gitignore file. Generated locally, nothing uploaded.',
    keywords: ['gitignore generator', 'create gitignore', 'git ignore template', 'gitignore.io alternative'],
  },
  'image-filters': {
    name: 'Image Filters',
    tagline: 'Apply Instagram-style filters to a photo.',
    description:
      'Add grayscale, sepia, vintage and other filters to an image and download the result. Runs in your browser.',
    keywords: ['image filters', 'photo filter online', 'instagram filter', 'sepia grayscale filter'],
  },
  'image-duotone': {
    name: 'Duotone Image',
    tagline: 'Map an image to a two-color duotone.',
    description:
      'Convert a photo into a stylish duotone using two custom colors mapped to shadows and highlights. Local-only.',
    keywords: ['duotone generator', 'duotone image', 'two tone photo', 'gradient map'],
  },
  'avatar-crop': {
    name: 'Circle Avatar Crop',
    tagline: 'Crop an image into a circular profile picture.',
    description:
      'Crop a photo to a circle and export a transparent PNG, perfect for avatars and profile pictures. Browser-only.',
    keywords: ['circle crop', 'avatar maker', 'profile picture crop', 'round image'],
  },
  'image-target-size': {
    name: 'Compress Image to Target Size',
    tagline: 'Shrink an image to a target file size.',
    description:
      'Automatically tune quality so a JPEG/WebP lands under your chosen size (e.g. 200 KB). Runs in your browser.',
    keywords: ['compress image to size', 'target file size', 'resize to kb', 'image under 200kb'],
  },
  'image-color-picker': {
    name: 'Image Color Picker',
    tagline: 'Pick HEX/RGB colors from any image.',
    description:
      'Upload an image and click anywhere to read the pixel\'s HEX and RGB color. Everything stays in your browser.',
    keywords: ['image color picker', 'pick color from image', 'eyedropper online', 'hex from image'],
  },
  'gradient-image': {
    name: 'Gradient Image Generator',
    tagline: 'Create gradient background images as PNG.',
    description:
      'Pick colors, direction and size to generate a gradient background image and download it as PNG. Local-only.',
    keywords: ['gradient image generator', 'gradient background png', 'gradient wallpaper', 'create gradient image'],
  },
  'morse-code': {
    name: 'Morse Code Translator',
    tagline: 'Translate text to Morse code and back, with sound.',
    description:
      'Convert between text and Morse code and play it as audio beeps. Runs entirely in your browser.',
    keywords: ['morse code translator', 'text to morse', 'morse to text', 'morse code audio'],
  },
  'binary-text': {
    name: 'Text to Binary',
    tagline: 'Convert text to binary and binary to text.',
    description:
      'Encode text as binary (UTF-8) or decode binary back to text. Everything runs locally in your browser.',
    keywords: ['text to binary', 'binary to text', 'binary translator', 'ascii binary'],
  },
  'fancy-text': {
    name: 'Fancy Text Generator',
    tagline: 'Turn text into stylish Unicode fonts.',
    description:
      'Convert plain text into bold, italic, script and other Unicode font styles for social bios. Browser-only.',
    keywords: ['fancy text generator', 'unicode fonts', 'instagram fonts', 'cool text'],
  },
  'caesar-cipher': {
    name: 'Caesar Cipher / ROT13',
    tagline: 'Encode and decode Caesar shift and ROT13.',
    description:
      'Apply a Caesar shift cipher or ROT13 to text and decode it back. Adjustable shift. Runs in your browser.',
    keywords: ['caesar cipher', 'rot13', 'shift cipher', 'encode decode text'],
  },
  'nato-phonetic': {
    name: 'NATO Phonetic Alphabet',
    tagline: 'Spell text with the NATO phonetic alphabet.',
    description:
      'Convert any text into the NATO phonetic alphabet (Alfa, Bravo, Charlie…) for clear spelling. Browser-only.',
    keywords: ['nato phonetic alphabet', 'phonetic spelling', 'alfa bravo charlie', 'spell with nato'],
  },
  'tts': {
    name: 'Text to Speech',
    tagline: 'Read text aloud with browser voices.',
    description:
      'Type text and have your browser speak it using built-in voices, with adjustable rate and pitch. Local-only.',
    keywords: ['text to speech', 'tts online', 'read aloud', 'browser speech synthesis'],
  },
  'toml-json': {
    name: 'TOML to JSON',
    tagline: 'Convert between TOML and JSON.',
    description:
      'Convert TOML config to JSON and back, in your browser. Useful for editing and inspecting config files. Local-only.',
    keywords: ['toml to json', 'json to toml', 'toml converter', 'convert toml'],
  },
  'ini-json': {
    name: 'INI to JSON',
    tagline: 'Convert between INI config and JSON.',
    description:
      'Parse INI files into JSON and serialize JSON back to INI. Runs entirely in your browser.',
    keywords: ['ini to json', 'json to ini', 'ini converter', 'parse ini'],
  },
  'csv-to-md': {
    name: 'CSV to Markdown Table',
    tagline: 'Turn CSV into a GitHub-flavored Markdown table.',
    description:
      'Paste CSV and get a clean Markdown table with aligned columns, ready for README files. Browser-only.',
    keywords: ['csv to markdown table', 'markdown table generator', 'csv to md', 'convert csv markdown'],
  },
  'markdown-preview': {
    name: 'Markdown Preview',
    tagline: 'Live-render Markdown as you type.',
    description:
      'Write Markdown and see the rendered output and HTML side by side in real time. Runs in your browser.',
    keywords: ['markdown preview', 'markdown editor online', 'live markdown', 'md to html preview'],
  },
  'json-escape': {
    name: 'JSON Escape / Unescape',
    tagline: 'Escape and unescape strings for JSON.',
    description:
      'Escape text into a JSON-safe string (quotes, newlines, unicode) or unescape it back. Browser-only.',
    keywords: ['json escape', 'json unescape', 'escape string json', 'json string escape'],
  },
  'timezone': {
    name: 'Time Zone Converter',
    tagline: 'Convert times between time zones.',
    description:
      'Pick two time zones to convert a time and see the offset. Uses your browser\'s built-in time zone data. Local-only.',
    keywords: ['time zone converter', 'timezone calculator', 'world clock', 'utc converter'],
  },
  'tdee': {
    name: 'TDEE & Calorie Calculator',
    tagline: 'Estimate BMR and daily calorie needs.',
    description:
      'Enter height, weight, age and activity level to compute BMR and TDEE (daily calories). Runs in your browser.',
    keywords: ['tdee calculator', 'calorie calculator', 'bmr calculator', 'daily calorie needs'],
  },
  'number-to-words': {
    name: 'Number to Words',
    tagline: 'Spell numbers out in words.',
    description:
      'Convert a number into its English words (and amount style), e.g. 1234 → one thousand two hundred thirty-four. Local-only.',
    keywords: ['number to words', 'spell number', 'number to text', 'write number in words'],
  },
  'discount': {
    name: 'Discount Calculator',
    tagline: 'Calculate sale price and savings.',
    description:
      'Enter price and discount to get the final price and amount saved, or work out the discount rate. Browser-only.',
    keywords: ['discount calculator', 'sale price calculator', 'percent off', 'savings calculator'],
  },
  'date-diff': {
    name: 'Date Calculator',
    tagline: 'Days between dates, or add/subtract days.',
    description:
      'Find the number of days between two dates, or add/subtract days from a date. Runs entirely in your browser.',
    keywords: ['date calculator', 'days between dates', 'date difference', 'add days to date'],
  },
  'gpa': {
    name: 'GPA Calculator',
    tagline: 'Compute your grade point average.',
    description:
      'Enter courses with credits and grades to calculate a weighted GPA (4.0/4.5 scales). Browser-only.',
    keywords: ['gpa calculator', 'grade point average', 'weighted gpa', 'college gpa'],
  },
  'video-reverse': {
    name: 'Reverse Video',
    tagline: 'Play and export a video in reverse.',
    description:
      'Reverse a clip in time using FFmpeg.wasm and download it. Everything runs in your browser, nothing uploaded.',
    keywords: ['reverse video', 'play video backwards', 'video reverser', 'backwards video'],
  },
  'video-loop': {
    name: 'Loop Video',
    tagline: 'Repeat a video N times into one file.',
    description:
      'Concatenate a clip to itself a chosen number of times to make a seamless loop. Powered by FFmpeg.wasm, local-only.',
    keywords: ['loop video', 'repeat video', 'video loop maker', 'loop mp4'],
  },
  'video-resize': {
    name: 'Resize Video',
    tagline: 'Change a video\'s resolution (720p, 1080p…).',
    description:
      'Re-encode a video to a target resolution while keeping the aspect ratio. FFmpeg.wasm, runs in your browser.',
    keywords: ['resize video', 'change video resolution', 'scale video', 'video 720p 1080p'],
  },
  'webcam-record': {
    name: 'Webcam Recorder',
    tagline: 'Record video from your webcam.',
    description:
      'Capture your webcam and microphone and download a webm — no upload, no install, runs in your browser.',
    keywords: ['webcam recorder', 'record webcam online', 'camera recorder', 'webm webcam'],
  },
  'video-flip': {
    name: 'Flip Video',
    tagline: 'Flip a video horizontally or vertically.',
    description:
      'Mirror a video left-right or top-bottom and re-encode it. Powered by FFmpeg.wasm, fully in your browser.',
    keywords: ['flip video', 'mirror video', 'flip video horizontal', 'flip mp4'],
  },
  'typing-speed': {
    name: 'Typing Speed Test',
    tagline: 'Measure your typing speed in WPM.',
    description:
      'Type the prompt to measure words-per-minute and accuracy. Runs entirely in your browser, no signup.',
    keywords: ['typing speed test', 'wpm test', 'typing test online', 'words per minute'],
  },
  'reaction-time': {
    name: 'Reaction Time Test',
    tagline: 'Test how fast you react in milliseconds.',
    description:
      'Click as soon as the signal changes to measure your reaction time across several rounds. Browser-only.',
    keywords: ['reaction time test', 'reflex test', 'reaction speed', 'click reaction'],
  },
  'color-blind': {
    name: 'Color Blindness Simulator',
    tagline: 'Preview an image as color-blind viewers see it.',
    description:
      'Simulate protanopia, deuteranopia and tritanopia on an image to check accessibility. Runs in your browser.',
    keywords: ['color blindness simulator', 'color blind test image', 'protanopia deuteranopia', 'accessibility colors'],
  },
  'screen-ruler': {
    name: 'Screen Ruler & PPI',
    tagline: 'Measure pixels and compute screen PPI.',
    description:
      'Calculate your display\'s PPI from resolution and diagonal size, with an on-screen pixel ruler. Browser-only.',
    keywords: ['screen ruler', 'ppi calculator', 'pixel ruler', 'screen dpi'],
  },
  'qr-logo': {
    name: 'QR Code with Logo',
    tagline: 'Generate a QR code with a logo in the center.',
    description:
      'Create a QR code from text or a URL and overlay your logo in the middle, with error correction. Local-only.',
    keywords: ['qr code with logo', 'custom qr code', 'branded qr', 'logo qr generator'],
  },
  'htpasswd': {
    name: '.htpasswd Generator',
    tagline: 'Create Apache .htpasswd credential lines.',
    description:
      'Generate .htpasswd entries (bcrypt/APR1-MD5/SHA) from a username and password, all locally in your browser.',
    keywords: ['htpasswd generator', 'apache htpasswd', 'basic auth password', 'htpasswd bcrypt'],
  },
  'secret-split': {
    name: 'Secret Splitter (Shamir)',
    tagline: 'Split a secret into shares, recombine some to restore.',
    description:
      'Use Shamir\'s Secret Sharing to split a secret into N shares where any K recombine it. Runs in your browser.',
    keywords: ['shamir secret sharing', 'split secret', 'secret sharing tool', 'key splitting'],
  },
  'summarize': {
    name: 'Text Summarizer',
    tagline: 'Extractive summary — pick the key sentences.',
    description:
      'Score sentences and extract the most important ones to summarize text, with no model or upload. Browser-only.',
    keywords: ['text summarizer', 'summarize text', 'extractive summary', 'summary generator'],
  },
  'language-detect': {
    name: 'Language Detector',
    tagline: 'Detect what language a text is written in.',
    description:
      'Estimate the language of a snippet using character and n-gram heuristics, entirely in your browser.',
    keywords: ['language detector', 'detect language', 'what language is this', 'identify language'],
  },
  'sentiment': {
    name: 'Sentiment Analysis',
    tagline: 'Score text as positive or negative.',
    description:
      'Estimate sentiment with a lexicon-based scorer — no model, no upload. Highlights positive and negative words. Local-only.',
    keywords: ['sentiment analysis', 'positive negative text', 'sentiment scorer', 'text sentiment'],
  },
  'curl-to-code': {
    name: 'cURL to Code Converter',
    tagline: 'Turn a cURL command into fetch, axios, or Python requests code.',
    description:
      'Paste a cURL command and get ready-to-use JavaScript fetch, axios, or Python requests code. Runs fully in your browser.',
    keywords: ['curl to code', 'curl to fetch', 'curl to python', 'curl converter', 'curl to axios'],
  },
  'json-to-go': {
    name: 'JSON to Go Struct',
    tagline: 'Generate Go struct types from JSON instantly.',
    description:
      'Paste JSON and get typed Go structs with json tags. Everything runs locally in your browser.',
    keywords: ['json to go', 'json to struct', 'golang struct generator', 'go type from json', 'json to golang'],
  },
  'css-units': {
    name: 'CSS Unit Converter',
    tagline: 'Convert between px, rem, em, and pt for CSS.',
    description:
      'Convert CSS length units (px, rem, em, pt) with a custom root font size. No uploads, all in your browser.',
    keywords: ['css unit converter', 'px to rem', 'rem to px', 'em to px', 'px to pt'],
  },
  'chmod-calc': {
    name: 'chmod Calculator',
    tagline: 'Convert Unix file permissions between octal and symbolic.',
    description:
      'Toggle read/write/execute for owner, group, and others to get the chmod octal and symbolic notation. Runs in your browser.',
    keywords: ['chmod calculator', 'unix permissions', 'file permission calculator', 'octal permissions', 'chmod 755'],
  },
  'user-agent-parser': {
    name: 'User-Agent Parser',
    tagline: 'Detect browser, OS, and device from a User-Agent string.',
    description:
      'Paste any User-Agent string to identify the browser, engine, operating system, and device type. Fully client-side.',
    keywords: ['user agent parser', 'parse user agent', 'ua parser', 'detect browser', 'user agent string'],
  },
  'http-status': {
    name: 'HTTP Status Codes',
    tagline: 'Look up the meaning of any HTTP status code.',
    description:
      'Search HTTP status codes (1xx–5xx) with descriptions and common use cases. A quick reference, all in your browser.',
    keywords: ['http status codes', '404 meaning', '500 error', 'http response codes', 'status code reference'],
  },
  'dotenv-json': {
    name: '.env to JSON Converter',
    tagline: 'Convert .env files to JSON and back.',
    description:
      'Paste .env contents to get JSON, or convert JSON into a .env file. Handles quotes and comments, all in your browser.',
    keywords: ['env to json', 'dotenv to json', 'json to env', 'env converter', 'parse env file'],
  },
  'color-name': {
    name: 'Color Name Finder',
    tagline: 'Find the nearest named CSS color for any hex or RGB value.',
    description:
      'Enter a hex or RGB color to find the closest CSS named color, with the exact match flagged. Runs in your browser.',
    keywords: ['color name finder', 'hex to color name', 'css color names', 'nearest color name', 'rgb to name'],
  },
  'reverse-text': {
    name: 'Reverse Text',
    tagline: 'Reverse characters, words, or lines of text.',
    description:
      'Flip text by characters, words, or line order instantly. No uploads, runs in your browser.',
    keywords: ['reverse text', 'backwards text', 'reverse string', 'flip text', 'reverse words'],
  },
  'line-numbers': {
    name: 'Add Line Numbers',
    tagline: 'Number every line of text, or strip existing numbers.',
    description:
      'Prefix each line with a number using a custom start, padding, and separator — or remove line numbers. Client-side only.',
    keywords: ['add line numbers', 'number lines', 'line numbering', 'remove line numbers', 'text line numbers'],
  },
  'text-repeat': {
    name: 'Repeat Text',
    tagline: 'Repeat any text a set number of times.',
    description:
      'Duplicate text N times with an optional separator between copies. Useful for testing and templates. Runs in your browser.',
    keywords: ['repeat text', 'text repeater', 'duplicate text', 'repeat string', 'copy text multiple times'],
  },
  'bionic-reading': {
    name: 'Bionic Reading Converter',
    tagline: 'Bold the first part of each word for faster reading.',
    description:
      'Convert any text into a bionic reading format that highlights word beginnings to guide your eyes. All client-side.',
    keywords: ['bionic reading', 'speed reading', 'bionic text', 'fast reading converter', 'reading aid'],
  },
  'ascii-banner': {
    name: 'ASCII Banner Generator',
    tagline: 'Turn text into big ASCII art letters.',
    description:
      'Generate large ASCII art banners from text for READMEs, terminals, and comments. Runs entirely in your browser.',
    keywords: ['ascii banner', 'ascii art text', 'figlet generator', 'text to ascii art', 'ascii art generator'],
  },
  'zalgo-text': {
    name: 'Zalgo Glitch Text',
    tagline: 'Create creepy glitch text with combining marks.',
    description:
      'Add layered combining diacritics to your text for a glitchy zalgo effect, with adjustable intensity. Client-side.',
    keywords: ['zalgo text', 'glitch text', 'creepy text', 'cursed text generator', 'zalgo generator'],
  },
  'tip-calc': {
    name: 'Tip Calculator',
    tagline: 'Calculate tip and split the bill per person.',
    description:
      'Enter the bill, tip percentage, and number of people to get the tip, total, and amount per person. Runs in your browser.',
    keywords: ['tip calculator', 'split bill', 'gratuity calculator', 'tip per person', 'bill splitter'],
  },
  'dice-roller': {
    name: 'Dice Roller',
    tagline: 'Roll any number of dice with any number of sides.',
    description:
      'Roll D4, D6, D20 and custom dice, with totals and modifiers for tabletop games. Cryptographically random, in your browser.',
    keywords: ['dice roller', 'roll dice online', 'd20 roller', 'rpg dice', 'virtual dice'],
  },
  'coin-flip': {
    name: 'Coin Flip',
    tagline: 'Flip a virtual coin to decide heads or tails.',
    description:
      'Flip one or many coins and see heads/tails results and tallies. Fairly random, runs in your browser.',
    keywords: ['coin flip', 'flip a coin', 'heads or tails', 'coin toss', 'random decision'],
  },
  'subnet-calc': {
    name: 'Subnet Calculator',
    tagline: 'Compute network, broadcast, and host range from a CIDR.',
    description:
      'Enter an IPv4 address and CIDR prefix to get the netmask, network and broadcast addresses, and usable host range. Client-side.',
    keywords: ['subnet calculator', 'cidr calculator', 'ip subnet', 'ipv4 calculator', 'netmask calculator'],
  },
  'scientific-calc': {
    name: 'Scientific Calculator',
    tagline: 'Trig, logs, powers, and more in your browser.',
    description:
      'A scientific calculator supporting trigonometry, logarithms, exponents, constants, and expression evaluation. No server.',
    keywords: ['scientific calculator', 'online calculator', 'trig calculator', 'math calculator', 'expression calculator'],
  },
  'fuel-cost': {
    name: 'Fuel Cost Calculator',
    tagline: 'Estimate trip fuel cost from distance, economy, and price.',
    description:
      'Enter trip distance, fuel economy, and fuel price to estimate total fuel cost and consumption. Runs in your browser.',
    keywords: ['fuel cost calculator', 'gas cost calculator', 'trip fuel cost', 'fuel economy calculator', 'mileage cost'],
  },
  'lottery-number': {
    name: 'Lottery Number Generator',
    tagline: 'Generate random lottery number combinations.',
    description:
      'Pick random number sets for lotteries with custom range and count. Cryptographically random, runs in your browser.',
    keywords: ['lottery number generator', 'random lottery numbers', 'lotto generator', 'powerball generator', 'random number picker'],
  },
  'random-number': {
    name: 'Random Number Generator',
    tagline: 'Generate random numbers with range, count, and uniqueness.',
    description:
      'Generate random integers within a range, with options for count and no-duplicates. Cryptographically random, client-side.',
    keywords: ['random number generator', 'rng', 'random integer', 'number generator', 'random picker'],
  },
  'hmac-gen': {
    name: 'HMAC Generator',
    tagline: 'Generate HMAC signatures with SHA-1, SHA-256, or SHA-512.',
    description:
      'Compute an HMAC from a secret key and message using the Web Crypto API. Output in hex or Base64, all in your browser.',
    keywords: ['hmac generator', 'hmac sha256', 'hmac online', 'message authentication code', 'hmac signature'],
  },
  'base32': {
    name: 'Base32 Encode / Decode',
    tagline: 'Encode and decode text with RFC 4648 Base32.',
    description:
      'Convert text to and from Base32 (RFC 4648). Useful for TOTP secrets and case-insensitive encoding. Runs in your browser.',
    keywords: ['base32 encode', 'base32 decode', 'base32 converter', 'rfc 4648', 'base32 online'],
  },
  'bcrypt': {
    name: 'bcrypt Hash & Verify',
    tagline: 'Generate and verify bcrypt password hashes.',
    description:
      'Hash a password with bcrypt at a chosen cost factor, or verify a password against a hash. Computed locally in your browser.',
    keywords: ['bcrypt generator', 'bcrypt hash', 'bcrypt verify', 'password hash', 'bcrypt online'],
  },
  'wifi-qr': {
    name: 'WiFi QR Code Generator',
    tagline: 'Create a QR code that connects to your WiFi.',
    description:
      'Enter your WiFi SSID, password, and security type to generate a scannable QR code for instant connection. All client-side.',
    keywords: ['wifi qr code', 'wifi qr generator', 'qr code for wifi', 'share wifi qr', 'wifi password qr'],
  },
  'json-flatten': {
    name: 'JSON Flatten / Unflatten',
    tagline: 'Flatten nested JSON to dot keys, or rebuild it.',
    description:
      'Convert nested JSON into flat dot-notation keys, or unflatten dotted keys back into nested objects. Runs in your browser.',
    keywords: ['json flatten', 'flatten json', 'unflatten json', 'json dot notation', 'nested json converter'],
  },
  'csv-merge': {
    name: 'CSV Merge',
    tagline: 'Combine multiple CSV files into one.',
    description:
      'Merge several CSV files into a single file, aligning columns by header. All processing happens in your browser.',
    keywords: ['csv merge', 'combine csv files', 'merge csv', 'join csv', 'concatenate csv'],
  },
  'csv-split': {
    name: 'CSV Split',
    tagline: 'Split a large CSV into smaller files by row count.',
    description:
      'Break a big CSV into chunks of N rows each, keeping the header in every file, and download them as a zip. Client-side.',
    keywords: ['csv split', 'split csv file', 'split large csv', 'divide csv', 'csv splitter'],
  },
  'jsonl-viewer': {
    name: 'JSONL Viewer',
    tagline: 'View JSON Lines as a table and export to JSON or CSV.',
    description:
      'Open a JSONL/NDJSON file to browse records in a table, then convert to a JSON array or CSV. Runs in your browser.',
    keywords: ['jsonl viewer', 'ndjson viewer', 'json lines viewer', 'jsonl to csv', 'jsonl to json'],
  },
  'image-blur': {
    name: 'Blur Image',
    tagline: 'Apply a Gaussian blur to your image.',
    description:
      'Blur an entire image with an adjustable radius, then download the result. All processing stays in your browser.',
    keywords: ['blur image', 'image blur online', 'gaussian blur', 'blur photo', 'blur picture'],
  },
  'image-border': {
    name: 'Add Image Border',
    tagline: 'Add a colored border or frame around your image.',
    description:
      'Add a solid border with custom width and color around any image. Runs entirely in your browser, no upload.',
    keywords: ['add border to image', 'image border', 'photo frame', 'picture border', 'image frame online'],
  },
  'image-placeholder': {
    name: 'Placeholder Image Generator',
    tagline: 'Generate placeholder images with custom size and text.',
    description:
      'Create solid-color placeholder images with custom dimensions, colors, and label text for mockups. Client-side PNG export.',
    keywords: ['placeholder image generator', 'dummy image', 'placeholder png', 'mockup image', 'image placeholder'],
  },
  'image-histogram': {
    name: 'Image Histogram',
    tagline: 'Analyze the RGB and luminance distribution of an image.',
    description:
      'Upload an image to see its red, green, blue, and luminance histograms. Useful for exposure analysis. Runs in your browser.',
    keywords: ['image histogram', 'rgb histogram', 'photo histogram', 'luminance histogram', 'histogram analyzer'],
  },
  'pdf-reverse': {
    name: 'Reverse PDF Pages',
    tagline: 'Flip the page order of a PDF.',
    description:
      'Reverse the order of all pages in a PDF and download the result. Runs entirely in your browser, no upload.',
    keywords: ['reverse pdf pages', 'flip pdf order', 'pdf page order', 'reverse pdf', 'rearrange pdf pages'],
  },
  'pdf-booklet': {
    name: 'PDF Booklet Maker',
    tagline: 'Impose a PDF into a printable 2-up booklet.',
    description:
      'Rearrange PDF pages into booklet (saddle-stitch) imposition so you can print, fold, and staple. All in your browser.',
    keywords: ['pdf booklet', 'booklet maker', 'pdf imposition', 'saddle stitch pdf', 'print booklet pdf'],
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
