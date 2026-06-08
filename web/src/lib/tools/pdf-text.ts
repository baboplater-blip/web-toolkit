/**
 * PDF 텍스트·이미지·메타데이터 추출 공용 유틸 (pdfjs-dist 기반).
 *
 * - extractTextPerPage: 페이지별 텍스트 + 위치 + 폰트 정보
 * - extractPlainText:   페이지별 평문 (단락 보존)
 * - extractHeadings:    폰트 크기로 헤딩 후보 식별 → Markdown 구조화
 * - extractImagesFromPdf: 페이지에 포함된 이미지 추출 (PNG)
 * - getPdfMetadata:     Info dict + XMP 메타데이터
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjs;
}

export async function openPdfDoc(
  file: File | Blob | ArrayBuffer,
  password?: string,
): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const buf = file instanceof ArrayBuffer ? file : await (file as File | Blob).arrayBuffer();
  try {
    // password 가 주어지면 암호화 PDF 의 열람 암호로 전달 (PasswordException 재시도용)
    return await pdfjs.getDocument({ data: new Uint8Array(buf), password }).promise;
  } catch (err) {
    throw normalizePdfjsError(err);
  }
}

/**
 * pdf.js 로더 에러 정규화 — PasswordException 은 message 를 한국어로 바꾸되
 * name/code 는 보존해 비밀번호 입력 UI 가 그대로 감지할 수 있게 한다.
 * 그 외 에러는 원본을 그대로 돌려준다.
 */
export function normalizePdfjsError(err: unknown): unknown {
  if (!isPasswordException(err)) return err;
  const code = (err as { code?: number }).code;
  const friendly = new Error(describePdfError(err)) as Error & { name: string; code?: number };
  friendly.name = 'PasswordException';
  if (typeof code === 'number') friendly.code = code;
  return friendly;
}

/**
 * pdf.js PasswordException 여부 — code 1 = 암호 필요, 2 = 암호 틀림.
 * 호출부에서 비밀번호 입력 UI 분기에 사용.
 */
export function isPasswordException(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'PasswordException';
}

/** PasswordException 의 code — 1 = 암호 필요, 2 = 암호 틀림, 그 외 undefined. */
export function passwordExceptionCode(err: unknown): number | undefined {
  if (!isPasswordException(err)) return undefined;
  const code = (err as { code?: number }).code;
  return typeof code === 'number' ? code : undefined;
}

/**
 * pdf.js 로더 에러를 한국어 사용자 메시지로 정규화.
 * 암호화/비밀번호 PDF 는 raw 영문 에러 대신 명확한 안내를 돌려준다.
 * 암호가 아닌 에러는 fallback 메시지를 사용.
 */
export function describePdfError(err: unknown, fallback = 'PDF 처리에 실패했습니다.'): string {
  const code = passwordExceptionCode(err);
  if (code === 2) return '비밀번호가 올바르지 않습니다. 다시 입력해주세요.';
  if (code === 1 || isPasswordException(err)) {
    return '암호화된(또는 비밀번호가 걸린) PDF입니다. 비밀번호를 입력해주세요.';
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export interface PageTextLine {
  text: string;
  /** 평균 폰트 높이 (pt) — 헤딩 검출용 */
  avgFontHeight: number;
  /** 라인 시작 y (pdf 좌표계) */
  y: number;
}

/**
 * 페이지 텍스트를 라인 단위로 추출 (y 좌표 클러스터링).
 */
export async function extractPageLines(page: PDFPageProxy): Promise<PageTextLine[]> {
  const content = await page.getTextContent();
  const items = (content.items as TextItem[]).filter((i) => 'str' in i && i.str !== undefined);

  // y 좌표 기준 라인 그룹화 (tolerance 2pt)
  type Buf = { y: number; chunks: Array<{ x: number; text: string; h: number }> };
  const lines: Buf[] = [];

  for (const it of items) {
    if (!it.str) continue;
    const t = it.transform; // [a,b,c,d,e,f] — translation x = e, y = f
    if (!t || t.length < 6) continue;
    const x = t[4];
    const y = t[5];
    const h = Math.abs(it.height ?? Math.hypot(t[2], t[3]) ?? 10);
    const existing = lines.find((l) => Math.abs(l.y - y) < 2);
    if (existing) {
      existing.chunks.push({ x, text: it.str, h });
    } else {
      lines.push({ y, chunks: [{ x, text: it.str, h }] });
    }
  }

  // y 큰 값이 위 → 내림차순 정렬
  lines.sort((a, b) => b.y - a.y);

  return lines.map<PageTextLine>((l) => {
    l.chunks.sort((a, b) => a.x - b.x);
    const text = mergeChunks(l.chunks);
    const avgH = l.chunks.reduce((s, c) => s + c.h, 0) / Math.max(1, l.chunks.length);
    return { text, avgFontHeight: avgH, y: l.y };
  });
}

function mergeChunks(chunks: Array<{ x: number; text: string; h: number }>): string {
  let out = '';
  let prevX: number | null = null;
  let prevH = 0;
  for (const c of chunks) {
    if (prevX !== null) {
      const gap = c.x - prevX;
      // 작은 갭은 무시, 큰 갭은 공백 삽입 (대략 문자폭 절반)
      const charWidth = (prevH || c.h || 10) * 0.3;
      if (gap > charWidth && !out.endsWith(' ') && !c.text.startsWith(' ')) {
        out += ' ';
      }
    }
    out += c.text;
    prevX = c.x + estimateWidth(c.text, c.h);
    prevH = c.h;
  }
  return out.replace(/\s+$/g, '');
}

function estimateWidth(s: string, h: number): number {
  return s.length * h * 0.5;
}

/**
 * 페이지별 평문 (단락 보존, 라인 합침).
 */
export async function extractPlainText(
  pdf: PDFDocumentProxy,
  options: { joinHyphenated?: boolean; signal?: { aborted: boolean }; onProgress?: (p: number) => void } = {},
): Promise<string[]> {
  const pages: string[] = [];
  const total = pdf.numPages;
  for (let i = 1; i <= total; i++) {
    if (options.signal?.aborted) throw new Error('취소되었습니다.');
    const page = await pdf.getPage(i);
    const lines = await extractPageLines(page);
    const merged = mergeLinesToParagraphs(lines, options.joinHyphenated ?? true);
    pages.push(merged);
    page.cleanup();
    options.onProgress?.(i / total);
  }
  return pages;
}

function mergeLinesToParagraphs(lines: PageTextLine[], joinHyphenated: boolean): string {
  if (lines.length === 0) return '';
  const out: string[] = [];
  let buf = '';
  let prevY: number | null = null;
  let prevH = 0;
  for (const l of lines) {
    const t = l.text.trim();
    if (!t) {
      if (buf) { out.push(buf); buf = ''; }
      continue;
    }
    if (prevY === null) {
      buf = t;
    } else {
      const gap = prevY - l.y; // 위에서 아래로
      const breakThreshold = (prevH || l.avgFontHeight || 12) * 1.5;
      if (gap > breakThreshold) {
        out.push(buf);
        buf = t;
      } else {
        // 행 연결
        if (joinHyphenated && /[a-zA-Z]-$/.test(buf)) {
          buf = buf.replace(/-$/, '') + t;
        } else {
          buf = buf.endsWith(' ') ? buf + t : `${buf} ${t}`;
        }
      }
    }
    prevY = l.y;
    prevH = l.avgFontHeight;
  }
  if (buf) out.push(buf);
  return out.join('\n\n');
}

/**
 * 폰트 크기로 헤딩 후보 검출 → Markdown 으로 구조화.
 */
export async function extractMarkdown(
  pdf: PDFDocumentProxy,
  options: { signal?: { aborted: boolean }; onProgress?: (p: number) => void } = {},
): Promise<string> {
  // 1) 전체 평균 폰트 크기 추정 (첫 페이지 샘플)
  const sample = await pdf.getPage(1);
  const sampleLines = await extractPageLines(sample);
  const allHeights = sampleLines.map((l) => l.avgFontHeight).filter((h) => h > 0);
  const median = medianOf(allHeights) || 12;
  sample.cleanup();

  const out: string[] = [];
  const total = pdf.numPages;
  for (let i = 1; i <= total; i++) {
    if (options.signal?.aborted) throw new Error('취소되었습니다.');
    const page = await pdf.getPage(i);
    const lines = await extractPageLines(page);
    let lastY: number | null = null;
    let lastH = 0;
    let paragraph = '';
    const flush = () => {
      if (paragraph.trim()) out.push(paragraph.trim());
      paragraph = '';
    };

    for (const l of lines) {
      const text = l.text.trim();
      if (!text) {
        flush();
        continue;
      }
      const ratio = l.avgFontHeight / median;
      let prefix = '';
      if (ratio > 1.6) prefix = '# ';
      else if (ratio > 1.35) prefix = '## ';
      else if (ratio > 1.15) prefix = '### ';

      if (prefix) {
        flush();
        out.push(`${prefix}${text}`);
        lastY = l.y;
        lastH = l.avgFontHeight;
        continue;
      }

      if (lastY !== null) {
        const gap = lastY - l.y;
        const breakT = (lastH || l.avgFontHeight) * 1.5;
        if (gap > breakT) {
          flush();
          paragraph = text;
        } else {
          if (/[a-zA-Z]-$/.test(paragraph)) {
            paragraph = paragraph.replace(/-$/, '') + text;
          } else {
            paragraph = paragraph ? `${paragraph} ${text}` : text;
          }
        }
      } else {
        paragraph = text;
      }
      lastY = l.y;
      lastH = l.avgFontHeight;
    }
    flush();
    out.push(''); // 페이지 사이 빈 줄
    page.cleanup();
    options.onProgress?.(i / total);
  }
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

/**
 * PDF 페이지에 포함된 이미지 추출 (PNG dataURL 또는 Uint8Array).
 *
 * pdfjs operatorList 에서 paintImageXObject ops 를 찾아 page.objs.get(name)
 * 으로 ImageBitmap-like 객체를 받아 캔버스에 그려 PNG 인코딩한다.
 */
export interface ExtractedImage {
  page: number;
  index: number;
  width: number;
  height: number;
  png: Uint8Array;
}

export async function extractImagesFromPdf(
  pdf: PDFDocumentProxy,
  options: { signal?: { aborted: boolean }; onProgress?: (p: number) => void } = {},
): Promise<ExtractedImage[]> {
  const pdfjs = await loadPdfJs();
  const OPS = pdfjs.OPS;
  const out: ExtractedImage[] = [];
  const total = pdf.numPages;
  for (let i = 1; i <= total; i++) {
    if (options.signal?.aborted) throw new Error('취소되었습니다.');
    const page = await pdf.getPage(i);
    const opList = await page.getOperatorList();
    let counter = 0;
    for (let j = 0; j < opList.fnArray.length; j++) {
      const fn = opList.fnArray[j];
      if (
        fn !== OPS.paintImageXObject &&
        fn !== OPS.paintInlineImageXObject &&
        fn !== OPS.paintImageMaskXObject
      ) continue;
      const args = opList.argsArray[j];
      const name = args?.[0];
      if (typeof name !== 'string') continue;
      try {
        const imgObj = await getImageObject(page, name);
        if (!imgObj) continue;
        const png = await imageObjectToPng(imgObj);
        if (png) {
          counter++;
          out.push({
            page: i,
            index: counter,
            width: imgObj.width,
            height: imgObj.height,
            png,
          });
        }
      } catch {
        // skip
      }
    }
    page.cleanup();
    options.onProgress?.(i / total);
  }
  return out;
}

interface PdfImageObject {
  width: number;
  height: number;
  bitmap?: ImageBitmap;
  data?: Uint8ClampedArray | Uint8Array;
  kind?: number; // ImageKind from pdfjs (1 GRAYSCALE_1BPP, 2 RGB_24BPP, 3 RGBA_32BPP)
}

function getImageObject(page: PDFPageProxy, name: string): Promise<PdfImageObject | null> {
  return new Promise((resolve) => {
    const tryGet = () => {
      try {
        const obj = page.objs.get(name);
        if (obj) resolve(obj as PdfImageObject);
        else resolve(null);
      } catch {
        resolve(null);
      }
    };
    // 일부 버전은 동기/비동기 모두 지원
    if (typeof (page.objs as { has?: (k: string) => boolean }).has === 'function' && (page.objs as { has: (k: string) => boolean }).has(name)) {
      tryGet();
    } else {
      // wait — fallback
      setTimeout(tryGet, 0);
    }
  });
}

async function imageObjectToPng(img: PdfImageObject): Promise<Uint8Array | null> {
  const w = img.width;
  const h = img.height;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
  } else if (img.data) {
    // raw pixels — kind 1 = grayscale 1bpp packed, 2 = RGB 24bpp, 3 = RGBA 32bpp
    const imageData = ctx.createImageData(w, h);
    if (img.kind === 3) {
      imageData.data.set(img.data);
    } else if (img.kind === 2) {
      const src = img.data;
      for (let i = 0, p = 0; i < src.length; i += 3, p += 4) {
        imageData.data[p] = src[i];
        imageData.data[p + 1] = src[i + 1];
        imageData.data[p + 2] = src[i + 2];
        imageData.data[p + 3] = 255;
      }
    } else if (img.kind === 1) {
      // 1bpp packed
      const src = img.data;
      const rowBytes = Math.ceil(w / 8);
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          const bit = (src[yy * rowBytes + (xx >> 3)] >> (7 - (xx & 7))) & 1;
          const v = bit ? 255 : 0;
          const idx = (yy * w + xx) * 4;
          imageData.data[idx] = v;
          imageData.data[idx + 1] = v;
          imageData.data[idx + 2] = v;
          imageData.data[idx + 3] = 255;
        }
      }
    } else {
      // 알 수 없음
      return null;
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    return null;
  }

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

/* ------------------- Metadata ------------------- */
export interface PdfMetaInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
}

export async function getPdfMetadata(pdf: PDFDocumentProxy): Promise<PdfMetaInfo> {
  const m = await pdf.getMetadata();
  const info = (m.info as Record<string, unknown>) ?? {};
  const str = (k: string) => {
    const v = info[k];
    return typeof v === 'string' ? v : '';
  };
  return {
    title: str('Title'),
    author: str('Author'),
    subject: str('Subject'),
    keywords: str('Keywords'),
    creator: str('Creator'),
    producer: str('Producer'),
    creationDate: str('CreationDate') || undefined,
    modificationDate: str('ModDate') || undefined,
  };
}

/* ------------------- Outline ------------------- */
export interface OutlineNode {
  title: string;
  level: number;
  children: OutlineNode[];
}

export async function getPdfOutline(pdf: PDFDocumentProxy): Promise<OutlineNode[]> {
  const raw = await pdf.getOutline();
  if (!raw) return [];
  function map(items: Array<{ title: string; items?: unknown[] }>, level: number): OutlineNode[] {
    return items.map((it) => ({
      title: it.title || '',
      level,
      children: it.items ? map(it.items as Array<{ title: string; items?: unknown[] }>, level + 1) : [],
    }));
  }
  return map(raw as Array<{ title: string; items?: unknown[] }>, 0);
}

/** 페이지 폰트 수집 — operatorList 의 setFont 호출 추적 */
export async function collectFonts(pdf: PDFDocumentProxy, maxPages = 5): Promise<string[]> {
  const fontNames = new Set<string>();
  const limit = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= limit; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const styles = (content.styles as Record<string, { fontFamily?: string }>) ?? {};
    for (const k of Object.keys(styles)) {
      const fam = styles[k]?.fontFamily;
      if (fam) fontNames.add(fam);
    }
    page.cleanup();
  }
  return Array.from(fontNames);
}
