/**
 * EPUB 공용 유틸 — 파싱·내용 추출·재조립.
 *
 * 모든 처리는 브라우저 안에서 JSZip 으로 EPUB 컨테이너(.zip) 를 풀고 다시 묶는다.
 * 대형 책(>100MB)·DRM 보호 EPUB 은 지원하지 않는다.
 *
 * 의존:
 *   - jszip (압축 풀기·재압축)
 *   - turndown (HTML → Markdown, 일부 도구에서만 사용)
 */

import JSZip from 'jszip';

export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface EpubMetadata {
  title: string;
  creator: string;
  language: string;
  identifier: string;
  description?: string;
  publisher?: string;
  date?: string;
  subjects: string[];
  rights?: string;
  /** 임의 dc:* 태그 보존 (편집기에서 표시) */
  extra?: Record<string, string>;
}

export interface ParsedEpub {
  zip: JSZip;
  opfPath: string;
  opfDir: string;
  opfXml: string;
  metadata: EpubMetadata;
  manifest: Map<string, EpubManifestItem>;
  /** href → manifest item (역방향 lookup) */
  manifestByHref: Map<string, EpubManifestItem>;
  spine: string[]; // idref 배열, reading order
  coverItemId?: string;
  coverHref?: string;
  /** EPUB 2 vs 3 구분 */
  version: '2' | '3';
}

const TEXT_EXTS = new Set(['xhtml', 'html', 'htm']);
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']);

export function isImageExt(ext: string): boolean {
  return IMAGE_EXTS.has(ext.toLowerCase());
}

export function isHtmlExt(ext: string): boolean {
  return TEXT_EXTS.has(ext.toLowerCase());
}

export function mimeForExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'gif') return 'image/gif';
  if (e === 'webp') return 'image/webp';
  if (e === 'svg') return 'image/svg+xml';
  if (e === 'xhtml' || e === 'html' || e === 'htm') return 'application/xhtml+xml';
  if (e === 'css') return 'text/css';
  if (e === 'js') return 'application/javascript';
  if (e === 'ttf') return 'application/x-font-ttf';
  if (e === 'otf') return 'application/x-font-otf';
  if (e === 'woff') return 'font/woff';
  if (e === 'woff2') return 'font/woff2';
  if (e === 'ncx') return 'application/x-dtbncx+xml';
  return 'application/octet-stream';
}

/** 정규화된 EPUB 내부 경로 (../ 와 ./ 제거) */
export function normalizeEpubPath(p: string): string {
  const parts: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

export function resolveHref(opfDir: string, href: string): string {
  return normalizeEpubPath(opfDir + href);
}

export function extOf(path: string): string {
  const i = path.lastIndexOf('.');
  return i >= 0 ? path.substring(i + 1) : '';
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function encodeXmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseContainerXml(xml: string): string {
  const m = xml.match(/<rootfile[^>]*full-path=["']([^"']+)["']/i);
  if (!m) throw new Error('container.xml 에서 OPF 경로를 찾지 못했습니다.');
  return m[1];
}

function getDcText(xml: string, tag: string): string {
  const re = new RegExp(`<dc:${tag}[^>]*>([\\s\\S]*?)<\\/dc:${tag}>`, 'i');
  const m = xml.match(re);
  return m ? decodeEntities(m[1].trim()) : '';
}

function getAllDcText(xml: string, tag: string): string[] {
  const re = new RegExp(`<dc:${tag}[^>]*>([\\s\\S]*?)<\\/dc:${tag}>`, 'gi');
  const out: string[] = [];
  for (const m of xml.matchAll(re)) out.push(decodeEntities(m[1].trim()));
  return out;
}

function parseOpf(xml: string): {
  metadata: EpubMetadata;
  manifest: Map<string, EpubManifestItem>;
  manifestByHref: Map<string, EpubManifestItem>;
  spine: string[];
  coverItemId?: string;
  version: '2' | '3';
} {
  const versionMatch = xml.match(/<package[^>]*\bversion\s*=\s*["']([^"']+)["']/i);
  const version: '2' | '3' = versionMatch && versionMatch[1].startsWith('3') ? '3' : '2';

  const metaBlockMatch = xml.match(/<metadata[\s\S]*?<\/metadata>/i);
  const metaBlock = metaBlockMatch ? metaBlockMatch[0] : '';

  const metadata: EpubMetadata = {
    title: getDcText(metaBlock, 'title') || '제목 없음',
    creator: getDcText(metaBlock, 'creator'),
    language: getDcText(metaBlock, 'language') || 'ko',
    identifier: getDcText(metaBlock, 'identifier') || `urn:uuid:${randomUuid()}`,
    description: getDcText(metaBlock, 'description') || undefined,
    publisher: getDcText(metaBlock, 'publisher') || undefined,
    date: getDcText(metaBlock, 'date') || undefined,
    subjects: getAllDcText(metaBlock, 'subject'),
    rights: getDcText(metaBlock, 'rights') || undefined,
  };

  const manifest = new Map<string, EpubManifestItem>();
  const manifestByHref = new Map<string, EpubManifestItem>();
  for (const m of xml.matchAll(/<item\b[^>]*\/?>/gi)) {
    const tag = m[0];
    if (/^<itemref/i.test(tag)) continue;
    const id = attr(tag, 'id');
    const href = attr(tag, 'href');
    const mediaType = attr(tag, 'media-type');
    const properties = attr(tag, 'properties') ?? undefined;
    if (!id || !href) continue;
    const item: EpubManifestItem = {
      id,
      href: decodeEntities(href),
      mediaType: mediaType ?? '',
      properties,
    };
    manifest.set(id, item);
    manifestByHref.set(item.href, item);
  }

  const spine: string[] = [];
  for (const m of xml.matchAll(/<itemref\b[^>]*\/?>/gi)) {
    const idref = attr(m[0], 'idref');
    if (idref) spine.push(idref);
  }

  // 표지 검출 — EPUB3: properties="cover-image", EPUB2: <meta name="cover" content="...">
  let coverItemId: string | undefined;
  for (const item of manifest.values()) {
    if (item.properties && /\bcover-image\b/.test(item.properties)) {
      coverItemId = item.id;
      break;
    }
  }
  if (!coverItemId) {
    const coverMetaMatch = metaBlock.match(
      /<meta[^>]*\bname\s*=\s*["']cover["'][^>]*\bcontent\s*=\s*["']([^"']+)["']/i,
    );
    if (coverMetaMatch && manifest.has(coverMetaMatch[1])) {
      coverItemId = coverMetaMatch[1];
    }
  }
  // 마지막 폴백 — id 또는 href 에 cover 가 포함된 이미지
  if (!coverItemId) {
    for (const item of manifest.values()) {
      if (
        item.mediaType.startsWith('image/') &&
        (item.id.toLowerCase().includes('cover') || item.href.toLowerCase().includes('cover'))
      ) {
        coverItemId = item.id;
        break;
      }
    }
  }

  return { metadata, manifest, manifestByHref, spine, coverItemId, version };
}

export async function parseEpub(file: File | Blob | ArrayBuffer): Promise<ParsedEpub> {
  const buf = file instanceof ArrayBuffer ? file : await (file as File | Blob).arrayBuffer();
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    throw new Error('EPUB 파일을 열 수 없습니다. 손상되었거나 보호된 파일일 수 있습니다.');
  }

  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('유효한 EPUB 이 아닙니다 (META-INF/container.xml 없음).');
  }
  const containerXml = await containerFile.async('text');
  const opfPath = parseContainerXml(containerXml);
  const opfFile = zip.file(opfPath);
  if (!opfFile) throw new Error(`OPF 파일을 찾을 수 없습니다: ${opfPath}`);
  const opfXml = await opfFile.async('text');

  const parsed = parseOpf(opfXml);
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  return {
    zip,
    opfPath,
    opfDir,
    opfXml,
    metadata: parsed.metadata,
    manifest: parsed.manifest,
    manifestByHref: parsed.manifestByHref,
    spine: parsed.spine,
    coverItemId: parsed.coverItemId,
    coverHref: parsed.coverItemId ? parsed.manifest.get(parsed.coverItemId)?.href : undefined,
    version: parsed.version,
  };
}

/** spine 순서로 챕터 파일 내용 + manifest item 정보 반환 */
export async function readChapter(
  epub: ParsedEpub,
  idref: string,
): Promise<{ item: EpubManifestItem; path: string; xhtml: string } | null> {
  const item = epub.manifest.get(idref);
  if (!item) return null;
  const path = resolveHref(epub.opfDir, item.href);
  const f = epub.zip.file(path);
  if (!f) return null;
  const xhtml = await f.async('text');
  return { item, path, xhtml };
}

/** XHTML body 내용만 추출 + script/외부 stylesheet 제거 */
export function extractBody(xhtml: string): string {
  const m = xhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = m ? m[1] : xhtml;
  body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*\/?>/gi, '');
  return body;
}

/** HTML 태그를 모두 벗기고 순수 텍스트만. 단락은 빈 줄로 구분. */
export function htmlToPlainText(html: string): string {
  let s = html;
  // 블록 요소 끝 → 단락 구분자
  s = s.replace(/<\s*(p|div|h[1-6]|li|tr|td|th|blockquote|section|article|hr|pre)\b[^>]*>/gi, '\n');
  s = s.replace(/<\/\s*(p|div|h[1-6]|li|tr|td|th|blockquote|section|article|hr|pre)\s*>/gi, '\n');
  s = s.replace(/<\s*br\s*\/?>/gi, '\n');
  s = s.replace(/<\/?\s*[a-z][a-z0-9-]*[^>]*>/gi, '');
  s = decodeEntities(s);
  s = s.replace(/ /g, ' ');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n[ \t]+/g, '\n');
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/** 챕터 제목 추출 — <title>/<h1>/<h2>/첫 5단어 폴백 */
export function chapterTitle(xhtml: string, fallback: string): string {
  const titleTag = xhtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag && titleTag[1].trim()) return decodeEntities(titleTag[1]).trim();
  const hMatch = xhtml.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (hMatch) {
    const t = htmlToPlainText(hMatch[1]);
    if (t) return t;
  }
  const body = extractBody(xhtml);
  const plain = htmlToPlainText(body).trim();
  if (!plain) return fallback;
  const words = plain.split(/\s+/).slice(0, 5).join(' ');
  return words.length < plain.length ? `${words}…` : words;
}

/** 모든 챕터를 순서대로 텍스트로 변환 */
export async function epubToText(epub: ParsedEpub, options: {
  includeTitles?: boolean;
  signal?: { aborted: boolean };
} = {}): Promise<string> {
  const parts: string[] = [];
  const opts = { includeTitles: true, ...options };
  for (let i = 0; i < epub.spine.length; i++) {
    if (opts.signal?.aborted) throw new Error('취소되었습니다.');
    const ch = await readChapter(epub, epub.spine[i]);
    if (!ch) continue;
    const body = extractBody(ch.xhtml);
    const text = htmlToPlainText(body);
    if (opts.includeTitles) {
      const t = chapterTitle(ch.xhtml, `Chapter ${i + 1}`);
      parts.push(`# ${t}\n\n${text}`);
    } else {
      parts.push(text);
    }
  }
  return parts.join('\n\n---\n\n');
}

/** UUID v4 (짧고 빠르게) */
export function randomUuid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : null;
  if (c && typeof (c as Crypto).randomUUID === 'function') {
    return (c as Crypto).randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (c) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

/* ============================================================
 * EPUB 빌더 — 새 EPUB 3 파일을 처음부터 만든다.
 * ============================================================ */

export interface BuildEpubChapter {
  /** 파일 ID (영문/숫자/하이픈만) */
  id: string;
  /** 화면 타이틀 (TOC + <title>) */
  title: string;
  /** XHTML body 내부에 들어갈 HTML (전체 <html> 아님) */
  bodyHtml: string;
}

export interface BuildEpubOptions {
  title: string;
  creator?: string;
  language?: string;
  identifier?: string;
  description?: string;
  publisher?: string;
  /** ISO 8601 형식 (없으면 현재 시각) */
  date?: string;
  subjects?: string[];
  chapters: BuildEpubChapter[];
  /** 표지 이미지 (있으면 cover.{ext} 로 추가됨) */
  cover?: { data: Uint8Array | ArrayBuffer; mediaType: string };
  /** 추가 자산 (이미지 등). path 는 OEBPS/ 기준 상대 경로 */
  assets?: Array<{ path: string; data: Uint8Array | ArrayBuffer; mediaType: string }>;
  /** 본문 CSS (없으면 기본 스타일) */
  css?: string;
}

const DEFAULT_CSS = `body{font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',serif;line-height:1.7;margin:1em;color:#111;}
h1,h2,h3{line-height:1.3;margin-top:1.5em;}
p{margin:0.5em 0;text-indent:0;}
img{max-width:100%;height:auto;}
hr{border:none;border-top:1px solid #ccc;margin:1.5em 0;}
blockquote{margin:1em 0;padding-left:1em;border-left:3px solid #ccc;color:#555;}
code{font-family:'Courier New',monospace;background:#f4f4f4;padding:0.1em 0.3em;border-radius:3px;}
pre{background:#f4f4f4;padding:0.8em;overflow-x:auto;}`;

function escapeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^([0-9])/, '_$1') || 'item';
}

export async function buildEpub(opts: BuildEpubOptions): Promise<Blob> {
  const zip = new JSZip();
  const language = opts.language || 'ko';
  const identifier = opts.identifier || `urn:uuid:${randomUuid()}`;
  const modifiedIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const dateIso = opts.date || modifiedIso;

  // 1) mimetype — 반드시 첫 파일, 무압축
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2) container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // 3) 본문 CSS
  zip.file('OEBPS/styles.css', opts.css ?? DEFAULT_CSS);

  // 4) 챕터 XHTML — id 충돌 방지
  const usedIds = new Set<string>();
  const chapters = opts.chapters.map((c, idx) => {
    let id = escapeId(c.id || `chap${idx + 1}`);
    let suffix = 0;
    while (usedIds.has(id)) {
      suffix++;
      id = `${escapeId(c.id || `chap${idx + 1}`)}_${suffix}`;
    }
    usedIds.add(id);
    return { ...c, id, file: `${id}.xhtml` };
  });

  for (const c of chapters) {
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}" xml:lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>${encodeXmlText(c.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
${c.bodyHtml}
</body>
</html>`;
    zip.file(`OEBPS/${c.file}`, xhtml);
  }

  // 5) nav.xhtml (EPUB3 목차)
  const navItems = chapters
    .map((c) => `      <li><a href="${c.file}">${encodeXmlText(c.title)}</a></li>`)
    .join('\n');
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}" xml:lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>목차</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>목차</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`,
  );

  // 6) 표지
  let coverItemEntry = '';
  let coverSpineEntry = '';
  let coverManifestExtra = '';
  if (opts.cover) {
    const ext = opts.cover.mediaType.split('/').pop()?.split('+')[0] ?? 'jpg';
    const coverFile = `cover.${ext === 'jpeg' ? 'jpg' : ext}`;
    zip.file(`OEBPS/${coverFile}`, opts.cover.data);
    coverManifestExtra += `\n    <item id="cover-image" href="${coverFile}" media-type="${opts.cover.mediaType}" properties="cover-image"/>`;

    // 표지 페이지 XHTML
    const coverPage = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>표지</title>
  <style>body{margin:0;padding:0;text-align:center;}img{max-width:100%;max-height:100vh;}</style>
</head>
<body>
  <div><img src="${coverFile}" alt="${encodeXmlText(opts.title)}" /></div>
</body>
</html>`;
    zip.file('OEBPS/cover.xhtml', coverPage);
    coverManifestExtra += `\n    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`;
    coverItemEntry = '';
    coverSpineEntry = '\n    <itemref idref="cover-page"/>';
  }

  // 7) 추가 자산
  let assetManifestExtra = '';
  if (opts.assets) {
    let i = 0;
    for (const a of opts.assets) {
      zip.file(`OEBPS/${a.path}`, a.data);
      const id = `asset_${i++}`;
      assetManifestExtra += `\n    <item id="${id}" href="${a.path}" media-type="${a.mediaType}"/>`;
    }
  }

  // 8) OPF
  const manifestItems = [
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="css" href="styles.css" media-type="text/css"/>`,
    ...chapters.map(
      (c) =>
        `    <item id="${c.id}" href="${c.file}" media-type="application/xhtml+xml"/>`,
    ),
  ].join('\n');

  const spineItems = chapters.map((c) => `    <itemref idref="${c.id}"/>`).join('\n');

  const subjectsXml = (opts.subjects ?? [])
    .map((s) => `    <dc:subject>${encodeXmlText(s)}</dc:subject>`)
    .join('\n');

  const opfXml = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${encodeXmlText(identifier)}</dc:identifier>
    <dc:title>${encodeXmlText(opts.title)}</dc:title>
    <dc:language>${encodeXmlText(language)}</dc:language>
    <dc:creator>${encodeXmlText(opts.creator ?? '')}</dc:creator>
${opts.description ? `    <dc:description>${encodeXmlText(opts.description)}</dc:description>\n` : ''}${opts.publisher ? `    <dc:publisher>${encodeXmlText(opts.publisher)}</dc:publisher>\n` : ''}    <dc:date>${encodeXmlText(dateIso)}</dc:date>
${subjectsXml ? subjectsXml + '\n' : ''}    <meta property="dcterms:modified">${modifiedIso}</meta>
${opts.cover ? '    <meta name="cover" content="cover-image"/>' : ''}
  </metadata>
  <manifest>
${manifestItems}${coverManifestExtra}${assetManifestExtra}${coverItemEntry}
  </manifest>
  <spine>${coverSpineEntry}
${spineItems}
  </spine>
</package>`;

  zip.file('OEBPS/content.opf', opfXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/* ============================================================
 * 기존 EPUB 의 OPF metadata 재작성 (메타데이터 편집기용)
 * ============================================================ */

export function rewriteOpfMetadata(opfXml: string, newMeta: EpubMetadata): string {
  // 새 metadata XML 구성 (기존 dc:* 제거 후 재삽입)
  const existingMetaMatch = opfXml.match(/<metadata([\s\S]*?)>([\s\S]*?)<\/metadata>/i);
  if (!existingMetaMatch) return opfXml;
  const [full, openAttrs, inner] = existingMetaMatch;

  // 기존 inner 에서 dc:* 와 <meta property="dcterms:modified"> 제거
  let cleaned = inner;
  cleaned = cleaned.replace(/<dc:title[\s\S]*?<\/dc:title>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:creator[\s\S]*?<\/dc:creator>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:language[\s\S]*?<\/dc:language>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:identifier[\s\S]*?<\/dc:identifier>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:description[\s\S]*?<\/dc:description>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:publisher[\s\S]*?<\/dc:publisher>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:date[\s\S]*?<\/dc:date>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:subject[\s\S]*?<\/dc:subject>\s*/gi, '');
  cleaned = cleaned.replace(/<dc:rights[\s\S]*?<\/dc:rights>\s*/gi, '');
  cleaned = cleaned.replace(/<meta[^>]*\bproperty\s*=\s*["']dcterms:modified["'][^>]*\/?>(?:[\s\S]*?<\/meta>)?\s*/gi, '');

  const modifiedIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const dcLines: string[] = [];
  dcLines.push(`    <dc:identifier id="bookid">${encodeXmlText(newMeta.identifier)}</dc:identifier>`);
  dcLines.push(`    <dc:title>${encodeXmlText(newMeta.title)}</dc:title>`);
  dcLines.push(`    <dc:creator>${encodeXmlText(newMeta.creator)}</dc:creator>`);
  dcLines.push(`    <dc:language>${encodeXmlText(newMeta.language)}</dc:language>`);
  if (newMeta.description) dcLines.push(`    <dc:description>${encodeXmlText(newMeta.description)}</dc:description>`);
  if (newMeta.publisher) dcLines.push(`    <dc:publisher>${encodeXmlText(newMeta.publisher)}</dc:publisher>`);
  if (newMeta.date) dcLines.push(`    <dc:date>${encodeXmlText(newMeta.date)}</dc:date>`);
  for (const s of newMeta.subjects) {
    if (s.trim()) dcLines.push(`    <dc:subject>${encodeXmlText(s.trim())}</dc:subject>`);
  }
  if (newMeta.rights) dcLines.push(`    <dc:rights>${encodeXmlText(newMeta.rights)}</dc:rights>`);
  dcLines.push(`    <meta property="dcterms:modified">${modifiedIso}</meta>`);

  // dc: 네임스페이스가 없으면 추가
  let newOpenAttrs = openAttrs;
  if (!/xmlns:dc\s*=/.test(newOpenAttrs)) {
    newOpenAttrs += ' xmlns:dc="http://purl.org/dc/elements/1.1/"';
  }

  const newMetaBlock = `<metadata${newOpenAttrs}>\n${dcLines.join('\n')}\n${cleaned.trim()}\n</metadata>`;
  return opfXml.replace(full, newMetaBlock);
}

/* ============================================================
 * EPUB 컨테이너 재패키징 (수정된 zip 을 mimetype-first 로 직렬화)
 *
 * 주의: JSZip 으로 빌드된 epub 은 mimetype 이 첫 파일이 아닐 수 있다.
 * 정확한 EPUB 스펙 준수를 위해 이 헬퍼로 다시 묶는다.
 * ============================================================ */
export async function repackageEpub(zip: JSZip): Promise<Blob> {
  const newZip = new JSZip();
  // mimetype 우선
  newZip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  for (const [path, entry] of Object.entries(zip.files)) {
    if (path === 'mimetype') continue;
    if (entry.dir) continue;
    const data = await entry.async('uint8array');
    newZip.file(path, data, { compression: 'DEFLATE' });
  }
  return await newZip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/* ============================================================
 * 보조 — 파일 사이즈 포맷
 * ============================================================ */
export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
