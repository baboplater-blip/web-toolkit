/**
 * English "X vs Y" comparison pages.
 *
 * These target informational/comparison long-tail queries ("png vs jpg",
 * "merge vs split pdf", "md5 vs sha256") that the transactional /en/tools and
 * how-to /en/guide pages don't capture. Each comparison links out to the
 * relevant in-browser tool(s).
 *
 * Every `toolId` referenced here must be a curated id in `lib/en-tools.ts`
 * (so /en/tools/{id} exists) OR a valid registry id (falls back to the Korean
 * tool page). Keep them curated where possible.
 */

import type { ToolCategory } from '@/lib/tools/registry';

export interface CompareOption {
  /** Short label — a tool name or a format ("PNG"). */
  label: string;
  /** Curated tool id for the CTA, if any. */
  toolId?: string;
  /** One-line "best for". */
  best: string;
  pros: string[];
  cons: string[];
}

export interface Compare {
  slug: string;
  category: ToolCategory;
  /** <title> seed. */
  title: string;
  h1: string;
  /** meta description (~150 chars). */
  description: string;
  intro: string;
  options: [CompareOption, CompareOption];
  /** Plain-English "which should you pick". */
  verdict: string;
  faqs: Array<{ q: string; a: string }>;
  keywords: string[];
  /** 관련 변환 매트릭스 slug (compare ↔ convert 상호 링크). */
  relatedConverts?: string[];
}

export const COMPARES: Compare[] = [
  {
    slug: 'merge-vs-split-pdf',
    category: 'pdf',
    title: 'Merge vs Split PDF — Which Do You Need?',
    h1: 'Merge vs Split PDF',
    description:
      'Merge combines several PDFs into one file; split breaks one PDF into pages or smaller files. Here is when to use each — free, in your browser.',
    intro:
      'Merging and splitting are opposites. Merge takes several PDFs and joins them into a single document; split takes one PDF and extracts pages or breaks it into separate files. Both run entirely in your browser — your files are never uploaded.',
    options: [
      {
        label: 'Merge PDF',
        toolId: 'pdf-merge',
        best: 'You have multiple PDFs that should become one document.',
        pros: [
          'Combine scans, chapters or reports into a single file',
          'Reorder pages and files before exporting',
          'One file is easier to share and archive',
        ],
        cons: ['Not for pulling a few pages out of a large PDF'],
      },
      {
        label: 'Split PDF',
        toolId: 'pdf-split',
        best: 'You have one big PDF and need specific pages or smaller parts.',
        pros: [
          'Extract a page range into its own PDF',
          'Break a large PDF into per-page or per-chapter files',
          'Smaller files upload and email more easily',
        ],
        cons: ['Not for joining separate documents'],
      },
    ],
    verdict:
      'Going from many files to one? Merge. Going from one file to many (or pulling out pages)? Split. You can also merge first, then split the result to reorganize a document end to end.',
    faqs: [
      {
        q: 'Can I merge and split in the same session?',
        a: 'Yes. Merge your PDFs into one file, download it, then open the split tool to extract or divide it. Everything stays in your browser.',
      },
      {
        q: 'Will merging or splitting reduce quality?',
        a: 'No. Both operate on the existing PDF pages without re-encoding, so text and images keep their original quality.',
      },
    ],
    keywords: ['merge vs split pdf', 'combine pdf', 'split pdf pages', 'pdf merge or split'],
  },
  {
    slug: 'heic-vs-jpg',
    category: 'image',
    title: 'HEIC vs JPG — Which Image Format Should You Use?',
    h1: 'HEIC vs JPG',
    description:
      'HEIC saves space on iPhones but is poorly supported elsewhere; JPG works everywhere. When to convert HEIC to JPG — free, in your browser.',
    intro:
      'HEIC is the high-efficiency format iPhones use by default; JPG (JPEG) is the universal photo format. HEIC produces smaller files at similar quality, but many apps, Windows tools and websites cannot open it — which is why converting to JPG is so common.',
    options: [
      {
        label: 'HEIC',
        toolId: 'image-heic-to-jpg',
        best: 'Storing photos on Apple devices where space matters.',
        pros: [
          'Roughly half the size of JPG at similar quality',
          'Supports higher bit depth and transparency',
          'Default on modern iPhones',
        ],
        cons: [
          'Poor support on Windows, older software and the web',
          'Hard to share without converting',
        ],
      },
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: 'Sharing, uploading or printing where compatibility matters.',
        pros: [
          'Opens on virtually every device and app',
          'Accepted by every website and printer',
          'Universally editable',
        ],
        cons: ['Larger files than HEIC at the same quality'],
      },
    ],
    verdict:
      'Keep HEIC for on-device storage on Apple hardware. The moment you need to share, upload or open a photo on Windows or the web, convert HEIC to JPG. The converter runs in your browser, so private photos never leave your device.',
    faqs: [
      {
        q: 'Does converting HEIC to JPG lose quality?',
        a: 'There is a small, usually invisible quality drop because JPG re-encodes the image. At high quality settings the difference is hard to notice.',
      },
      {
        q: 'Can I convert many HEIC files at once?',
        a: 'Yes — the HEIC to JPG converter supports batch conversion and bundles the results for download, all in your browser.',
      },
    ],
    keywords: ['heic vs jpg', 'heic or jpeg', 'convert heic', 'iphone photo format'],
    relatedConverts: ['heic-to-jpg', 'heic-to-png'],
  },
  {
    slug: 'png-vs-jpg',
    category: 'image',
    title: 'PNG vs JPG — Which Should You Choose?',
    h1: 'PNG vs JPG',
    description:
      'PNG is lossless with transparency, best for graphics and screenshots; JPG is smaller, best for photos. How to choose — convert free in your browser.',
    intro:
      'PNG and JPG solve different problems. PNG is lossless and supports transparency, making it ideal for logos, screenshots and graphics with sharp edges or text. JPG uses lossy compression that excels at photographs, producing much smaller files where a little quality loss is invisible.',
    options: [
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: 'Logos, screenshots, icons and anything with transparency or text.',
        pros: [
          'Lossless — no compression artifacts',
          'Supports transparency (alpha)',
          'Crisp edges and text',
        ],
        cons: ['Much larger files for photographs'],
      },
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: 'Photographs and richly colored images where size matters.',
        pros: [
          'Very small files for photos',
          'Universally supported',
          'Adjustable quality vs size',
        ],
        cons: ['Lossy — soft edges, no transparency, artifacts on text'],
      },
    ],
    verdict:
      'Photo? Use JPG. Logo, screenshot, icon, or anything needing transparency or razor-sharp text? Use PNG. You can convert either way in seconds with the in-browser image converter.',
    faqs: [
      {
        q: 'Which is better for screenshots?',
        a: 'PNG. Screenshots contain text and sharp UI edges that JPG compression smears; PNG keeps them crisp.',
      },
      {
        q: 'Can I convert PNG to JPG to save space?',
        a: 'Yes, and it often shrinks photo-like PNGs dramatically. Just remember JPG drops transparency, so the background becomes solid.',
      },
    ],
    keywords: ['png vs jpg', 'jpg or png', 'png jpeg difference', 'best image format'],
    relatedConverts: ['png-to-jpg', 'jpg-to-png'],
  },
  {
    slug: 'webp-vs-png',
    category: 'image',
    title: 'WebP vs PNG — Smaller Files or Maximum Support?',
    h1: 'WebP vs PNG',
    description:
      'WebP makes much smaller files with transparency and is great for the web; PNG has universal support. Which to pick — convert free in your browser.',
    intro:
      'WebP is a modern format that supports both lossy and lossless compression plus transparency, typically producing files 25–35% smaller than PNG. PNG is older but supported literally everywhere. The trade-off is file size versus universal compatibility.',
    options: [
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: 'Website images where page weight and load speed matter.',
        pros: [
          'Smaller than PNG with the same quality',
          'Supports transparency and animation',
          'Supported by all modern browsers',
        ],
        cons: ['Not ideal for very old software or some print workflows'],
      },
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: 'Maximum compatibility and lossless archival.',
        pros: [
          'Opens in every tool, old and new',
          'Lossless and predictable',
          'Safe choice for editing pipelines',
        ],
        cons: ['Larger files than WebP'],
      },
    ],
    verdict:
      'Building a fast website? Use WebP to cut image weight. Need a file that any program—including old ones—will open, or a lossless master to keep editing? Use PNG. Convert between them instantly in your browser.',
    faqs: [
      {
        q: 'Is WebP lossless like PNG?',
        a: 'WebP has a lossless mode that rivals PNG, plus a lossy mode for even smaller files. The converter lets you pick quality.',
      },
      {
        q: 'Do all browsers support WebP?',
        a: 'Yes, all current major browsers support WebP. Very old software may not, which is when PNG is the safer choice.',
      },
    ],
    keywords: ['webp vs png', 'webp or png', 'convert webp', 'webp png difference'],
    relatedConverts: ['webp-to-png', 'png-to-webp'],
  },
  {
    slug: 'jpg-to-pdf-vs-pdf-to-jpg',
    category: 'pdf',
    title: 'JPG to PDF vs PDF to JPG — Which Direction?',
    h1: 'JPG to PDF vs PDF to JPG',
    description:
      'JPG to PDF bundles images into one document; PDF to JPG turns PDF pages back into images. Pick the right direction — free, in your browser.',
    intro:
      'These two tools move between images and PDFs in opposite directions. JPG to PDF takes one or more images and packs them into a single PDF document; PDF to JPG renders each PDF page into a standalone image. Both keep everything on your device.',
    options: [
      {
        label: 'JPG to PDF',
        toolId: 'pdf-from-jpg',
        best: 'Turning scanned photos or receipts into one shareable document.',
        pros: [
          'Combine many images into one PDF',
          'Control page size and order',
          'Great for scans, receipts and portfolios',
        ],
        cons: ['Output is a document, not editable images'],
      },
      {
        label: 'PDF to JPG',
        toolId: 'pdf-to-jpg',
        best: 'Pulling page images out of a PDF for slides or thumbnails.',
        pros: [
          'Get a JPG/PNG per page',
          'Use pages as previews or social images',
          'Pick the resolution',
        ],
        cons: ['Text becomes part of the image (not selectable)'],
      },
    ],
    verdict:
      'Have images and want a single document? Use JPG to PDF. Have a PDF and want picture files of its pages? Use PDF to JPG. Both run locally, so sensitive scans never leave your browser.',
    faqs: [
      {
        q: 'Will text stay selectable after PDF to JPG?',
        a: 'No. Converting a page to JPG turns everything into pixels, so the text is no longer selectable. Keep the PDF if you need the text.',
      },
      {
        q: 'Can I control the PDF page size when converting from JPG?',
        a: 'Yes — the JPG to PDF tool lets you choose page size and fit, so images are not stretched or cropped unexpectedly.',
      },
    ],
    keywords: ['jpg to pdf vs pdf to jpg', 'image to pdf', 'pdf to image', 'convert pdf images'],
    relatedConverts: ['jpg-to-pdf', 'pdf-to-jpg'],
  },
  {
    slug: 'compress-vs-resize-image',
    category: 'image',
    title: 'Compress vs Resize Images — What Shrinks File Size?',
    h1: 'Compress vs Resize Images',
    description:
      'Compressing lowers quality to cut file size at the same dimensions; resizing changes pixel dimensions. Which to use — free, in your browser.',
    intro:
      'Both reduce file size, but differently. Compressing keeps the same width and height while lowering quality (and data); resizing changes the actual pixel dimensions. Often the best results come from doing both — resize to the dimensions you need, then compress.',
    options: [
      {
        label: 'Compress',
        toolId: 'image-batch-compress',
        best: 'Keeping the same dimensions but cutting file size.',
        pros: [
          'Smaller files at the same width/height',
          'Batch-process many images at once',
          'Adjustable quality vs size',
        ],
        cons: ['Too much compression adds visible artifacts'],
      },
      {
        label: 'Resize',
        toolId: 'image-resize',
        best: 'The image is physically larger than it needs to be.',
        pros: [
          'Match an exact pixel size or percentage',
          'Big dimension cuts shrink files dramatically',
          'Keeps aspect ratio locked',
        ],
        cons: ['Shrinking loses detail you cannot get back'],
      },
    ],
    verdict:
      'If the dimensions are already right but the file is heavy, compress. If a 6000px photo only needs to be 1200px wide, resize first — then compress for the smallest possible file. Both run in your browser.',
    faqs: [
      {
        q: 'Should I resize or compress first?',
        a: 'Resize first to the dimensions you actually need, then compress. Resizing removes the most data, and compressing cleans up the rest.',
      },
      {
        q: 'Does compressing change the image dimensions?',
        a: 'No. Compression keeps the same width and height; only resizing changes pixel dimensions.',
      },
    ],
    keywords: ['compress vs resize image', 'reduce image size', 'shrink image file', 'image size vs quality'],
  },
  {
    slug: 'md5-vs-sha256',
    category: 'security',
    title: 'MD5 vs SHA-256 — Which Checksum Should You Use?',
    h1: 'MD5 vs SHA-256',
    description:
      'MD5 is fast but broken for security; SHA-256 is the modern standard. When each is fine — compute both free in your browser.',
    intro:
      'MD5 and SHA-256 both produce a fixed-length fingerprint of a file. MD5 is faster and still common for quick, non-security file checks, but it is cryptographically broken. SHA-256 is the modern standard for anything where tampering matters.',
    options: [
      {
        label: 'MD5',
        toolId: 'file-hash',
        best: 'Quick, casual integrity checks where security is not a concern.',
        pros: [
          'Very fast',
          'Short, convenient hash',
          'Still widely published for downloads',
        ],
        cons: [
          'Cryptographically broken — collisions are practical',
          'Never use it to prove a file was not tampered with',
        ],
      },
      {
        label: 'SHA-256',
        toolId: 'file-hash',
        best: 'Verifying downloads, signatures and anything security-related.',
        pros: [
          'Collision-resistant and trusted',
          'The standard for software releases',
          'Recommended for any integrity guarantee',
        ],
        cons: ['Slightly slower and a longer hash (rarely an issue)'],
      },
    ],
    verdict:
      'Use SHA-256 by default — it is the right choice for verifying downloads or detecting tampering. Only reach for MD5 when you just need a fast, throwaway fingerprint and security does not matter. The hash tool computes both at once.',
    faqs: [
      {
        q: 'Is MD5 safe for passwords?',
        a: 'No. MD5 should never be used for passwords or security. Even SHA-256 alone is not enough for passwords — those need a slow, salted algorithm like bcrypt or Argon2.',
      },
      {
        q: 'Why do my two files have the same MD5 but different content?',
        a: 'That is an MD5 collision, and it is exactly why MD5 is unsafe for security. SHA-256 does not have practical collisions.',
      },
    ],
    keywords: ['md5 vs sha256', 'md5 or sha256', 'checksum algorithm', 'which hash to use'],
  },
  {
    slug: 'base64-vs-url-encoding',
    category: 'dev',
    title: 'Base64 vs URL Encoding — What Is the Difference?',
    h1: 'Base64 vs URL Encoding',
    description:
      'Base64 turns binary into safe ASCII text; URL encoding escapes characters unsafe in URLs. When to use each — free tools in your browser.',
    intro:
      'They sound similar but solve different problems. Base64 encodes arbitrary binary data into a safe ASCII string (used for embedding images, tokens and attachments). URL (percent) encoding escapes individual characters that are unsafe in a URL, like spaces and ampersands.',
    options: [
      {
        label: 'Base64',
        toolId: 'base64',
        best: 'Embedding binary data (images, files, tokens) as text.',
        pros: [
          'Safely represents any binary data as ASCII',
          'Used in data URLs, JWTs and email attachments',
          'Reversible with no data loss',
        ],
        cons: [
          'Inflates size by ~33%',
          'Not meant for making text URL-safe',
        ],
      },
      {
        label: 'URL Encoding',
        toolId: 'url-encoder',
        best: 'Putting text safely into a URL or query string.',
        pros: [
          'Escapes only unsafe characters',
          'Keeps URLs and query parameters valid',
          'Minimal size change',
        ],
        cons: ['Not a way to encode binary files'],
      },
    ],
    verdict:
      'Embedding a file or token as text? Base64. Putting a value into a URL or query string? URL-encode it. They are sometimes combined (Base64url), but pick based on whether you are handling binary data or building a URL.',
    faqs: [
      {
        q: 'What is Base64url?',
        a: 'A URL-safe variant of Base64 that swaps the "+" and "/" characters for "-" and "_" so the result can sit in a URL without extra escaping. JWTs use it.',
      },
      {
        q: 'Does Base64 encrypt data?',
        a: 'No. Base64 is encoding, not encryption — anyone can decode it. Use a real encryption tool if you need secrecy.',
      },
    ],
    keywords: ['base64 vs url encoding', 'percent encoding', 'base64 url safe', 'encoding difference'],
  },
  {
    slug: 'mp4-vs-webm',
    category: 'video',
    title: 'MP4 vs WebM — Which Video Format?',
    h1: 'MP4 vs WebM',
    description:
      'MP4 plays everywhere; WebM is smaller and open, great for the web. Which to use — convert free in your browser.',
    intro:
      'MP4 is the universal video container that plays on virtually every device and platform. WebM is a modern, royalty-free format that is smaller and supports transparency, but it is not as widely supported. The choice is compatibility versus a lighter, web-optimized file.',
    options: [
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: 'Sharing, uploading and maximum device compatibility.',
        pros: ['Plays on every device, social app and player', 'The default for uploads', 'Good compression'],
        cons: ['No transparent video', 'Not royalty-free'],
      },
      {
        label: 'WebM',
        toolId: 'video-convert',
        best: 'Web pages where file size and openness matter.',
        pros: ['Smaller files for the web', 'Open and royalty-free', 'Supports transparency'],
        cons: ['Unsupported on some devices/editors', 'Patchy social upload support'],
      },
    ],
    verdict:
      'Need it to play anywhere or upload to social? Use MP4. Embedding on a fast website or need transparency? Use WebM. You can convert either way in your browser.',
    faqs: [
      { q: 'Which is better for YouTube or Instagram?', a: 'MP4. Social platforms universally accept MP4, while WebM support is inconsistent.' },
      { q: 'Is WebM higher quality than MP4?', a: 'At the same bitrate they are comparable; WebM (VP9/AV1) can be more efficient, meaning smaller files at similar quality.' },
    ],
    keywords: ['mp4 vs webm', 'webm or mp4', 'best video format', 'convert mp4 webm'],
    relatedConverts: ['webm-to-mp4', 'mp4-to-webm'],
  },
  {
    slug: 'mp3-vs-wav',
    category: 'audio',
    title: 'MP3 vs WAV — Which Audio Format?',
    h1: 'MP3 vs WAV',
    description:
      'MP3 is small and universal; WAV is lossless and big, best for editing. When to use each — convert free in your browser.',
    intro:
      'MP3 is the universal lossy format — small files that play everywhere, ideal for sharing and listening. WAV is uncompressed and lossless, preserving the full original audio, which is best for editing and mastering but produces very large files.',
    options: [
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'Sharing, streaming and everyday listening.',
        pros: ['Tiny files', 'Plays on every device and app', 'Adjustable bitrate'],
        cons: ['Lossy — quality below the original', 'Not for archiving or heavy editing'],
      },
      {
        label: 'WAV',
        toolId: 'audio-convert',
        best: 'Editing, mastering and lossless archiving.',
        pros: ['Fully lossless original audio', 'Standard for editing', 'Broad compatibility'],
        cons: ['Very large files', 'Inefficient for sharing/streaming'],
      },
    ],
    verdict:
      'Sharing or listening? Use MP3. Editing audio or keeping a lossless master? Use WAV — then export to MP3 when you are done. Convert either way in your browser.',
    faqs: [
      { q: 'Does converting WAV to MP3 lose quality?', a: 'Yes, slightly — MP3 is lossy. At higher bitrates (256–320 kbps) the difference is hard to hear.' },
      { q: 'Can I get original quality back from an MP3?', a: 'No. Converting MP3 to WAV makes a lossless container but cannot restore detail already lost in the MP3.' },
    ],
    keywords: ['mp3 vs wav', 'wav or mp3', 'audio format quality', 'convert wav mp3'],
    relatedConverts: ['wav-to-mp3', 'mp3-to-wav'],
  },
  {
    slug: 'jpg-vs-webp',
    category: 'image',
    title: 'JPG vs WebP — Which for Photos on the Web?',
    h1: 'JPG vs WebP',
    description:
      'WebP makes smaller files than JPG at similar quality and supports transparency; JPG works everywhere. Convert free in your browser.',
    intro:
      'JPG is the universal photo format, supported by every device, app and printer. WebP is a modern format that produces noticeably smaller files at similar quality and adds transparency and animation — ideal for the web, though not for very old software.',
    options: [
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: 'Maximum compatibility, printing and universal sharing.',
        pros: ['Opens on every device and app', 'Accepted by every printer and site', 'Adjustable quality'],
        cons: ['Larger than WebP at the same quality', 'No transparency'],
      },
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: 'Website photos where page weight and speed matter.',
        pros: ['Smaller than JPG at similar quality', 'Supports transparency and animation', 'Supported by all modern browsers'],
        cons: ['Not for very old software', 'Some print workflows prefer JPG'],
      },
    ],
    verdict:
      'Building a fast website? Use WebP to cut image weight. Need a photo that opens or prints anywhere? Use JPG. Convert between them instantly in your browser.',
    faqs: [
      { q: 'Is WebP always smaller than JPG?', a: 'Usually, at similar visual quality WebP is 25–35% smaller. For some images the gap is smaller, but WebP rarely loses.' },
      { q: 'Should I switch my whole site to WebP?', a: 'For photos, WebP with a JPG fallback is a common, safe choice. Modern browsers all support WebP.' },
    ],
    keywords: ['jpg vs webp', 'webp or jpg', 'best web image format', 'convert jpg webp'],
    relatedConverts: ['jpg-to-webp', 'webp-to-jpg'],
  },
  {
    slug: 'epub-vs-pdf',
    category: 'docs',
    title: 'EPUB vs PDF — Which for E-books?',
    h1: 'EPUB vs PDF',
    description:
      'EPUB reflows to any screen; PDF keeps a fixed layout. Which to use for e-books and documents — convert free in your browser.',
    intro:
      'EPUB and PDF solve different reading problems. EPUB reflows text to fit any screen and lets readers adjust font size — ideal for novels and long reading on e-readers and phones. PDF keeps a fixed, print-exact layout — ideal for documents where formatting must not change, like forms, reports and illustrated books.',
    options: [
      {
        label: 'EPUB',
        toolId: 'pdf-to-epub',
        best: 'Reflowable reading on e-readers and phones (novels, long text).',
        pros: ['Text reflows to any screen', 'Reader adjusts font and size', 'Smaller, e-reader standard'],
        cons: ['Not for fixed layouts', 'Renders differ by reader'],
      },
      {
        label: 'PDF',
        toolId: 'epub-to-pdf',
        best: 'Fixed layout for printing, forms and illustrated documents.',
        pros: ['Identical layout everywhere', 'Best for print', 'Universal viewing'],
        cons: ['Hard to read on small screens', 'No reflow or font resizing'],
      },
    ],
    verdict:
      'Reading a novel on a phone or e-reader? Use EPUB. Printing, sharing forms, or layout must stay exact? Use PDF. Convert between them in your browser.',
    faqs: [
      { q: 'Which is better for a phone?', a: 'EPUB. It reflows text to the screen so you are not pinching and zooming like with a fixed PDF.' },
      { q: 'Will converting EPUB to PDF keep the layout?', a: 'It produces a fixed-layout PDF from the EPUB content. Exact pagination depends on the source, but text and images are preserved.' },
    ],
    keywords: ['epub vs pdf', 'pdf or epub', 'best ebook format', 'convert epub pdf'],
    relatedConverts: ['epub-to-pdf'],
  },
  {
    slug: 'csv-vs-json',
    category: 'docs',
    title: 'CSV vs JSON — Which Data Format?',
    h1: 'CSV vs JSON',
    description:
      'CSV is a flat table every spreadsheet reads; JSON holds nested structures for APIs and config. Which to use — convert free in your browser.',
    intro:
      'CSV and JSON store data in different shapes. CSV is a flat, comma-separated table — perfect for spreadsheets and simple row/column data that humans skim. JSON nests objects and arrays — perfect for APIs, config and anything hierarchical. The right choice depends on whether your data is a table or a tree.',
    options: [
      {
        label: 'CSV',
        toolId: 'csv-json',
        best: 'Flat tabular data for spreadsheets, exports and imports.',
        pros: ['Opens in every spreadsheet and database', 'Tiny and simple', 'Easy to skim and diff by row'],
        cons: ['No nested or hierarchical data', 'No types or formatting', 'Encoding/delimiter pitfalls'],
      },
      {
        label: 'JSON',
        toolId: 'csv-json',
        best: 'Nested data for APIs, config and app state.',
        pros: ['Represents nested objects and arrays', 'Parsed natively by every language', 'Has basic types (number, bool, null)'],
        cons: ['Awkward to view as a table', 'Larger than CSV', 'Tedious to bulk-edit by hand'],
      },
    ],
    verdict:
      'A simple table of rows and columns? Use CSV. Nested data, an API payload or config? Use JSON. Convert either way instantly in your browser — no upload.',
    faqs: [
      { q: 'Can every CSV become JSON?', a: 'Yes — each row becomes an object keyed by the header. Going back from deeply nested JSON to CSV may need flattening first.' },
      { q: 'Which is better for Excel?', a: 'CSV. Excel opens it directly as a sheet; JSON needs importing or conversion first.' },
    ],
    keywords: ['csv vs json', 'json or csv', 'data format', 'convert csv json'],
    relatedConverts: ['csv-to-json', 'json-to-csv'],
  },
  {
    slug: 'mp4-vs-mov',
    category: 'video',
    title: 'MP4 vs MOV — Which Video Format?',
    h1: 'MP4 vs MOV',
    description:
      'MOV is great for editing on Apple devices; MP4 plays and uploads everywhere. Which to use — convert free in your browser.',
    intro:
      'MOV and MP4 are close cousins — both often hold the same H.264/H.265 video. MOV is Apple’s QuickTime container, the default for iPhone recording and smooth in Mac editing. MP4 is the universal delivery container that plays on every device and uploads cleanly to every platform.',
    options: [
      {
        label: 'MOV',
        toolId: 'video-convert',
        best: 'Recording and editing in the Apple ecosystem.',
        pros: ['Default for iPhone recording', 'Smooth in Mac editing apps', 'Holds high-quality footage'],
        cons: ['Weak support on Windows and the web', 'Larger files', 'Patchy on social uploads'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: 'Sharing, uploading and playing anywhere.',
        pros: ['Plays on every device and platform', 'The upload standard for social and web', 'Good compression'],
        cons: ['For delivery more than editing', 'Transparency not supported'],
      },
    ],
    verdict:
      'Editing on a Mac or straight off an iPhone? MOV is fine. Sharing, uploading or playing across devices? Convert to MP4. The switch is quick in your browser.',
    faqs: [
      { q: 'Does converting MOV to MP4 lose quality?', a: 'If it just rewraps the same codec, quality is essentially unchanged. Re-encoding adds a small, usually unnoticeable loss.' },
      { q: 'Why won’t my MOV upload?', a: 'Some platforms reject MOV or its codec. Converting to MP4 (H.264) is the most compatible fix.' },
    ],
    keywords: ['mp4 vs mov', 'mov or mp4', 'best video format', 'convert mov mp4'],
    relatedConverts: ['mov-to-mp4', 'mp4-to-mov'],
  },
  {
    slug: 'docx-vs-pdf',
    category: 'docs',
    title: 'DOCX vs PDF — Which to Send?',
    h1: 'DOCX vs PDF',
    description:
      'DOCX stays editable; PDF locks the layout so it looks identical everywhere. Which to send — convert free in your browser.',
    intro:
      'DOCX and PDF sit at two ends of a document’s life. DOCX (Word) is for writing and collaboration — fully editable, with tracked changes and comments. PDF is for delivery — a fixed layout that looks identical on every device and can’t be accidentally altered. Most documents start as DOCX and ship as PDF.',
    options: [
      {
        label: 'DOCX',
        toolId: 'docx-to-pdf',
        best: 'Writing, editing and collaborating on a document.',
        pros: ['Fully editable text and formatting', 'Comments and tracked changes', 'The Office standard for drafts'],
        cons: ['Layout shifts between viewers', 'Needs Word or a compatible app', 'Easy to alter by accident'],
      },
      {
        label: 'PDF',
        toolId: 'pdf-to-word',
        best: 'Sending a final document that must look the same everywhere.',
        pros: ['Identical layout on every device', 'Standard for sharing, printing, signing', 'Hard to alter accidentally'],
        cons: ['Not made for free editing', 'Needs converting to edit again'],
      },
    ],
    verdict:
      'Still writing or collaborating? Keep it as DOCX. Sending a final version for review, print or signature? Export to PDF. Need to edit a PDF again? Convert it back to Word in your browser.',
    faqs: [
      { q: 'Will DOCX → PDF keep my formatting?', a: 'Yes — PDF freezes the current layout, so it looks the same everywhere. That’s exactly why it’s preferred for sending.' },
      { q: 'Can I turn a PDF back into Word?', a: 'Yes. The PDF → Word tool extracts the text into an editable .doc you can open in Word or Hancom.' },
    ],
    keywords: ['docx vs pdf', 'word or pdf', 'send document format', 'convert docx pdf'],
    relatedConverts: ['docx-to-pdf', 'pdf-to-word'],
  },
  {
    slug: 'aac-vs-mp3',
    category: 'audio',
    title: 'AAC vs MP3 — Which Audio Format?',
    h1: 'AAC vs MP3',
    description:
      'AAC sounds better at low bitrates; MP3 plays on absolutely everything. Which to use — convert free in your browser.',
    intro:
      'AAC and MP3 are both lossy audio formats, but AAC is the newer successor. At the same bitrate AAC usually sounds better, especially at low bitrates, which is why it’s the default for streaming and Apple devices. MP3 is older but plays on literally every device, app and car stereo ever made.',
    options: [
      {
        label: 'AAC',
        toolId: 'audio-convert',
        best: 'Streaming, Apple devices and low-bitrate audio.',
        pros: ['Better quality than MP3 at the same size', 'The streaming/broadcast standard', 'Efficient at low bitrates'],
        cons: ['Slightly less universal than MP3', 'Raw AAC has a bare container', 'Patchy on very old devices'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'Maximum compatibility across every device.',
        pros: ['Plays on absolutely everything', 'Adjustable bitrate', 'Tiny, well-understood files'],
        cons: ['Slightly worse quality per size than AAC', 'Weaker at very low bitrates'],
      },
    ],
    verdict:
      'Want the best sound per megabyte or you live in Apple’s ecosystem? Use AAC. Need a file that plays on any device, old or new? Use MP3. Convert either way in your browser.',
    faqs: [
      { q: 'Is AAC noticeably better than MP3?', a: 'At low bitrates, yes — AAC holds detail MP3 loses. At high bitrates both sound great and the difference is hard to hear.' },
      { q: 'Does converting MP3 to AAC improve quality?', a: 'No. Both are lossy, so converting can’t add back detail already lost. Convert from the highest-quality source you have.' },
    ],
    keywords: ['aac vs mp3', 'mp3 or aac', 'best audio format', 'convert aac mp3'],
    relatedConverts: ['mp3-to-aac', 'aac-to-mp3'],
  },
  {
    slug: 'webp-vs-avif',
    category: 'image',
    title: 'WebP vs AVIF — Which Next-Gen Image Format?',
    h1: 'WebP vs AVIF',
    description:
      'AVIF compresses smaller; WebP has wider support. Which next-gen image format to use — convert free in your browser.',
    intro:
      'WebP and AVIF are both modern formats that beat JPG and PNG on file size. AVIF (AV1-based) usually compresses smaller at the same quality and supports HDR, but encodes slower and isn’t supported everywhere yet. WebP is a few years older, so it’s supported by virtually every current browser and many editors.',
    options: [
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: 'Web images that need broad, reliable support today.',
        pros: ['Smaller than JPG/PNG', 'Supported by all current browsers', 'Transparency and animation'],
        cons: ['Slightly larger than AVIF', 'Not for very old software'],
      },
      {
        label: 'AVIF',
        toolId: 'image-convert',
        best: 'Squeezing the smallest possible file at high quality.',
        pros: ['Best-in-class compression', 'Wide color gamut and HDR', 'Transparency supported'],
        cons: ['Slower to encode', 'Unsupported on older browsers/apps', 'Narrower editor support'],
      },
    ],
    verdict:
      'Want the smallest file and your audience is on modern browsers? Use AVIF. Want safe, broad support right now? Use WebP. Convert between them in your browser.',
    faqs: [
      { q: 'Is AVIF always smaller than WebP?', a: 'Usually, at the same quality AVIF is smaller — often noticeably so on detailed photos. The gap narrows on simple graphics.' },
      { q: 'Can every browser open AVIF?', a: 'Most current browsers can, but support is newer than WebP. For maximum reach, WebP with a JPG fallback is still the safest.' },
    ],
    keywords: ['webp vs avif', 'avif or webp', 'next-gen image format', 'convert webp avif'],
    relatedConverts: ['webp-to-avif', 'avif-to-webp'],
  },
  {
    slug: 'svg-vs-png',
    category: 'image',
    title: 'SVG vs PNG — Which for Logos and Icons?',
    h1: 'SVG vs PNG',
    description:
      'SVG scales to any size with no blur; PNG is a fixed-pixel raster. Which to use for logos and icons — convert free in your browser.',
    intro:
      'SVG and PNG solve different problems. SVG is a vector — it’s drawn from math, so it stays razor-sharp at any size and edits as code, ideal for logos, icons and simple shapes. PNG is a raster of fixed pixels with lossless quality and transparency — ideal for screenshots, detailed graphics and anything photographic SVG can’t represent.',
    options: [
      {
        label: 'SVG',
        toolId: 'image-svg-to-png',
        best: 'Logos, icons and shapes that must scale crisply.',
        pros: ['Infinitely sharp at any size', 'Tiny for simple shapes', 'Editable as code'],
        cons: ['Cannot show photographs', 'Unsupported in some apps/documents', 'Heavy for complex art'],
      },
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: 'Screenshots and detailed graphics with transparency.',
        pros: ['Lossless, no artifacts', 'Transparency supported', 'Opens everywhere'],
        cons: ['Blurs when scaled up', 'Large for big images', 'Not a vector'],
      },
    ],
    verdict:
      'A logo or icon that must look sharp at every size? Use SVG. A screenshot or detailed image, or you need it to open everywhere? Use PNG. Rasterize SVG to PNG in your browser when you need a fixed image.',
    faqs: [
      { q: 'Can I convert PNG back to SVG?', a: 'Not truly — PNG is pixels, so it can only be traced approximately. Keep the original vector if you have it.' },
      { q: 'Why does my SVG logo look blurry as PNG?', a: 'Export the PNG at a higher resolution. A raster has fixed pixels, so size it for the largest place you’ll use it.' },
    ],
    keywords: ['svg vs png', 'png or svg', 'logo image format', 'svg to png'],
    relatedConverts: ['svg-to-png'],
  },
  {
    slug: 'flac-vs-mp3',
    category: 'audio',
    title: 'FLAC vs MP3 — Lossless or Small?',
    h1: 'FLAC vs MP3',
    description:
      'FLAC is lossless for archiving; MP3 is small and plays everywhere. Which to use — convert free in your browser.',
    intro:
      'FLAC and MP3 sit at opposite ends. FLAC is lossless — it preserves the exact original audio, perfect for archiving and editing, but the files are large. MP3 is lossy — it throws away inaudible detail to make tiny files that play on every device ever made, perfect for sharing and portable listening.',
    options: [
      {
        label: 'FLAC',
        toolId: 'audio-convert',
        best: 'Archiving and editing where the original must be preserved.',
        pros: ['Lossless — exact original audio', 'Smaller than WAV', 'Rich metadata and tags'],
        cons: ['Much larger than MP3', 'Unsupported on some devices', 'Limited over Bluetooth'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'Sharing and portable listening on any device.',
        pros: ['Plays on absolutely everything', 'Tiny files', 'Adjustable bitrate'],
        cons: ['Lossy — below the original', 'Not for archiving masters'],
      },
    ],
    verdict:
      'Keeping a master or editing audio? Use FLAC. Sharing or filling a phone with music? Use MP3. Convert FLAC to MP3 in your browser whenever you need it small.',
    faqs: [
      { q: 'Can I hear the difference between FLAC and MP3?', a: 'At high MP3 bitrates (256–320kbps), most people can’t in casual listening. FLAC matters most for archiving and editing.' },
      { q: 'Does converting MP3 to FLAC improve quality?', a: 'No. FLAC can’t restore detail MP3 already discarded. Convert to FLAC only from a lossless source.' },
    ],
    keywords: ['flac vs mp3', 'mp3 or flac', 'lossless vs lossy audio', 'convert flac mp3'],
    relatedConverts: ['flac-to-mp3', 'wav-to-flac'],
  },
  {
    slug: 'm4a-vs-mp3',
    category: 'audio',
    title: 'M4A vs MP3 — Which Audio Format?',
    h1: 'M4A vs MP3',
    description:
      'M4A (AAC) sounds better per megabyte; MP3 plays on everything. Which to use — convert free in your browser.',
    intro:
      'M4A and MP3 are both lossy, but M4A wraps the newer AAC codec. At the same size M4A usually sounds a bit better and it’s the default in Apple’s ecosystem with chapter and metadata support. MP3 is older but plays on literally every device, app and car stereo, making it the safe choice for sharing.',
    options: [
      {
        label: 'M4A',
        toolId: 'audio-convert',
        best: 'Apple devices and better quality per megabyte.',
        pros: ['Better quality than MP3 at the same size', 'Default on iTunes/Apple', 'Chapters and rich metadata'],
        cons: ['Incompatible with some old devices', 'Less universal than MP3', 'Narrower editor support'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'Maximum compatibility on any device.',
        pros: ['Plays on absolutely everything', 'Tiny files', 'Adjustable bitrate'],
        cons: ['Slightly worse quality per size', 'Weaker at very low bitrates'],
      },
    ],
    verdict:
      'In the Apple ecosystem or want the best sound per megabyte? Use M4A. Need a file that opens on anything, old or new? Use MP3. Convert M4A to MP3 in your browser.',
    faqs: [
      { q: 'Why won’t my M4A play on some devices?', a: 'Older or non-Apple devices may not support AAC/M4A. Converting to MP3 fixes compatibility everywhere.' },
      { q: 'Does M4A → MP3 lose quality?', a: 'Both are lossy, so re-encoding adds a small loss. At high bitrates it’s hard to notice; convert from the best source.' },
    ],
    keywords: ['m4a vs mp3', 'mp3 or m4a', 'best audio format', 'convert m4a mp3'],
    relatedConverts: ['m4a-to-mp3', 'm4a-to-wav'],
  },
  {
    slug: 'mkv-vs-mp4',
    category: 'video',
    title: 'MKV vs MP4 — Which Video Container?',
    h1: 'MKV vs MP4',
    description:
      'MKV is flexible for HD archives with many tracks; MP4 plays and uploads everywhere. Which to use — convert free in your browser.',
    intro:
      'MKV and MP4 are containers that can hold the same video. MKV is a flexible open container that stores multiple audio and subtitle tracks and almost any codec — popular for high-quality archives. MP4 is the universal delivery container that plays on every device and uploads cleanly to every platform.',
    options: [
      {
        label: 'MKV',
        toolId: 'video-convert',
        best: 'High-quality archives with multiple audio/subtitle tracks.',
        pros: ['Multiple audio and subtitle tracks', 'Holds almost any codec', 'Great for HD archives'],
        cons: ['Weak device/social support', 'Limited direct browser playback', 'Convert to share'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: 'Sharing, uploading and playing anywhere.',
        pros: ['Plays on every device and platform', 'The upload standard', 'Good compression'],
        cons: ['Fewer track features than MKV', 'For delivery, not archiving'],
      },
    ],
    verdict:
      'Archiving a movie with multiple audio and subtitle tracks? Use MKV. Sharing, uploading or playing on devices? Convert to MP4. The switch is quick in your browser.',
    faqs: [
      { q: 'Does MKV → MP4 lose quality?', a: 'If it just rewraps the same codec, quality is unchanged. Re-encoding adds a small, usually unnoticeable loss.' },
      { q: 'Why won’t my MKV play or upload?', a: 'Many devices and platforms don’t support MKV. Converting to MP4 (H.264) is the most compatible fix.' },
    ],
    keywords: ['mkv vs mp4', 'mp4 or mkv', 'best video container', 'convert mkv mp4'],
    relatedConverts: ['mkv-to-mp4', 'mkv-to-webm'],
  },
  {
    slug: 'gif-vs-mp4',
    category: 'video',
    title: 'GIF vs MP4 — Which for Short Clips?',
    h1: 'GIF vs MP4',
    description:
      'MP4 is far smaller and smoother; GIF plays inline anywhere with no controls. Which to use for short loops — convert free in your browser.',
    intro:
      'GIF and MP4 both show short motion, very differently. GIF is an old 256-color animation that auto-plays inline everywhere with no sound or controls — great for tiny reactions and stickers, but bloated for anything detailed. MP4 is real video: far smaller, full color and smooth, but it’s a video player rather than an inline image.',
    options: [
      {
        label: 'GIF',
        toolId: 'video-to-gif',
        best: 'Tiny inline reactions, stickers and memes.',
        pros: ['Auto-plays inline everywhere', 'No player or controls needed', 'Simple to embed'],
        cons: ['Huge files for detailed clips', '256 colors, banding', 'No sound'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: 'Anything longer, detailed or with sound.',
        pros: ['Far smaller than GIF', 'Full color, smooth playback', 'Supports audio'],
        cons: ['Needs a video player', 'Less “inline image” friendly'],
      },
    ],
    verdict:
      'A tiny looping reaction or sticker? GIF is fine. Anything longer, colorful or detailed? Use MP4 — it’s dramatically smaller. Convert a clip to GIF (or keep it MP4) in your browser.',
    faqs: [
      { q: 'Why is my GIF so large?', a: 'GIF is inefficient for detailed motion. Trim length, reduce size and colors, or keep it as MP4 — often 10× smaller.' },
      { q: 'Can I turn an MP4 into a GIF?', a: 'Yes. Use the video-to-GIF tool; trim and downsize first to keep the GIF small.' },
    ],
    keywords: ['gif vs mp4', 'mp4 or gif', 'gif vs video', 'convert video to gif'],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
  },
  {
    slug: 'yaml-vs-json',
    category: 'docs',
    title: 'YAML vs JSON — Which Config Format?',
    h1: 'YAML vs JSON',
    description:
      'YAML is human-friendly for config; JSON is strict and universal for data exchange. Which to use — convert free in your browser.',
    intro:
      'YAML and JSON describe the same kind of structured data with different priorities. YAML uses indentation and supports comments, so it reads cleanly for hand-edited config files. JSON uses braces and is strict and universal — every language parses it natively, making it the standard for APIs and data exchange.',
    options: [
      {
        label: 'YAML',
        toolId: 'yaml-json',
        best: 'Human-edited config files (CI, Docker, app settings).',
        pros: ['Very readable', 'Supports comments', 'Less punctuation noise'],
        cons: ['Indentation-sensitive, easy to break', 'Unsupported in some stacks', 'Ambiguous when complex'],
      },
      {
        label: 'JSON',
        toolId: 'yaml-json',
        best: 'APIs, data exchange and program-to-program data.',
        pros: ['Parsed natively everywhere', 'Strict and unambiguous', 'The API/data standard'],
        cons: ['No comments', 'Verbose punctuation', 'Less pleasant to hand-edit'],
      },
    ],
    verdict:
      'Hand-editing config with comments? Use YAML. Exchanging data between programs or an API? Use JSON. Convert between them instantly in your browser.',
    faqs: [
      { q: 'Is YAML a superset of JSON?', a: 'Effectively yes — valid JSON is valid YAML, so any JSON converts cleanly to YAML and back.' },
      { q: 'Which is less error-prone?', a: 'JSON, because its braces are explicit. YAML’s indentation is friendlier to read but easier to break with a stray space.' },
    ],
    keywords: ['yaml vs json', 'json or yaml', 'config format', 'convert yaml json'],
    relatedConverts: ['yaml-to-json', 'json-to-yaml'],
  },
  {
    slug: 'markdown-vs-html',
    category: 'docs',
    title: 'Markdown vs HTML — Which to Write In?',
    h1: 'Markdown vs HTML',
    description:
      'Markdown is fast, readable plain text; HTML gives full control and renders in any browser. Which to use — convert free in your browser.',
    intro:
      'Markdown and HTML often end up as the same web page. Markdown is lightweight plain text — fast to write, easy to read and version-control, and it converts straight to HTML. HTML is the web standard with full control over structure, styling and media, but it’s verbose to write by hand. Most people write Markdown and export HTML.',
    options: [
      {
        label: 'Markdown',
        toolId: 'md-html',
        best: 'Writing docs, READMEs and notes quickly.',
        pros: ['Readable plain text', 'Version-control friendly', 'Converts to HTML anywhere'],
        cons: ['Limited for complex layout', 'Renderer differences', 'Less styling control'],
      },
      {
        label: 'HTML',
        toolId: 'md-html',
        best: 'Full control over layout, styling and media for the web.',
        pros: ['Opens in every browser', 'Full structure and styling', 'Links, media, scripts'],
        cons: ['Verbose to hand-write', 'Easier to make mistakes', 'Harder to skim as source'],
      },
    ],
    verdict:
      'Writing content fast and keeping it readable? Use Markdown. Need precise layout and web features? Use HTML. Convert Markdown to HTML (and back) in your browser.',
    faqs: [
      { q: 'Can I mix HTML inside Markdown?', a: 'Yes — most Markdown renderers pass raw HTML through, so you can drop in HTML where you need extra control.' },
      { q: 'Does Markdown → HTML keep my formatting?', a: 'Yes. Headings, lists, links, code and emphasis all map to their HTML equivalents with a live preview.' },
    ],
    keywords: ['markdown vs html', 'html or markdown', 'markdown to html', 'writing format'],
    relatedConverts: ['md-to-html'],
  },
  {
    slug: 'xlsx-vs-csv',
    category: 'docs',
    title: 'XLSX vs CSV — Which Spreadsheet Format?',
    h1: 'XLSX vs CSV',
    description:
      'XLSX keeps formulas, formatting and multiple sheets; CSV is a plain table every tool reads. Which to use — convert free in your browser.',
    intro:
      'XLSX and CSV both hold tables, but at different richness. XLSX is the full Excel format — multiple sheets, formulas, formatting and types in one file. CSV is a single plain table of comma-separated values with no formatting — tiny, simple and readable by virtually every spreadsheet, database and program.',
    options: [
      {
        label: 'XLSX',
        toolId: 'xlsx-convert',
        best: 'Real spreadsheets with formulas, formatting and sheets.',
        pros: ['Keeps formulas and formatting', 'Multiple sheets in one file', 'Types and styling'],
        cons: ['Overkill for plain data', 'Harder to process programmatically', 'Needs Excel/compatible app'],
      },
      {
        label: 'CSV',
        toolId: 'xlsx-convert',
        best: 'Imports, exports and program-friendly tabular data.',
        pros: ['Opens in every tool', 'Tiny and simple', 'Easy to generate and parse'],
        cons: ['No formulas or formatting', 'Single sheet only', 'Encoding/delimiter pitfalls'],
      },
    ],
    verdict:
      'Working with formulas, formatting or multiple sheets? Use XLSX. Importing, exporting or feeding data to a program? Use CSV. Convert between them (and JSON) in your browser.',
    faqs: [
      { q: 'Does saving XLSX as CSV lose anything?', a: 'Yes — CSV keeps only the values of one sheet. Formulas, formatting and other sheets are dropped.' },
      { q: 'Which should I send someone in Excel?', a: 'XLSX if they need formulas/formatting; CSV if they just need the raw data to import.' },
    ],
    keywords: ['xlsx vs csv', 'csv or excel', 'spreadsheet format', 'convert xlsx csv'],
    relatedConverts: ['csv-to-xlsx', 'xlsx-to-csv'],
  },
  {
    slug: 'crontab-builder-vs-cron-explainer',
    category: 'dev',
    title: 'Crontab Builder vs Cron Explainer — Build or Decode a Schedule?',
    h1: 'Crontab Builder vs Cron Explainer',
    description:
      'Build a cron expression visually when you don’t know the syntax, or paste an existing one to read what it runs and when — free, in your browser.',
    intro:
      'These two cron tools work in opposite directions. The builder helps you assemble a brand-new cron expression by picking minutes, hours and days from menus, so you never have to memorize the field order. The explainer takes an expression you already have and translates it into plain English plus the next run times, so you can verify exactly what a schedule does.',
    options: [
      {
        label: 'Crontab Builder',
        toolId: 'crontab-builder',
        best: 'You need a new schedule but aren’t sure of the cron syntax.',
        pros: [
          'Pick fields from menus instead of memorizing the format',
          'See the generated expression update as you choose',
          'Avoids off-by-one mistakes with day-of-week and month',
        ],
        cons: ['Not for decoding an expression you already have'],
      },
      {
        label: 'Cron Explainer',
        toolId: 'cron-explainer',
        best: 'You already have a cron line and want to confirm what it runs.',
        pros: [
          'Translates any expression into plain English',
          'Shows the upcoming run times so you can sanity-check it',
          'Great for reviewing a schedule from a config file or crontab',
        ],
        cons: ['Doesn’t generate a schedule from scratch'],
      },
    ],
    verdict:
      'Starting from nothing? Use the builder to generate the expression. Holding an expression and wondering what it does? Use the explainer to decode and verify it. Many people build first, then paste the result into the explainer to double-check. Both run entirely in your browser.',
    faqs: [
      {
        q: 'Can I check the schedule I just built?',
        a: 'Yes. Copy the expression from the builder and paste it into the explainer to read it in plain English and preview the next run times.',
      },
      {
        q: 'Do these run my cron jobs?',
        a: 'No. They only build and decode the schedule expression — actually running the job happens on your own server or scheduler.',
      },
    ],
    keywords: ['crontab builder vs cron explainer', 'build cron expression', 'explain cron', 'cron schedule generator'],
  },
  {
    slug: 'hash-identifier-vs-text-hash',
    category: 'security',
    title: 'Hash Identifier vs Text Hash Generator — Identify or Generate?',
    h1: 'Hash Identifier vs Text Hash Generator',
    description:
      'Guess which algorithm produced an unknown hash, or generate a hash from your own text — both run free, in your browser, with nothing uploaded.',
    intro:
      'These tools sit on opposite ends of a hash. The identifier starts from a hash you already have and guesses which algorithm — MD5, SHA-1, SHA-256, bcrypt and so on — likely produced it, based on length and format. The generator starts from text or input you provide and produces a hash for you. One reads a hash backward; the other creates one forward.',
    options: [
      {
        label: 'Hash Identifier',
        toolId: 'hash-identifier',
        best: 'You have a mystery hash and need to know its likely algorithm.',
        pros: [
          'Detects likely algorithm from length and prefix',
          'Recognizes MD5, SHA-family, bcrypt and more',
          'Useful before trying to verify or crack a value',
        ],
        cons: ['Can only guess — multiple algorithms can share a length'],
      },
      {
        label: 'Text Hash Generator',
        toolId: 'text-hash',
        best: 'You have input and want to produce a hash from it.',
        pros: [
          'Generate MD5, SHA-1, SHA-256 and more from any text',
          'Compare checksums or create integrity fingerprints',
          'Instant output as you type, nothing uploaded',
        ],
        cons: ['Doesn’t analyze a hash you already have'],
      },
    ],
    verdict:
      'Holding a hash you can’t place? Use the identifier to narrow down the algorithm. Need to turn input into a hash? Use the generator. They pair naturally: identify an unknown hash, then regenerate a candidate with the same algorithm to compare. Everything stays in your browser.',
    faqs: [
      {
        q: 'Can the identifier always tell me the exact algorithm?',
        a: 'Not always. Several algorithms produce hashes of the same length, so the identifier reports the most likely candidates rather than a guaranteed answer.',
      },
      {
        q: 'Is my text sent anywhere when I generate a hash?',
        a: 'No. Hashing happens entirely in your browser, so your input never leaves your device.',
      },
    ],
    keywords: ['hash identifier vs text hash', 'identify hash type', 'generate hash', 'md5 sha256 hash'],
  },
  {
    slug: 'css-clamp-vs-css-units',
    category: 'dev',
    title: 'CSS clamp() vs CSS Unit Converter — Fluid or Fixed Sizing?',
    h1: 'CSS clamp() vs CSS Unit Converter',
    description:
      'Build a fluid size that scales with the viewport, or convert one fixed value between px, rem, em and pt — both free, in your browser.',
    intro:
      'These tools handle sizing in two different ways. clamp() builds a fluid, responsive value that grows and shrinks between a minimum and maximum as the viewport changes — one declaration that adapts. The unit converter takes a single fixed value and rewrites it in another unit, such as px to rem, without any responsiveness. One produces a range; the other restates a constant.',
    options: [
      {
        label: 'CSS clamp()',
        toolId: 'css-clamp',
        best: 'Responsive typography or spacing that scales with the screen.',
        pros: [
          'One value smoothly scales between a min and max',
          'No media queries needed for fluid sizing',
          'Generates the full clamp() expression for you',
        ],
        cons: ['Overkill when you just need one static value in another unit'],
      },
      {
        label: 'CSS Unit Converter',
        toolId: 'css-units',
        best: 'Restating a fixed measurement in px, rem, em or pt.',
        pros: [
          'Convert one value between px, rem, em and pt',
          'Set the root font size for accurate rem/em math',
          'Quick, exact and easy to copy',
        ],
        cons: ['Produces a fixed value — it doesn’t scale with the viewport'],
      },
    ],
    verdict:
      'Want text or spacing that adapts to screen size? Use clamp(). Just need to express one fixed measurement in a different unit? Use the converter. They complement each other — convert your min and max to rem first, then drop them into a clamp(). Both run in your browser.',
    faqs: [
      {
        q: 'When should I use clamp() instead of a fixed unit?',
        a: 'Use clamp() when a size should respond to the viewport — like heading text that shrinks on phones. Use a fixed unit when the value should stay constant.',
      },
      {
        q: 'Do I need rem values for clamp()?',
        a: 'Not strictly, but rem-based bounds scale better with user font settings. Convert your px bounds to rem first, then build the clamp() expression.',
      },
    ],
    keywords: ['css clamp vs css units', 'fluid responsive css', 'px to rem', 'clamp font size'],
  },
  {
    slug: 'luhn-generator-vs-cc-validate',
    category: 'security',
    title: 'Luhn Generator vs Card Number Validator — Generate or Validate Test Numbers?',
    h1: 'Luhn Generator vs Card Number Validator',
    description:
      'Generate Luhn-valid test card numbers for QA, or validate the checksum of a number — both for testing only, free, in your browser.',
    intro:
      'Both tools work with the Luhn checksum that card numbers use, and both deal strictly with test data — no real, active account is implied either way. The generator produces fresh numbers that pass the Luhn check so you can fill forms and exercise QA flows. The validator takes a number you already have and confirms whether its checksum is valid. One creates test numbers; the other checks them.',
    options: [
      {
        label: 'Luhn Generator',
        toolId: 'luhn-generator',
        best: 'Filling forms or QA flows that need Luhn-valid test numbers.',
        pros: [
          'Produces numbers that pass the Luhn checksum',
          'Ideal for testing forms, payment UIs and validation logic',
          'Generated locally — for testing only, not real accounts',
        ],
        cons: ['These are test numbers, never tied to a real or active card'],
      },
      {
        label: 'Card Number Validator',
        toolId: 'cc-validate',
        best: 'Checking whether a number passes the Luhn checksum.',
        pros: [
          'Confirms the Luhn checksum of any number you enter',
          'Spots typos and transposed digits in test data',
          'Runs in your browser with nothing uploaded',
        ],
        cons: ['A valid checksum only means the format is plausible, not that an account exists'],
      },
    ],
    verdict:
      'Need plausible test numbers to feed a form? Use the generator. Want to confirm a number’s checksum is correct? Use the validator. They pair up cleanly — generate a batch, then validate them to prove your form logic works. Remember both are for testing only; neither produces or checks a real, active account, and everything stays in your browser.',
    faqs: [
      {
        q: 'Are the generated numbers real credit cards?',
        a: 'No. They only satisfy the Luhn checksum for testing. They are not linked to any real or active account and cannot be used for payments.',
      },
      {
        q: 'Does a valid checksum mean the card works?',
        a: 'No. The validator confirms only that the digits pass the Luhn math. It says nothing about whether a real account exists — these are test numbers.',
      },
    ],
    keywords: ['luhn generator vs cc validate', 'test card numbers', 'luhn checksum', 'validate card number'],
  },
  {
    slug: 'json-schema-vs-json-to-ts',
    category: 'dev',
    title: 'JSON Schema vs JSON to TypeScript — Runtime or Compile-Time Safety?',
    h1: 'JSON Schema vs JSON to TypeScript',
    description:
      'Generate a JSON Schema for runtime validation, or TypeScript types for compile-time safety — both free, in your browser, from your sample JSON.',
    intro:
      'These tools turn sample JSON into two different kinds of guardrails. JSON Schema describes the shape of your data so a validator can check incoming JSON at runtime — rejecting bad payloads as they arrive. JSON to TypeScript produces interfaces and types that your editor and compiler enforce while you write code, catching mismatches before anything runs. One guards data; the other guards your source.',
    options: [
      {
        label: 'JSON Schema Generator',
        toolId: 'json-schema',
        best: 'Validating real, incoming data at runtime.',
        pros: [
          'Describes required fields, types and constraints',
          'Lets validators reject malformed payloads as they arrive',
          'Language-agnostic — works beyond TypeScript',
        ],
        cons: ['Doesn’t give your editor compile-time autocomplete'],
      },
      {
        label: 'JSON to TypeScript',
        toolId: 'json-to-ts',
        best: 'Catching shape mismatches while you write code.',
        pros: [
          'Generates interfaces and types from sample JSON',
          'Compile-time errors and editor autocomplete',
          'Keeps your code in sync with the data shape',
        ],
        cons: ['Types are erased at runtime — no live data validation'],
      },
    ],
    verdict:
      'Need to reject bad data when it actually arrives? Generate a JSON Schema. Want your editor and compiler to catch mistakes as you code? Generate TypeScript types. Most robust setups use both — types for development, a schema to validate at the boundary. Both run in your browser.',
    faqs: [
      {
        q: 'Why not just use TypeScript types for validation?',
        a: 'TypeScript types disappear when the code compiles, so they can’t check real data at runtime. A JSON Schema runs an actual check on incoming JSON.',
      },
      {
        q: 'Can I use both together?',
        a: 'Yes, and it’s a common pattern. Generate TypeScript types for development ergonomics and a JSON Schema to validate data at your API or input boundary.',
      },
    ],
    keywords: ['json schema vs json to typescript', 'runtime validation', 'typescript types from json', 'json schema generator'],
  },
  {
    slug: 'markdown-table-vs-html-table',
    category: 'docs',
    title: 'Markdown Table vs CSV to HTML Table — Which Output Do You Need?',
    h1: 'Markdown Table vs HTML Table',
    description:
      'Output a GitHub-flavored Markdown table for docs, or HTML <table> markup for web pages and email — both free, in your browser.',
    intro:
      'Both tools build a table, but they produce different markup for different homes. The Markdown table generator outputs GitHub-flavored Markdown that renders cleanly in READMEs, wikis and docs. The CSV to HTML converter emits real HTML <table> markup you can drop straight into a web page or HTML email. Pick the one that matches where the table will live.',
    options: [
      {
        label: 'Markdown Table Generator',
        toolId: 'markdown-table-gen',
        best: 'READMEs, wikis and Markdown-based documentation.',
        pros: [
          'GitHub-flavored Markdown that renders in docs and wikis',
          'Plain-text source that diffs cleanly in version control',
          'Easy to edit by hand later',
        ],
        cons: ['Limited styling — no colors, merged cells or rich formatting'],
      },
      {
        label: 'CSV to HTML Table',
        toolId: 'csv-to-html',
        best: 'Web pages and HTML email that need real table markup.',
        pros: [
          'Outputs ready-to-paste <table> HTML',
          'Works in browsers and HTML email clients',
          'Can be styled with CSS for full control',
        ],
        cons: ['Verbose markup that’s harder to hand-edit than Markdown'],
      },
    ],
    verdict:
      'Putting the table in a README, wiki or Markdown doc? Generate Markdown. Embedding it in a web page or HTML email? Convert to an HTML table. If you have raw CSV, the HTML converter takes it directly. Both run entirely in your browser.',
    faqs: [
      {
        q: 'Can Markdown tables be styled like HTML ones?',
        a: 'Not really. Markdown tables render as plain tables, while HTML tables can be styled with CSS — colors, borders, alignment and more.',
      },
      {
        q: 'Which should I use for a GitHub README?',
        a: 'Markdown. GitHub renders Markdown tables natively and they stay readable in the raw file, unlike HTML markup.',
      },
    ],
    keywords: ['markdown table vs html table', 'markdown table generator', 'csv to html table', 'table markup'],
  },
  {
    slug: 'world-clock-vs-timezone-converter',
    category: 'util',
    title: 'World Clock vs Time Zone Converter — Glance or Convert?',
    h1: 'World Clock vs Time Zone Converter',
    description:
      'See the current time across many cities at a glance, or convert one specific time between two zones — both free, in your browser.',
    intro:
      'These tools answer two different time-zone questions. The world clock shows the current time in many cities at once, so you can glance and see who’s awake right now. The time zone converter takes one specific date and time and translates it between two zones, so you can pin down when a meeting lands. One is a live overview; the other is a precise one-off calculation.',
    options: [
      {
        label: 'World Clock',
        toolId: 'world-clock',
        best: 'Seeing the current time in several cities at once.',
        pros: [
          'Live current time across many cities',
          'Great for spotting overlapping working hours',
          'No input needed — just glance',
        ],
        cons: ['Not built for converting a specific future time'],
      },
      {
        label: 'Time Zone Converter',
        toolId: 'timezone',
        best: 'Converting one specific time or date between two zones.',
        pros: [
          'Convert an exact time between two time zones',
          'Handles future dates and daylight saving shifts',
          'Pin down meeting times precisely',
        ],
        cons: ['Shows one conversion at a time, not a live overview'],
      },
    ],
    verdict:
      'Just want to know who’s awake right now? Use the world clock. Need to convert a specific time — like a 3 PM call — into another zone? Use the converter. They work together: glance at the world clock to find a workable window, then convert the exact time to confirm. Both run in your browser.',
    faqs: [
      {
        q: 'Does the converter handle daylight saving time?',
        a: 'Yes. It accounts for daylight saving rules for the date you choose, so a converted time is correct even across a DST change.',
      },
      {
        q: 'Can the world clock convert a future meeting time?',
        a: 'No — it shows current times across cities. For a specific future time, use the time zone converter instead.',
      },
    ],
    keywords: ['world clock vs timezone converter', 'current time in cities', 'convert time zones', 'meeting time zones'],
  },
  {
    slug: 'readability-vs-word-count',
    category: 'text',
    title: 'Readability Score vs Word & Character Count — Difficulty or Length?',
    h1: 'Readability Score vs Word & Character Count',
    description:
      'Measure how easy your text is to read, or count its words, characters and length — two different text metrics, free in your browser.',
    intro:
      'These tools measure text in two distinct ways. The readability score estimates how easy a passage is to read using metrics like Flesch reading ease and grade level, telling you whether the writing is accessible. The word and character counter reports raw size — words, characters and length — without judging difficulty. One measures quality of reading; the other measures quantity of text.',
    options: [
      {
        label: 'Readability Score',
        toolId: 'readability-score',
        best: 'Checking whether your writing is easy to read.',
        pros: [
          'Flesch reading ease and grade-level estimates',
          'Flags overly dense or complex passages',
          'Helps tune content for your audience',
        ],
        cons: ['Doesn’t give exact word or character limits'],
      },
      {
        label: 'Word & Character Count',
        toolId: 'text-count',
        best: 'Meeting length limits for essays, posts or fields.',
        pros: [
          'Exact word and character counts',
          'Useful for limits on essays, tweets and meta tags',
          'Updates live as you type',
        ],
        cons: ['Says nothing about how readable the text is'],
      },
    ],
    verdict:
      'Want to know if your text is easy to follow? Use the readability score. Need to hit a word or character limit? Use the counter. They’re complementary: count to stay within a limit, then check readability to make sure the trimmed text still reads well. Both run in your browser.',
    faqs: [
      {
        q: 'What’s a good Flesch reading ease score?',
        a: 'Around 60–70 is considered plain English suitable for a general audience. Lower scores mean denser, more academic writing.',
      },
      {
        q: 'Does the word counter judge writing quality?',
        a: 'No. It only measures length — words, characters and so on. For difficulty, use the readability score instead.',
      },
    ],
    keywords: ['readability vs word count', 'flesch reading ease', 'word character count', 'text difficulty'],
  },
  {
    slug: 'bill-split-vs-tip-calculator',
    category: 'util',
    title: 'Bill Splitter vs Tip Calculator — Split the Bill or Just the Tip?',
    h1: 'Bill Splitter vs Tip Calculator',
    description:
      'Split a total including tax and tip evenly among people, or compute just the tip on a bill — both free, in your browser.',
    intro:
      'Both tools help at the end of a meal, but they answer different questions. The bill splitter takes a full total — including tax and tip — and divides it evenly among a number of people, telling each person what they owe. The tip calculator focuses only on the gratuity, working out the tip amount and percentage on a bill. One shares the whole cost; the other figures the tip alone.',
    options: [
      {
        label: 'Bill Splitter',
        toolId: 'bill-split',
        best: 'Dividing a shared total evenly among a group.',
        pros: [
          'Splits the full total including tax and tip',
          'Shows the per-person amount instantly',
          'Perfect for group meals and shared expenses',
        ],
        cons: ['More than you need if you only want the tip'],
      },
      {
        label: 'Tip Calculator',
        toolId: 'tip-calc',
        best: 'Working out just the gratuity on a bill.',
        pros: [
          'Computes the tip amount and percentage',
          'Quick for a solo bill or deciding how much to leave',
          'Adjust the tip rate and see it update',
        ],
        cons: ['Doesn’t divide the total among several people'],
      },
    ],
    verdict:
      'Eating out with friends and need everyone’s share? Use the bill splitter. Just figuring out how much to tip? Use the tip calculator. They chain nicely — calculate the tip first, then split the grand total across the group. Both run in your browser.',
    faqs: [
      {
        q: 'Can the bill splitter include the tip?',
        a: 'Yes. It splits the full total including tax and tip, so each person’s share already covers everything.',
      },
      {
        q: 'Which do I use for a solo meal?',
        a: 'The tip calculator — there’s no one to split with, so you just need the gratuity amount.',
      },
    ],
    keywords: ['bill split vs tip calculator', 'split the bill', 'calculate tip', 'split bill among people'],
  },
  {
    slug: 'ideal-weight-vs-bmi',
    category: 'util',
    title: 'Ideal Weight vs BMI Calculator — Target Weight or Current Status?',
    h1: 'Ideal Weight vs BMI Calculator',
    description:
      'Estimate a target weight range from your height, or assess your current weight status with BMI — both free, in your browser.',
    intro:
      'These calculators look at weight from two angles. The ideal weight tool estimates a target weight range from your height alone, using formulas like Devine or a BMI-22 reference, suggesting where your weight could land. The BMI calculator instead takes your current height and weight together and tells you which category that places you in right now. One projects a goal; the other assesses the present.',
    options: [
      {
        label: 'Ideal Weight',
        toolId: 'ideal-weight',
        best: 'Estimating a target weight range from your height.',
        pros: [
          'Suggests a healthy weight range from height',
          'Uses recognized formulas like Devine and BMI-22',
          'Helpful as a goal-setting reference',
        ],
        cons: ['An estimate only — it can’t assess your current status'],
      },
      {
        label: 'BMI Calculator',
        toolId: 'bmi-calc',
        best: 'Assessing your current weight relative to your height.',
        pros: [
          'Computes BMI from your current height and weight',
          'Shows your category against standard ranges',
          'A quick snapshot of where you are now',
        ],
        cons: ['Doesn’t suggest a target weight to aim for'],
      },
    ],
    verdict:
      'Want a goal to aim for based on your height? Use the ideal weight tool. Want to know where your current weight stands? Use the BMI calculator. They complement each other — check your BMI now, then use the ideal weight range as a target. Both are estimates and run in your browser; neither replaces medical advice.',
    faqs: [
      {
        q: 'Is ideal weight the same as a healthy BMI?',
        a: 'They’re related but not identical. Ideal weight formulas estimate a single range from height, while BMI categorizes your actual height-and-weight combination.',
      },
      {
        q: 'Should I rely on these for health decisions?',
        a: 'No. Both are rough estimates for general reference. Consult a healthcare professional for advice tailored to you.',
      },
    ],
    keywords: ['ideal weight vs bmi', 'ideal body weight', 'bmi calculator', 'target weight from height'],
  },
  {
    slug: 'ovulation-vs-due-date',
    category: 'util',
    title: 'Ovulation vs Due Date Calculator — Plan or Track a Pregnancy?',
    h1: 'Ovulation vs Due Date Calculator',
    description:
      'Find your fertile window to plan conception, or estimate a birth date once you’re already pregnant — both free, in your browser.',
    intro:
      'These two calculators sit on opposite sides of pregnancy. The ovulation calculator looks ahead to conception: from your last period and cycle length it estimates the fertile window and likely ovulation day. The due date calculator assumes you’re already pregnant and projects forward to an estimated birth date using Naegele’s rule. Both produce estimates only — they are not medical advice, and your body or your doctor may say otherwise.',
    options: [
      {
        label: 'Ovulation Calculator',
        toolId: 'ovulation-calc',
        best: 'Planning conception by finding your most fertile days.',
        pros: [
          'Estimates the fertile window from your last period and cycle length',
          'Pinpoints the likely ovulation day to time conception',
          'Useful month to month while trying to conceive',
        ],
        cons: ['An estimate only — actual ovulation varies and this is not medical advice'],
      },
      {
        label: 'Due Date Calculator',
        toolId: 'pregnancy-due-date',
        best: 'Tracking an existing pregnancy toward an estimated birth date.',
        pros: [
          'Projects an estimated due date once you’re already pregnant',
          'Uses Naegele’s rule (last period + 280 days)',
          'Gives a simple milestone to plan around',
        ],
        cons: ['An estimate only — most births don’t land exactly on the date, and this is not medical advice'],
      },
    ],
    verdict:
      'Trying to conceive? Start with the ovulation calculator to find your fertile window. Already pregnant? Use the due date calculator to estimate the birth date. Both run entirely in your browser, and both are estimates — not a substitute for advice from a healthcare professional.',
    faqs: [
      {
        q: 'Can I use these together?',
        a: 'Yes — many people use the ovulation calculator while trying to conceive, then switch to the due date calculator once pregnant. Each is a rough estimate based on cycle dates, not a medical diagnosis.',
      },
      {
        q: 'How accurate are these dates?',
        a: 'They’re approximations. Ovulation timing shifts with cycle variation, and only about 1 in 20 births falls on the estimated due date. Treat both as a guide and confirm anything important with your doctor.',
      },
    ],
    keywords: ['ovulation vs due date', 'fertile window calculator', 'due date estimate', 'pregnancy calculator'],
  },
  {
    slug: 'date-add-vs-date-diff',
    category: 'util',
    title: 'Date Add vs Date Difference — Shift a Date or Measure a Gap?',
    h1: 'Date Add vs Date Difference',
    description:
      'Shift a date forward or back by days, weeks or months, or count the time between two dates — both free, in your browser.',
    intro:
      'These two date tools answer opposite questions. Date Add / Subtract takes one date and moves it by a number of days, weeks, months or years to land on a new date. Date Difference takes two dates and tells you how far apart they are. One projects to a date; the other measures a span.',
    options: [
      {
        label: 'Date Add / Subtract',
        toolId: 'date-add',
        best: 'Projecting to a future or past date by a known offset.',
        pros: [
          'Shift a date by days, weeks, months or years',
          'Works forward or backward from any start date',
          'Handles month-end clamping automatically',
        ],
        cons: ['Won’t tell you the gap between two existing dates'],
      },
      {
        label: 'Date Difference',
        toolId: 'date-diff',
        best: 'Measuring how much time lies between two dates.',
        pros: [
          'Counts the days (and weeks/months) between two dates',
          'Great for deadlines, ages and durations',
          'No need to know an offset in advance',
        ],
        cons: ['Won’t project a new date from an offset'],
      },
    ],
    verdict:
      'Know a start date and an offset, and need the resulting date? Use Date Add / Subtract. Have two dates and need the gap between them? Use Date Difference. Both calculate instantly in your browser.',
    faqs: [
      {
        q: 'Which tool finds a deadline 90 days from today?',
        a: 'Date Add / Subtract. Enter today as the start, add 90 days, and it returns the deadline date. Date Difference does the reverse — it counts days between two dates you already have.',
      },
      {
        q: 'Can these handle months with different lengths?',
        a: 'Yes. Date Add clamps to the last valid day when a month is shorter, and Date Difference counts the real calendar gap, including leap years.',
      },
    ],
    keywords: ['date add vs date diff', 'add days to date', 'days between dates', 'date calculator'],
  },
  {
    slug: 'csv-to-sql-vs-csv-to-html',
    category: 'docs',
    title: 'CSV to SQL vs CSV to HTML — Load a Database or Show a Table?',
    h1: 'CSV to SQL vs CSV to HTML',
    description:
      'Turn a CSV into INSERT statements for a database, or into an HTML table for a web page — both free, in your browser.',
    intro:
      'Both tools start from the same CSV but aim at different destinations. CSV to SQL generates INSERT statements you can run to load the rows into a database. CSV to HTML Table generates a ready-to-paste HTML <table> to display the data on a web page. The question is simply where the data is going next.',
    options: [
      {
        label: 'CSV to SQL',
        toolId: 'csv-to-sql',
        best: 'Importing CSV rows into a database table.',
        pros: [
          'Generates INSERT statements from your columns',
          'Drop the output straight into a database client',
          'Handles quoting and escaping for you',
        ],
        cons: ['Not meant for displaying data on a page'],
      },
      {
        label: 'CSV to HTML Table',
        toolId: 'csv-to-html',
        best: 'Showing tabular data on a web page.',
        pros: [
          'Outputs a clean HTML <table> you can paste anywhere',
          'Keeps headers and rows structured for the browser',
          'No styling lock-in — restyle with your own CSS',
        ],
        cons: ['Doesn’t load anything into a database'],
      },
    ],
    verdict:
      'Loading the data into a database? Use CSV to SQL. Displaying it on a web page? Use CSV to HTML Table. Both convert your CSV instantly in the browser, so the file never leaves your device.',
    faqs: [
      {
        q: 'Can I do both from the same CSV?',
        a: 'Yes. Run CSV to SQL to seed a database and CSV to HTML to show the same rows on a page. Each conversion happens locally in your browser.',
      },
      {
        q: 'Will the SQL work in my database?',
        a: 'The output is standard INSERT syntax that works in most databases. You may need to tweak the table name or column types to match your schema.',
      },
    ],
    keywords: ['csv to sql vs csv to html', 'csv to insert statements', 'csv to html table', 'convert csv'],
  },
  {
    slug: 'image-threshold-vs-black-white',
    category: 'image',
    title: 'Image Threshold vs Black & White — Binarize or Grayscale?',
    h1: 'Image Threshold vs Black & White',
    description:
      'Make a pure two-tone black-and-white image by a brightness cutoff, or a smooth grayscale photo — both free, in your browser.',
    intro:
      'Both tools drop the color, but they end up looking very different. Image Threshold binarizes: every pixel becomes pure black or pure white depending on whether its brightness clears a cutoff, leaving just two tones. Black & White instead desaturates to a smooth range of grays, preserving the photo’s tonal detail.',
    options: [
      {
        label: 'Image Threshold',
        toolId: 'image-threshold',
        best: 'Scans, stencils and line art that should be pure two-tone.',
        pros: [
          'Reduces the image to pure black and white',
          'Adjustable luminance cutoff for crisp edges',
          'Ideal for documents, logos and stencils',
        ],
        cons: ['Loses all in-between tones, so photos look harsh'],
      },
      {
        label: 'Black & White',
        toolId: 'image-black-white',
        best: 'Photos that should keep tonal detail without color.',
        pros: [
          'Smooth grayscale that preserves shading',
          'Keeps depth and detail in photographs',
          'A classic, natural monochrome look',
        ],
        cons: ['Won’t give you the clean two-tone result a scan needs'],
      },
    ],
    verdict:
      'Cleaning up a scan, stencil or piece of line art? Use Image Threshold for a crisp two-tone result. Converting a photograph? Use Black & White to keep its tones. Both process the image right in your browser.',
    faqs: [
      {
        q: 'Why does my photo look harsh with threshold?',
        a: 'Threshold keeps only two tones — pure black and pure white — so the smooth shading in a photo disappears. For photos, use Black & White instead, which preserves the grays.',
      },
      {
        q: 'Which is better for scanning a document?',
        a: 'Image Threshold. A brightness cutoff turns faint gray paper into clean white and the text into solid black, which is exactly what a readable scan needs.',
      },
    ],
    keywords: ['image threshold vs black white', 'binarize image', 'grayscale photo', 'black and white image'],
  },
  {
    slug: 'markdown-to-text-vs-markdown-preview',
    category: 'docs',
    title: 'Markdown to Text vs Markdown Preview — Strip It or See It?',
    h1: 'Markdown to Text vs Markdown Preview',
    description:
      'Strip Markdown down to clean plain text, or render it to formatted HTML to see how it looks — both free, in your browser.',
    intro:
      'These two tools take Markdown in opposite directions. Markdown to Text removes all the formatting syntax and gives you clean plain text you can paste anywhere. Markdown Preview does the reverse — it renders the Markdown into formatted HTML so you can see headings, lists and links the way a reader would. One gets plain text out; the other lets you see the result.',
    options: [
      {
        label: 'Markdown to Text',
        toolId: 'markdown-to-text',
        best: 'Getting clean, unformatted plain text out of Markdown.',
        pros: [
          'Strips headings, emphasis, links and list markers',
          'Leaves readable plain text you can paste anywhere',
          'Great for plain-text emails, fields and word counts',
        ],
        cons: ['Discards all formatting — you can’t see the styled result'],
      },
      {
        label: 'Markdown Preview',
        toolId: 'markdown-preview',
        best: 'Seeing how your Markdown will actually render.',
        pros: [
          'Renders Markdown to formatted HTML live',
          'Shows headings, lists, links and emphasis as readers see them',
          'Catches syntax mistakes before you publish',
        ],
        cons: ['Doesn’t give you a plain-text version to copy out'],
      },
    ],
    verdict:
      'Need plain text with the formatting gone? Use Markdown to Text. Want to see how the document will look once rendered? Use Markdown Preview. Both run entirely in your browser.',
    faqs: [
      {
        q: 'Which one removes the # and * symbols?',
        a: 'Markdown to Text. It strips the syntax characters and leaves clean prose. Markdown Preview instead interprets those symbols to render headings and emphasis.',
      },
      {
        q: 'Can I check my formatting before publishing?',
        a: 'Yes — Markdown Preview renders your Markdown to HTML so you can confirm headings, lists and links look right before you ship it.',
      },
    ],
    keywords: ['markdown to text vs markdown preview', 'strip markdown', 'render markdown', 'markdown to plain text'],
  },
  {
    slug: 'regex-escape-vs-string-escape',
    category: 'dev',
    title: 'Regex Escaper vs String Escaper — Escape for Regex or for Code?',
    h1: 'Regex Escaper vs String Escaper',
    description:
      'Escape regex metacharacters so text matches literally, or escape a string for JSON, JS, HTML or SQL — both free, in your browser.',
    intro:
      'Both tools add backslashes and entities, but for different targets. The Regex Escaper escapes characters that have special meaning inside a regular expression — like . * + ? ( ) — so your text matches literally. The String Escaper escapes a string for a code or markup context such as JSON, JavaScript, HTML or SQL. The deciding question is what the escaped text is going into.',
    options: [
      {
        label: 'Regex Escaper',
        toolId: 'regex-escape',
        best: 'Making text match literally inside a regular expression.',
        pros: [
          'Escapes regex metacharacters (. * + ? [ ] ( ) etc.)',
          'Turns arbitrary text into a safe literal pattern',
          'Prevents accidental wildcards in your regex',
        ],
        cons: ['Not for escaping strings in JSON, JS, HTML or SQL'],
      },
      {
        label: 'String Escaper',
        toolId: 'string-escape',
        best: 'Embedding a string safely in code or markup.',
        pros: [
          'Escapes for JSON, JavaScript, HTML or SQL contexts',
          'Handles quotes, backslashes and special entities',
          'Pick the target language for the right rules',
        ],
        cons: ['Won’t make text safe to drop into a regular expression'],
      },
    ],
    verdict:
      'Putting literal text inside a regex pattern? Use the Regex Escaper. Embedding a string in JSON, JavaScript, HTML or SQL? Use the String Escaper. Both escape your text instantly in the browser.',
    faqs: [
      {
        q: 'Why doesn’t string escaping work for my regex?',
        a: 'They escape different character sets. A regex needs metacharacters like . and * escaped, while JSON or JS escaping targets quotes and backslashes. Use the Regex Escaper when the text goes into a pattern.',
      },
      {
        q: 'Which one do I use for a SQL query?',
        a: 'The String Escaper, with the SQL target selected. It escapes quotes for SQL contexts. (For real queries, parameterized statements are still safer than manual escaping.)',
      },
    ],
    keywords: ['regex escape vs string escape', 'escape regex characters', 'escape string for json', 'escape special characters'],
  },
  {
    slug: 'bpm-tap-vs-metronome',
    category: 'audio',
    title: 'BPM Tap Counter vs Metronome — Measure a Tempo or Play One?',
    h1: 'BPM Tap Counter vs Metronome',
    description:
      'Tap along to measure an unknown song’s tempo, or play a steady click at a tempo you set — both free, in your browser.',
    intro:
      'These two tools handle tempo from opposite ends. The BPM Tap Counter measures: you tap along with a track and it works out the beats per minute from your timing. The Metronome plays: you set a BPM and it produces a steady click to play or practice against. One finds an unknown tempo; the other holds a known one.',
    options: [
      {
        label: 'BPM Tap Counter',
        toolId: 'bpm-tap',
        best: 'Finding the tempo of a song you’re listening to.',
        pros: [
          'Measures BPM from your taps in seconds',
          'No need to know the tempo in advance',
          'Great for DJs, remixers and transcription',
        ],
        cons: ['Doesn’t produce a click to play along to'],
      },
      {
        label: 'Metronome',
        toolId: 'metronome',
        best: 'Practicing or recording at a tempo you choose.',
        pros: [
          'Plays a steady, accurate click at any BPM you set',
          'Keeps your timing locked while you play',
          'Ideal for practice and recording',
        ],
        cons: ['Won’t tell you the tempo of an existing track'],
      },
    ],
    verdict:
      'Need to discover how fast a song is? Tap it out with the BPM Tap Counter. Need a steady beat to play against? Set the Metronome. Both work right in your browser with no install.',
    faqs: [
      {
        q: 'How do I find a song’s BPM?',
        a: 'Use the BPM Tap Counter: play the track and tap along with the beat. After a few taps it averages your timing into a BPM. The Metronome does the opposite — it plays a click at a BPM you enter.',
      },
      {
        q: 'Can I practice to a fixed tempo?',
        a: 'Yes — set the Metronome to your target BPM and it plays a steady click to play along with. Use the BPM Tap Counter first if you need to match an existing recording.',
      },
    ],
    keywords: ['bpm tap vs metronome', 'tap tempo counter', 'online metronome', 'find song bpm'],
  },
  {
    slug: 'random-team-vs-random-pick',
    category: 'util',
    title: 'Random Team Generator vs Random Picker — Split Into Groups or Pick a Winner?',
    h1: 'Random Team Generator vs Random Picker',
    description:
      'Split a list of names into balanced teams, or pick one or a few winners at random — both free, in your browser.',
    intro:
      'Both tools shuffle a list, but they hand you different results. The Random Team Generator divides everyone into balanced groups, so each name lands on a team. The Random Picker selects just one — or a few — winners from the list and sets the rest aside. The question is whether everyone gets placed or only a subset is chosen.',
    options: [
      {
        label: 'Random Team Generator',
        toolId: 'random-team-generator',
        best: 'Dividing a full list of people into balanced teams.',
        pros: [
          'Splits a name list into evenly sized teams',
          'Everyone is placed into a group',
          'Great for sports, classrooms and group projects',
        ],
        cons: ['Not for choosing a single winner from the list'],
      },
      {
        label: 'Random Picker',
        toolId: 'random-pick',
        best: 'Picking one or a few winners from a list.',
        pros: [
          'Selects a single winner or a small subset',
          'Perfect for giveaways, raffles and draws',
          'Leaves everyone else unselected',
        ],
        cons: ['Doesn’t organize the whole list into groups'],
      },
    ],
    verdict:
      'Need to place everyone into groups? Use the Random Team Generator. Need to pick a winner or a handful of names? Use the Random Picker. Both draw fairly and run entirely in your browser.',
    faqs: [
      {
        q: 'Which tool makes two even teams?',
        a: 'The Random Team Generator. It splits your list into the number of teams you choose and balances the sizes. The Random Picker instead selects a winner or two and leaves the rest out.',
      },
      {
        q: 'How do I run a fair giveaway?',
        a: 'Paste your entrants into the Random Picker and choose how many winners to draw. It selects them at random in your browser, so nothing is uploaded.',
      },
    ],
    keywords: ['random team vs random pick', 'random team generator', 'random name picker', 'split into teams'],
  },
  {
    slug: 'nanoid-vs-uuid',
    category: 'dev',
    title: 'Nano ID vs UUID — Which ID Format Should You Use?',
    h1: 'Nano ID vs UUID',
    description:
      'Nano ID makes short, URL-safe identifiers; UUID makes standard 128-bit identifiers. Compare size, readability and collision odds — free, in your browser.',
    intro:
      'Both generate unique identifiers with cryptographically strong randomness, but they trade off length against ubiquity. A Nano ID is short and URL-safe by default — typically 21 characters from a 64-symbol alphabet — so it fits neatly in links and slugs. A UUID is the long-established 128-bit standard (RFC 4122), usually written as 36 characters with hyphens, recognized by virtually every database and language. Neither uploads anything; both run in your browser.',
    options: [
      {
        label: 'Nano ID',
        toolId: 'nanoid-gen',
        best: 'Short, link-friendly ids for URLs, slugs and public references.',
        pros: [
          'Compact — about 21 characters versus a UUID’s 36',
          'URL-safe alphabet (A–Z, a–z, 0–9, _ and -), no encoding needed',
          'Adjustable length and alphabet to tune the collision/size trade-off',
          'Generated with secure randomness',
        ],
        cons: [
          'Not a recognized standard, so some systems expect the UUID shape',
          'No built-in version or timestamp semantics',
        ],
      },
      {
        label: 'UUID',
        toolId: 'uuid-gen',
        best: 'Database keys and APIs where a recognized 128-bit standard is expected.',
        pros: [
          'RFC 4122 standard understood by nearly every database and language',
          'Native UUID column types in PostgreSQL and others',
          'Versioned (v4 random, v1 time-based) with well-known semantics',
          'Astronomically low collision probability for v4',
        ],
        cons: [
          '36 characters with hyphens — long and not URL-pretty',
          'Reveals little but takes more space in indexes and links',
        ],
      },
    ],
    verdict:
      'Pick Nano ID when the id appears in a URL, slug or anywhere length and readability matter and you control both ends. Pick UUID when you need a recognized standard — a database primary key, a public API contract, or interop with tools that expect the UUID format. A common pattern is UUIDs internally and Nano IDs for public-facing short links.',
    faqs: [
      {
        q: 'Is a Nano ID as collision-resistant as a UUID?',
        a: 'At its default 21 characters a Nano ID has a similar order of randomness to a UUID v4. Both draw on secure randomness; if you shorten a Nano ID you trade some collision safety for brevity, so keep the default length for high-volume ids.',
      },
      {
        q: 'Can I store a Nano ID where a UUID column is expected?',
        a: 'No. A UUID column expects the fixed 128-bit UUID format. Store Nano IDs in a plain text/varchar column instead, or use UUIDs if you need the native type.',
      },
    ],
    keywords: ['nanoid vs uuid', 'short unique id', 'url-safe id', 'uuid alternative'],
  },
  {
    slug: 'base58-vs-base64',
    category: 'dev',
    title: 'Base58 vs Base64 — Which Encoding Should You Use?',
    h1: 'Base58 vs Base64',
    description:
      'Base58 drops look-alike characters for human-friendly ids (used by Bitcoin); Base64 is the compact, universal binary-to-text standard. Compare both, in your browser.',
    intro:
      'Both turn raw bytes into printable text, but they optimize for different things. Base58 uses a 58-character alphabet that deliberately omits the easily-confused 0, O, I and l, plus + and /, so strings are safer to read aloud, copy by hand or put in a URL — which is why Bitcoin addresses and many crypto identifiers use it. Base64 uses a 64-character alphabet, packs data more densely (about 33% overhead) and is supported everywhere for email, data URIs and JSON. Both encode and decode entirely in your browser.',
    options: [
      {
        label: 'Base58',
        toolId: 'base58',
        best: 'Human-readable ids people copy, type or read aloud — addresses, short keys.',
        pros: [
          'No look-alike characters (0/O, I/l/1 removed) — fewer transcription errors',
          'No + or / so the output is URL- and filename-safe with no escaping',
          'The encoding behind Bitcoin addresses and many crypto identifiers',
        ],
        cons: [
          'Slightly larger output than Base64 for the same data',
          'Less universally built into languages and libraries',
          'Not meant for large binary blobs',
        ],
      },
      {
        label: 'Base64',
        toolId: 'base64',
        best: 'Embedding or transporting arbitrary binary data — data URIs, email, JSON.',
        pros: [
          'Compact: about 33% overhead, denser than Base58',
          'Built into virtually every language and platform',
          'The standard for data URIs, MIME email and embedding binary in text',
        ],
        cons: [
          'Contains 0/O, I/l and + / that are easy to mis-copy or need URL-escaping',
          'Standard alphabet is not URL-safe without the URL-safe variant',
        ],
      },
    ],
    verdict:
      'Pick Base58 when a human will read, type or share the string — wallet addresses, short ids and anything spoken aloud — and you want to avoid look-alike characters. Pick Base64 when you are moving arbitrary binary data through a text channel (a data URI, an email attachment, a JSON field) and want the most compact, universally supported encoding.',
    faqs: [
      {
        q: 'Why does Bitcoin use Base58 instead of Base64?',
        a: 'Base58 removes characters that are easy to confuse (0/O, I/l) and symbols like + and / that break in URLs or when copied. That makes hand-copied addresses far less error-prone, which matters when a typo could send funds to the wrong place.',
      },
      {
        q: 'Is Base58 or Base64 smaller?',
        a: 'Base64 produces shorter output because its larger alphabet packs more bits per character. Base58 trades a little size for readability and copy-safety.',
      },
    ],
    keywords: ['base58 vs base64', 'base58 encoding', 'bitcoin base58', 'binary to text encoding'],
  },
  {
    slug: 'text-shadow-vs-box-shadow',
    category: 'dev',
    title: 'text-shadow vs box-shadow — Which CSS Shadow Do You Need?',
    h1: 'text-shadow vs box-shadow',
    description:
      'text-shadow casts a shadow on the glyphs of text; box-shadow casts one on an element’s rectangular box. Generate either one visually — free, in your browser.',
    intro:
      'These two CSS properties both create shadows, but they apply to different things. text-shadow draws a shadow that follows the actual shapes of the characters, so it is for headings, labels and any text you want to lift off the page. box-shadow draws a shadow around the element’s box — its border edges — so it is for cards, buttons, modals and panels. Both generators let you tweak offset, blur and color and copy ready-to-paste CSS.',
    options: [
      {
        label: 'text-shadow',
        toolId: 'text-shadow',
        best: 'Adding depth, glow or outlines to text glyphs.',
        pros: [
          'Shadow hugs the letterforms, not a rectangle',
          'Great for headings, neon glow and readable text over images',
          'Supports multiple comma-separated shadows for outlines or stacked effects',
        ],
        cons: [
          'Has no spread radius (unlike box-shadow)',
          'Only affects text, not the element’s box',
        ],
      },
      {
        label: 'box-shadow',
        toolId: 'box-shadow',
        best: 'Elevating cards, buttons and panels off the page.',
        pros: [
          'Shadows the element’s box, following its border-radius',
          'Adds a spread radius and an inset option for inner shadows',
          'The standard way to build depth and elevation in UI',
        ],
        cons: [
          'Follows the rectangular box, so it can’t trace text shapes',
          'Heavy blurred shadows on many elements can cost paint performance',
        ],
      },
    ],
    verdict:
      'Pick text-shadow when the shadow should follow the letters — headings, captions, glow effects, or text laid over a busy photo. Pick box-shadow when you are elevating a whole element — a card, button, dropdown or modal. They are not interchangeable, and you can use both together (shadowed text inside a shadowed card).',
    faqs: [
      {
        q: 'Can box-shadow add a shadow to text?',
        a: 'Not to the glyphs themselves — box-shadow follows the element’s rectangular box. To shadow the letter shapes, use text-shadow.',
      },
      {
        q: 'Does text-shadow support a spread radius like box-shadow?',
        a: 'No. text-shadow takes offset-x, offset-y, blur and color only. If you need a spread or an inset shadow, that is a box-shadow feature.',
      },
    ],
    keywords: ['text-shadow vs box-shadow', 'css text shadow', 'css box shadow', 'css shadow generator'],
  },
  {
    slug: 'card-type-vs-card-validate',
    category: 'security',
    title: 'Card Type Detector vs Card Validator — Detect or Validate?',
    h1: 'Credit Card Type vs Card Validation',
    description:
      'Detect the card brand from its leading digits, or check the number with the Luhn checksum. See what each does — free, in your browser, nothing uploaded.',
    intro:
      'These two tools answer different questions about a card number, and neither contacts a bank. The type detector reads the leading digits (the IIN/BIN prefix) to guess the brand — Visa, Mastercard, Amex and so on — which is handy for showing the right card logo as someone types. The validator runs the Luhn algorithm to check that the digits form a structurally valid number (catching a typo or transposed digit). Both are format checks only; they do not confirm the card exists, is active, or has funds.',
    options: [
      {
        label: 'Credit Card Type',
        toolId: 'credit-card-type',
        best: 'Identifying the card brand from the first few digits.',
        pros: [
          'Detects the brand from the IIN/BIN prefix as digits are entered',
          'Useful for showing the matching card logo in a checkout form',
          'Knows the typical length patterns per brand',
        ],
        cons: [
          'Tells you the brand, not whether the number is valid',
          'Does not authorize the card or confirm it exists',
        ],
      },
      {
        label: 'Card Validation (Luhn)',
        toolId: 'cc-validate',
        best: 'Catching typos with the Luhn checksum before submitting.',
        pros: [
          'Runs the Luhn check used on every real card number',
          'Catches a mistyped or transposed digit instantly',
          'Pairs well with brand detection for friendlier form validation',
        ],
        cons: [
          'A passing checksum does not mean the card is real or active',
          'Does not detect the brand on its own',
        ],
      },
    ],
    verdict:
      'Use the type detector to show which brand a number belongs to (for logos and brand-specific rules), and use the Luhn validator to catch obvious typos before you submit. In a real form you typically run both: detect the brand to format and label the field, then validate the checksum. Neither tool authorizes a payment — only your payment processor can confirm a card is genuine and has funds.',
    faqs: [
      {
        q: 'Does a valid Luhn checksum mean the card is real?',
        a: 'No. Luhn only confirms the digits are internally consistent, which catches typos. It cannot tell whether the card was ever issued, is active, or has funds — only the issuing bank or your payment processor can.',
      },
      {
        q: 'Should I run both checks together?',
        a: 'Yes. Detect the brand from the prefix to show the right logo and apply brand rules, then run the Luhn check to reject mistyped numbers before submitting.',
      },
    ],
    keywords: ['card type vs card validation', 'detect card brand', 'luhn check card', 'credit card bin'],
  },
  {
    slug: 'ean-vs-isbn',
    category: 'security',
    title: 'EAN vs ISBN — Which Code Are You Validating?',
    h1: 'EAN vs ISBN',
    description:
      'EAN validates retail product barcodes (GTIN/EAN-13); ISBN validates book identifiers. Both check the checksum digit — free, in your browser.',
    intro:
      'EAN and ISBN are closely related identifier schemes that both end in a check digit. An EAN (part of the GTIN family) is the barcode on retail products — groceries, electronics, packaging — usually 13 digits. An ISBN identifies a specific book edition. They overlap by design: a modern ISBN-13 is actually an EAN-13 in the 978/979 (Bookland) range, and both ISBN-13 and EAN-13 use a mod-10 checksum. The older ISBN-10 is different — it uses a mod-11 checksum where the final character can be an X. These tools verify the checksum and format only, not whether the product or book actually exists.',
    options: [
      {
        label: 'EAN / GTIN',
        toolId: 'ean-validate',
        best: 'Checking retail product barcodes (EAN-13, EAN-8, UPC/GTIN).',
        pros: [
          'Validates the GTIN/EAN mod-10 check digit',
          'Covers everyday retail barcodes on packaged goods',
          'Catches a mistyped or mis-scanned digit',
        ],
        cons: [
          'Confirms the checksum, not that the product is registered or real',
          'Not specific to books — use ISBN rules for book metadata',
        ],
      },
      {
        label: 'ISBN',
        toolId: 'isbn-validate',
        best: 'Checking book identifiers — both ISBN-13 and legacy ISBN-10.',
        pros: [
          'Handles ISBN-13 (mod-10) and ISBN-10 (mod-11, X check digit)',
          'ISBN-13 is an EAN-13 in the 978/979 range, so it ties into retail',
          'Catches transcription errors in catalog and library data',
        ],
        cons: [
          'A valid checksum does not prove the book exists or is in print',
          'ISBN-10 uses a different (mod-11) check than retail barcodes',
        ],
      },
    ],
    verdict:
      'Validating the barcode on a physical retail product? Use the EAN/GTIN check. Validating a book identifier — especially a 10-digit code, or one you want treated as a book? Use the ISBN check, which also understands the mod-11 ISBN-10 form. Remember the overlap: an ISBN-13 starting with 978 or 979 is a valid EAN-13 too. Both tools verify structure and the check digit only — they do not look the item up in any database.',
    faqs: [
      {
        q: 'Is an ISBN-13 also a valid EAN?',
        a: 'Yes. An ISBN-13 is an EAN-13 in the 978 or 979 (Bookland) prefix range, and both share the same mod-10 check digit. So a 978/979 ISBN-13 will pass an EAN-13 checksum check.',
      },
      {
        q: 'Why does ISBN-10 use a different checksum?',
        a: 'ISBN-10 predates the EAN-13 alignment and uses a mod-11 weighted checksum, where the final character can be X (representing 10). EAN-13 and ISBN-13 both use the simpler mod-10 scheme.',
      },
    ],
    keywords: ['ean vs isbn', 'validate barcode', 'isbn checksum', 'gtin ean13'],
  },
  {
    slug: 'posterize-vs-threshold',
    category: 'image',
    title: 'Posterize vs Threshold — Which Image Effect Do You Want?',
    h1: 'Posterize vs Threshold',
    description:
      'Posterize reduces an image to a few flat color levels; threshold converts it to pure black and white by luminance. Compare both — free, in your browser.',
    intro:
      'Both effects simplify an image by cutting down its tonal range, but to very different degrees. Posterize quantizes each channel into a chosen number of levels, so smooth gradients become flat bands of color — a poster-like, screen-printed look that keeps color. Threshold goes all the way: it measures each pixel’s luminance and turns it pure black or pure white, producing a stark two-tone, high-contrast result. Both process the image entirely in your browser; nothing is uploaded.',
    options: [
      {
        label: 'Posterize',
        toolId: 'image-posterize',
        best: 'A flat, banded, poster-style look that keeps color.',
        pros: [
          'Reduces each channel to N levels you choose',
          'Keeps color while flattening gradients into bands',
          'Great for screen-print, pop-art and stylized graphics',
        ],
        cons: [
          'Not for pure black-and-white output',
          'Too few levels can look harsh on photos',
        ],
      },
      {
        label: 'Threshold',
        toolId: 'image-threshold',
        best: 'Stark two-tone black-and-white from luminance.',
        pros: [
          'Converts to pure black/white at a luminance cutoff you set',
          'High-contrast, ideal for stencils, logos and line art',
          'Clean basis for tracing or silhouettes',
        ],
        cons: [
          'Discards all color and mid-tones',
          'Fine detail can be lost if the cutoff is off',
        ],
      },
    ],
    verdict:
      'Want a stylized, colorful poster look with flat bands of tone? Use posterize and pick how many levels to keep. Want a hard black-and-white image — a stencil, silhouette or logo cleanup? Use threshold and tune the luminance cutoff. Posterize keeps color and several levels; threshold keeps just two. You can even posterize first for a graphic look, then threshold a copy for a matching mask.',
    faqs: [
      {
        q: 'What’s the difference between posterize and threshold?',
        a: 'Posterize reduces each color channel to a few flat levels but keeps color, giving a banded poster effect. Threshold reduces the whole image to two levels — pure black and white — based on each pixel’s luminance.',
      },
      {
        q: 'Which should I use to make a stencil?',
        a: 'Threshold. Its pure black-and-white output gives clean shapes to cut or trace. Posterize keeps color and multiple tones, which is better for a stylized graphic than a stencil.',
      },
    ],
    keywords: ['posterize vs threshold', 'image posterize', 'image threshold', 'black and white image effect'],
  },
  {
    slug: 'random-words-vs-lorem',
    category: 'text',
    title: 'Random Words vs Lorem Ipsum — Which Placeholder Text?',
    h1: 'Random Words vs Lorem Ipsum',
    description:
      'Random Words outputs real, readable English words; Lorem Ipsum produces classic neutral Latin filler. Pick the right placeholder text — free, in your browser.',
    intro:
      'Both generate filler text, but the words themselves differ. The random word generator outputs real English words, so the result is readable and useful when you want recognizable language — word lists, prompts, test data or quick examples. Lorem Ipsum produces the familiar pseudo-Latin filler that reads as neutral gibberish, which is exactly the point in design: it fills space without the words distracting reviewers or implying real content. Both run in your browser with no upload.',
    options: [
      {
        label: 'Random Words',
        toolId: 'random-words',
        best: 'Real, readable English words for lists, prompts and test data.',
        pros: [
          'Outputs genuine English words people recognize',
          'Good for word games, prompts, passphrase ideas and sample data',
          'Choose how many words you need',
        ],
        cons: [
          'Real words can distract reviewers from a layout',
          'Not the conventional design-mockup filler',
        ],
      },
      {
        label: 'Lorem Ipsum',
        toolId: 'lorem-ipsum',
        best: 'Neutral filler for layouts and design mockups.',
        pros: [
          'The industry-standard placeholder for design and print',
          'Reads as neutral so it doesn’t distract from the layout',
          'Generate by paragraphs, sentences or words',
        ],
        cons: [
          'Not real language — useless if you need readable words',
          'Latin-like text can look odd left in a shipped page',
        ],
      },
    ],
    verdict:
      'Pick Random Words when you need actual readable English — sample lists, word games, prompts, or test fixtures where the words matter. Pick Lorem Ipsum when you are mocking up a layout and want neutral filler that holds space without the content pulling focus. Designers reach for Lorem; people who need real vocabulary reach for Random Words.',
    faqs: [
      {
        q: 'Why use Lorem Ipsum instead of real words?',
        a: 'Lorem Ipsum is intentionally meaningless, so reviewers focus on the layout and typography rather than reading the copy. Real words tend to pull attention to the content itself, which is why designers prefer neutral filler.',
      },
      {
        q: 'Which is better for test data?',
        a: 'Random Words, when you want recognizable English tokens to eyeball. Lorem Ipsum is better when you just need realistic-length blocks of text to fill a design.',
      },
    ],
    keywords: ['random words vs lorem ipsum', 'placeholder text', 'lorem ipsum alternative', 'random word generator'],
  },
  {
    slug: 'business-days-vs-date-diff',
    category: 'util',
    title: 'Business Days vs Date Difference — Working or Calendar Days?',
    h1: 'Business Days vs Date Difference',
    description:
      'Business Days counts working days and skips weekends; Date Difference counts the total calendar span between two dates. Pick the right one — free, in your browser.',
    intro:
      'Both measure the gap between two dates, but they count differently. The business-days calculator counts only working days, skipping weekends, which is what you want for delivery estimates, SLAs and project timelines. The date-difference calculator counts the full calendar span — every day, or the breakdown in years, months and days — which is what you want for ages, anniversaries and total durations. Choosing the wrong one is a common source of off-by-a-few errors.',
    options: [
      {
        label: 'Business Days',
        toolId: 'business-days',
        best: 'Working-day counts that skip weekends — SLAs, deliveries, deadlines.',
        pros: [
          'Counts only Monday–Friday, skipping weekends',
          'Matches how delivery windows and SLAs are quoted',
          'Better for project and turnaround estimates',
        ],
        cons: [
          'Public holidays vary by region and may need manual allowance',
          'Not for a simple total-days or age calculation',
        ],
      },
      {
        label: 'Date Difference',
        toolId: 'date-diff',
        best: 'Total calendar span between two dates — ages, durations, countdowns.',
        pros: [
          'Counts every calendar day between the dates',
          'Breaks the span into years, months and days',
          'Ideal for ages, anniversaries and total durations',
        ],
        cons: [
          'Includes weekends, so it overstates working time',
          'Not aware of business holidays',
        ],
      },
    ],
    verdict:
      'Quoting a turnaround, a delivery date or an SLA? Use Business Days so weekends don’t inflate the count. Measuring an age, an anniversary, or the total time between two dates? Use Date Difference for the full calendar span. The two answers will differ whenever a weekend falls inside the range, so match the tool to whether weekends should count.',
    faqs: [
      {
        q: 'Do these tools account for public holidays?',
        a: 'The business-days calculator skips weekends; public holidays vary by country and region, so check whether you need to subtract any specific holidays manually. The date-difference calculator counts every calendar day regardless.',
      },
      {
        q: 'Why do the two give different numbers?',
        a: 'Date Difference counts all calendar days, including weekends, while Business Days skips Saturdays and Sundays. Any weekend inside the range makes the business-day count smaller.',
      },
    ],
    keywords: ['business days vs date difference', 'working days calculator', 'days between dates', 'skip weekends'],
  },
];

export const COMPARE_SLUGS: string[] = COMPARES.map((c) => c.slug);

export function getCompare(slug: string): Compare | undefined {
  return COMPARES.find((c) => c.slug === slug);
}

/** Comparisons that reference a given tool id (for cross-linking from tool pages). */
export function comparesForTool(toolId: string): Compare[] {
  return COMPARES.filter((c) => c.options.some((o) => o.toolId === toolId));
}

/** 변환 매트릭스 slug 와 연결된 비교 (convert → compare 역링크). */
export function compareForConvert(convertSlug: string): Compare | undefined {
  return COMPARES.find((c) => c.relatedConverts?.includes(convertSlug));
}

/**
 * 다른 비교 (compare → compare 내부 링크).
 * 같은 카테고리를 우선 노출하고, 부족하면 다른 카테고리로 채워 빈 섹션을 방지한다.
 */
export function relatedCompares(slug: string, limit = 4): Compare[] {
  const self = COMPARES.find((c) => c.slug === slug);
  if (!self) return [];
  const sameCat = COMPARES.filter((c) => c.slug !== slug && c.category === self.category);
  if (sameCat.length >= limit) return sameCat.slice(0, limit);
  const others = COMPARES.filter((c) => c.slug !== slug && c.category !== self.category);
  return [...sameCat, ...others].slice(0, limit);
}
