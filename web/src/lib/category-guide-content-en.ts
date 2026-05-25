import type { ToolCategory } from '@/lib/tools/registry';
import type { CategoryGuide } from '@/lib/category-guide-content';

export const CATEGORY_GUIDES_EN: Record<ToolCategory, CategoryGuide> = {
  pdf: {
    metaTitle: 'Free PDF Tools — Merge, Split, Compress, Convert (No Upload)',
    metaDescription:
      'Merge, split, compress, unlock, sign, watermark, and convert PDF files entirely in your browser. No upload, no signup. See how each PDF tool works and which options to pick.',
    h1: 'PDF Tools Guide',
    intro:
      'Merge, split, compress, and convert PDFs without installing anything or sending files to a server. Every PDF operation runs inside your browser using pdf-lib and PDF.js, so the file never leaves your device.',
    highlights: [
      'Merge, split, and reorder pages freely',
      'Compress with image downsampling and object cleanup',
      'Password-protect, unlock, sign, and watermark',
      'Convert between PDF, Office, image, and HTML formats',
    ],
    faqs: [
      {
        q: 'Who can see the PDFs I upload?',
        a: 'No one. All PDF operations happen inside your browser and the resulting file stays on your device.',
      },
      {
        q: 'What is the file-size limit?',
        a: 'Whatever your device memory allows. A typical desktop handles 500 MB+, but on mobile we recommend staying under 100 MB.',
      },
      {
        q: 'Can I open password-protected PDFs?',
        a: 'Yes — the "PDF Unlock" tool takes your password and creates an unlocked copy. The password is held only in browser memory and never transmitted.',
      },
      {
        q: 'Can I process multiple PDFs at once?',
        a: 'Yes — merge and batch-compress tools accept multiple file drops. Large files are processed sequentially to save memory.',
      },
    ],
    keywords: [
      'PDF tools',
      'merge PDF',
      'split PDF',
      'compress PDF',
      'PDF converter',
      'free PDF',
      'online PDF',
      'no upload PDF',
      'browser PDF',
      'PDF privacy',
    ],
  },
  image: {
    metaTitle: 'Free Image Tools — Convert, Compress, Resize, Background Removal',
    metaDescription:
      'Convert JPG, PNG, WebP, HEIC, resize, crop, compress, strip EXIF, remove background, upscale. Free in-browser image tools — files never uploaded. Step-by-step guide.',
    h1: 'Image Tools Guide',
    intro:
      'Handle a single photo or an entire folder right in your browser. Convert modern formats like WebP, HEIC, and SVG, and strip metadata such as EXIF to protect your privacy.',
    highlights: [
      'Bulk compression with mozjpeg / Squoosh (visually lossless)',
      'Resize, crop, rotate, and watermark',
      'HEIC → JPG, WebP ↔ PNG, SVG → PNG conversion',
      'AI background removal and face mosaic',
    ],
    faqs: [
      {
        q: 'Can I shrink size while keeping quality?',
        a: 'Yes — the "Image Compress" tool uses mozjpeg / oxipng and typically cuts file size by 30–70% with no visible loss. Use the slider to compare side by side.',
      },
      {
        q: 'How do I handle iPhone HEIC photos?',
        a: 'Convert with "HEIC → JPG" first, then pass the result into other tools. Use "EXIF Strip" to remove location and device data.',
      },
      {
        q: 'Does AI background removal require internet?',
        a: 'Only on first use to download the model. After that it works offline. The model is ~40 MB ONNX and lives in your browser cache.',
      },
      {
        q: 'Can I batch-process many images?',
        a: 'Yes — "Batch Compress" / "Batch Resize" bundle the results into a ZIP. Hundreds of images at once are fine.',
      },
    ],
    keywords: [
      'image compress',
      'image convert',
      'JPG PNG WebP',
      'HEIC',
      'background removal',
      'image resize',
      'free image tool',
      'browser image editor',
      'EXIF',
      'image upscale',
    ],
  },
  video: {
    metaTitle: 'Free Video Tools — Compress, Trim, Convert, GIF (FFmpeg in Browser)',
    metaDescription:
      'Convert MP4, WebM, MOV, trim and merge, compress, burn subtitles, extract frames, and turn video into GIF. All powered by FFmpeg.wasm in your browser. No upload.',
    h1: 'Video Tools Guide',
    intro:
      'FFmpeg.wasm runs in your browser, so you can trim, compress, add subtitles, and convert video without uploading anything. Speed is proportional to your device.',
    highlights: [
      'MP4, WebM, MOV conversion with codec choice',
      'Trim, rotate, and merge clips',
      'Cut size with bitrate and resolution tuning',
      'Burn or extract subtitles, convert to GIF',
    ],
    faqs: [
      {
        q: 'Why is video processing slow?',
        a: 'FFmpeg runs inside your browser, which is 2–4× slower than a native desktop app. Compressing a 1-minute 1080p clip takes ~30 s–2 min on an average PC.',
      },
      {
        q: 'How long a video can I handle?',
        a: 'Usually 5–15 minutes is comfortable; longer clips should be trimmed first.',
      },
      {
        q: 'Does it work on phones?',
        a: 'Yes on iOS Safari 16+ and Chrome 105+, but stick to short, low-resolution clips due to memory limits.',
      },
      {
        q: 'Which subtitle formats are supported?',
        a: 'SRT and VTT can be burned in and extracted; the "Subtitle Convert" tool lets you swap between them.',
      },
    ],
    keywords: [
      'video compress',
      'video trim',
      'MP4 converter',
      'video to GIF',
      'subtitle burn',
      'ffmpeg browser',
      'online video editor',
      'no upload video',
    ],
  },
  gif: {
    metaTitle: 'Free GIF Tools — Maker, Optimize, Trim, Crop, Add Text',
    metaDescription:
      'Create GIFs from video, optimize palette and frames, trim, crop, resize, add text. Free GIF tools that run in your browser. No upload, no signup.',
    h1: 'GIF Tools Guide',
    intro:
      'Make a GIF from a video, polish it with trim, crop, and text overlays, and shrink the file with palette optimization — all in your browser.',
    highlights: [
      'Video → GIF with FPS / resolution control',
      'Trim, crop, and resize',
      'Add text and captions',
      'Palette optimization for 50%+ size cuts',
    ],
    faqs: [
      {
        q: 'My GIF is huge — how do I shrink it?',
        a: 'Use "GIF Optimize" and combine palette reduction, frame skipping, and lower resolution. 50–80% reductions are common.',
      },
      {
        q: 'How long a clip can I turn into GIF?',
        a: 'Keep it under ~10 seconds. Beyond that, WebM or MP4 is a better fit than GIF.',
      },
      {
        q: 'Can I make transparent GIFs?',
        a: 'Yes if the input is a transparent PNG sequence. GIFs made from video are usually opaque.',
      },
    ],
    keywords: [
      'gif maker',
      'video to gif',
      'gif optimize',
      'gif trim',
      'animated gif',
      'free gif tool',
      'online gif editor',
    ],
  },
  audio: {
    metaTitle: 'Free Audio Tools — Convert, Trim, Compress, Merge (No Upload)',
    metaDescription:
      'Convert MP3, WAV, OGG, M4A, trim, fade, adjust volume and speed, merge tracks. Audio tools that run entirely in your browser via FFmpeg.wasm.',
    h1: 'Audio Tools Guide',
    intro:
      'Trim, convert, merge, and compress music, recordings, and podcasts — all in your browser. Nothing leaves your device, so copyright and privacy are not a concern.',
    highlights: [
      'MP3, WAV, OGG, M4A two-way conversion',
      'Trim, fade, volume, and speed control',
      'Merge multiple tracks',
      'Extract audio from a video',
    ],
    faqs: [
      {
        q: 'How do I convert without losing quality?',
        a: 'Set the output bitrate to match or exceed the source. FLAC ↔ WAV is lossless.',
      },
      {
        q: 'How do I seamlessly merge tracks?',
        a: 'Add a short fade to each track end inside "Audio Merge" for clean transitions.',
      },
      {
        q: 'Can I extract music from a video file?',
        a: 'Yes — use "Audio from Video" with MP4, WebM, MOV, etc.',
      },
    ],
    keywords: [
      'audio convert',
      'audio trim',
      'MP3 converter',
      'audio merge',
      'free audio editor',
      'online audio',
      'extract audio',
    ],
  },
  docs: {
    metaTitle: 'Free Document Tools — DOCX, EPUB, Markdown, CSV / JSON / YAML',
    metaDescription:
      'Two-way conversion between DOCX, EPUB, Markdown, HTML, CSV, JSON, YAML, plus e-book editing, validation, and metadata tools. All browser-based and free.',
    h1: 'Document Tools Guide',
    intro:
      'Convert between Word, EPUB, Markdown, and HTML; edit e-book covers and metadata; swap CSV, JSON, and YAML — all without leaving the browser.',
    highlights: [
      'DOCX ↔ Markdown ↔ PDF ↔ EPUB conversion',
      'EPUB merge, split, metadata, cover replace',
      'CSV / JSON / YAML two-way conversion',
      'HWPX viewer (Hancom Office Korean format)',
    ],
    faqs: [
      {
        q: 'Are Word formatting and styles preserved?',
        a: 'Headings, lists, tables, and emphasis carry over via mammoth. Complex text boxes or shapes may be simplified.',
      },
      {
        q: 'Can I swap an EPUB cover?',
        a: 'Yes — "EPUB Cover Replace" takes a new JPG/PNG and replaces the existing cover.',
      },
      {
        q: 'Do you support Korean HWP files?',
        a: 'The new HWPX format has a viewer; conversion has its own tool. Legacy HWP (5.0) should be converted externally first.',
      },
    ],
    keywords: [
      'document converter',
      'DOCX converter',
      'EPUB editor',
      'Markdown converter',
      'CSV JSON YAML',
      'HWPX viewer',
      'free document tool',
    ],
  },
  text: {
    metaTitle: 'Free Text Tools — Diff, Replace, Regex Tester, Case Convert',
    metaDescription:
      'Diff two texts, batch replace, test regex live, change case, convert HTML entities, and more. Browser-only text utilities, no upload.',
    h1: 'Text Tools Guide',
    intro:
      'Compare, replace, and analyze text — everything stays in your browser, so even confidential drafts are safe.',
    highlights: [
      'Two-text diff (line and word level)',
      'Case and style conversion',
      'Regex tester with real-time match visualization',
      'Korean spacing correction',
    ],
    faqs: [
      {
        q: 'Is my input stored anywhere?',
        a: 'No. A refresh clears it and no network call is made.',
      },
      {
        q: 'How do I debug regex?',
        a: 'The "Regex Tester" highlights match groups, ranges, and captures so wrong groups and escapes are easy to spot.',
      },
      {
        q: 'Is diffing huge documents slow?',
        a: 'Over ~100k lines puts pressure on browser memory. Split into chunks for big jobs.',
      },
    ],
    keywords: [
      'text diff',
      'regex tester',
      'case converter',
      'find and replace',
      'free text tool',
      'compare text',
      'HTML entities',
    ],
  },
  dev: {
    metaTitle: 'Free Developer Tools — JSON, JWT, UUID, Cron, Base64',
    metaDescription:
      'Format JSON, decode JWT, generate UUID, explain Cron, encode Base64, format SQL, convert colors. Browser-only dev utilities so secrets never leave your machine.',
    h1: 'Developer Tools Guide',
    intro:
      'Day-to-day dev chores — JSON, JWT, UUID, Cron, SQL — without sending any input to a server. Safe to decode internal keys, tokens, and credentials.',
    highlights: [
      'JSON, SQL, XML formatting and validation',
      'JWT decode with expiry and signature info',
      'UUID, password, time conversion',
      'Cron expression to plain English',
    ],
    faqs: [
      {
        q: 'Does it verify JWT signatures?',
        a: 'No — only decode. Signature verification requires a secret we deliberately do not expose client-side.',
      },
      {
        q: 'Can it format huge JSON files?',
        a: 'Up to ~10 MB displays in a virtualized viewer. 50 MB+ shows a memory warning and takes longer.',
      },
      {
        q: 'Which UUID version is generated?',
        a: 'Default is v4 (random); v1 (time-based) and v7 (time + random) are selectable.',
      },
    ],
    keywords: [
      'JSON formatter',
      'JWT decoder',
      'UUID generator',
      'Cron explainer',
      'Base64',
      'SQL formatter',
      'developer tools',
      'free dev utility',
    ],
  },
  util: {
    metaTitle: 'Free Utilities — QR Code, Barcode, Hash, Unit Convert',
    metaDescription:
      'Generate and scan QR codes, build barcodes, compute hashes (MD5/SHA), convert units, count days, calculate percentages. Free browser utilities, no upload.',
    h1: 'Utility Tools Guide',
    intro:
      'Quick everyday utilities — QR, barcodes, hashing, unit conversion, D-day. Nothing is uploaded, so even sensitive inputs are safe.',
    highlights: [
      'QR codes (URL / Wi-Fi / contact)',
      'Barcodes (EAN, UPC, Code 128, …)',
      'MD5, SHA-1, SHA-256, SHA-512 hashing',
      'Unit, currency, time, percentage conversion',
    ],
    faqs: [
      {
        q: 'What can I encode in a QR?',
        a: 'URLs, plain text, Wi-Fi join info, phone, SMS, vCard contacts — and you can pick the error correction level.',
      },
      {
        q: 'Are hash results the same across browsers?',
        a: 'Yes — they use the Web Crypto API and are byte-identical everywhere.',
      },
      {
        q: 'Which barcode symbologies are supported?',
        a: 'EAN-13/8, UPC, Code 128, Code 39, ITF, MSI, and Pharmacode.',
      },
    ],
    keywords: [
      'QR code',
      'barcode',
      'hash calculator',
      'unit converter',
      'D-day',
      'percentage',
      'free utility',
    ],
  },
  security: {
    metaTitle: 'Free Security Tools — AES Encrypt, TOTP, RSA, PDF Flatten',
    metaDescription:
      'AES-256-GCM file and text encryption, TOTP 2FA, RSA key generation, PDF flatten. Browser-only security utilities using Web Crypto API.',
    h1: 'Security Tools Guide',
    intro:
      'Encrypt files, generate keys, and run 2FA workflows without a server. Only vetted algorithms — AES-256-GCM, PBKDF2, RSA-OAEP — through the Web Crypto API.',
    highlights: [
      'AES-256-GCM file and text encryption',
      'TOTP (2FA) generation and verification',
      'RSA key-pair generation',
      'PDF flatten + metadata strip',
    ],
    faqs: [
      {
        q: 'Which algorithm is used?',
        a: 'AES-256-GCM (authenticated encryption) with PBKDF2-SHA256 (310,000 iterations) to derive a key from the password. NIST and OWASP recommended.',
      },
      {
        q: 'Can I recover a lost password?',
        a: 'No — by design the password is never stored. Lose it and the data is unrecoverable.',
      },
      {
        q: 'Is the TOTP secret leaked?',
        a: 'No — the secret only lives in memory and is never persisted. A refresh erases it.',
      },
    ],
    keywords: [
      'file encryption',
      'text encryption',
      'TOTP 2FA',
      'RSA key',
      'AES-256',
      'free security tool',
      'web crypto',
    ],
  },
  ai: {
    metaTitle: 'Free AI Tools — Background Removal, Upscale, Face Blur',
    metaDescription:
      'AI background removal (@imgly), image upscaling (ESRGAN), automatic face blur (MediaPipe). Inference runs in your browser; works offline once the model is cached.',
    h1: 'AI Tools Guide',
    intro:
      'AI models run on-device using ONNX / TensorFlow.js. After the first download the models stay cached and work offline.',
    highlights: [
      'AI background removal (people / objects)',
      'Image upscaling (ESRGAN 2x / 4x)',
      'Automatic face detection + mosaic',
      'Models cache to disk and work offline',
    ],
    faqs: [
      {
        q: 'Does AI inference use the GPU?',
        a: 'When the browser supports WebGL/WebGPU, yes; otherwise it falls back to CPU and runs slower.',
      },
      {
        q: 'Why is the first use slow?',
        a: 'The model file (40–100 MB) is downloaded once. Subsequent runs load from cache instantly.',
      },
      {
        q: 'How can I improve output quality?',
        a: 'Use the highest input resolution you can. Inputs under 256 px give the model too little to work with and outputs may look blurry.',
      },
    ],
    keywords: [
      'AI background removal',
      'image upscale',
      'face mosaic',
      'ESRGAN',
      'free AI tool',
      'browser AI',
      'no upload AI',
    ],
  },
};
