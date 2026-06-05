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
