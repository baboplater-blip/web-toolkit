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
