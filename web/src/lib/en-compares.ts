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
