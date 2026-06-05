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
