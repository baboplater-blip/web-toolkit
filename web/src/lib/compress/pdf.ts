/**
 * PDF 압축 유틸리티.
 *
 * 세 가지 모드 지원:
 * - 'light': 메타데이터 제거 + ObjectStream 압축. 5~15% 감소, 원본 완전 보존.
 * - 'smart': 내부 JPEG(XObject) 을 재인코딩 + 다운샘플. 원본 PDF 구조/벡터/텍스트 완전 보존,
 *            이미지 품질만 조절. 10~80% 감소 (이미지 비중에 따라).
 * - 'rasterize': 각 페이지 전체를 JPEG 로 변환 후 새 PDF 재조립. 40~90% 감소,
 *                텍스트 선택/벡터 상실.
 */

import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFDict,
  PDFArray,
  PDFObject,
} from '@cantoo/pdf-lib';
import type { PDFPageProxy } from 'pdfjs-dist';

export type PdfCompressMode = 'light' | 'smart' | 'rasterize';

export interface PdfCompressOptions {
  mode: PdfCompressMode;
  /** JPEG 재인코딩 품질 (0~1). smart/rasterize 모드에서 사용. 기본 0.72 */
  quality: number;
  /** rasterize 모드 전용: 렌더링 scale (1 = 원본). 기본 1.5 */
  scale: number;
  /** smart 모드 전용: 이미지의 긴 변 최대 픽셀. 0 이면 다운샘플 안 함. 기본 1600 */
  maxImageDimension: number;
}

export interface PdfCompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
  /** smart 모드에서 처리된 이미지 개수 */
  imagesProcessed?: number;
  /** smart 모드에서 스킵된 이미지 개수 (JPEG 아닌 경우 등) */
  imagesSkipped?: number;
}

export interface PdfCompressProgress {
  stage: 'preparing' | 'scanning' | 'recompressing' | 'rendering' | 'assembling' | 'done';
  current: number;
  total: number;
}

const DEFAULT_OPTIONS: PdfCompressOptions = {
  mode: 'light',
  quality: 0.72,
  scale: 1.5,
  maxImageDimension: 1600,
};

function stripMetadata(doc: PDFDocument) {
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');
}

async function compressLight(file: File): Promise<PdfCompressResult> {
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  stripMetadata(srcDoc);

  const out = await srcDoc.save({ useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });

  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
    pageCount: srcDoc.getPageCount(),
  };
}

// ---- smart 모드 ----

/** 필터 값이 DCTDecode (JPEG) 인지 확인. 단일 이름/배열 모두 처리. */
function isDctFilter(filter: PDFObject | undefined): boolean {
  if (!filter) return false;
  if (filter instanceof PDFName) return filter.toString() === '/DCTDecode';
  if (filter instanceof PDFArray) {
    // 배열의 마지막 필터만 DCT 면 복합 인코딩 (예: /ASCII85Decode /DCTDecode). 복잡하므로 스킵.
    return filter.size() === 1 && filter.lookup(0, PDFName)?.toString() === '/DCTDecode';
  }
  return false;
}

/** 스트림 딕셔너리에서 숫자 값 읽기. */
function readNumber(dict: PDFDict, key: string): number | null {
  const v = dict.get(PDFName.of(key));
  if (v instanceof PDFNumber) return v.asNumber();
  return null;
}

/** 캔버스에 그려 JPEG 로 재인코딩. */
async function recompressJpeg(
  rawBytes: Uint8Array,
  targetQuality: number,
  maxDimension: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const blob = new Blob([rawBytes as unknown as BlobPart], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('이미지 디코딩 실패'));
      i.src = url;
    });

    let tgtW = img.naturalWidth;
    let tgtH = img.naturalHeight;
    if (tgtW <= 0 || tgtH <= 0) return null;

    if (maxDimension > 0) {
      const longest = Math.max(tgtW, tgtH);
      if (longest > maxDimension) {
        const s = maxDimension / longest;
        tgtW = Math.max(1, Math.round(tgtW * s));
        tgtH = Math.max(1, Math.round(tgtH * s));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = tgtW;
    canvas.height = tgtH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tgtW, tgtH);
    ctx.drawImage(img, 0, 0, tgtW, tgtH);

    const outBlob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', targetQuality);
    });
    if (!outBlob) return null;

    const bytes = new Uint8Array(await outBlob.arrayBuffer());
    return { bytes, width: tgtW, height: tgtH };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressSmart(
  file: File,
  options: PdfCompressOptions,
  onProgress?: (p: PdfCompressProgress) => void,
): Promise<PdfCompressResult> {
  onProgress?.({ stage: 'preparing', current: 0, total: 0 });

  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  stripMetadata(doc);

  const ctx = doc.context;

  onProgress?.({ stage: 'scanning', current: 0, total: 0 });

  const imageRefs: { ref: PDFRef; stream: PDFRawStream }[] = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    const subtype = dict.get(PDFName.of('Subtype'));
    if (!(subtype instanceof PDFName) || subtype.toString() !== '/Image') continue;
    // SMask 가 있는 이미지는 마스크와 크기가 연동되므로 스킵 (렌더 오류 방지)
    if (dict.get(PDFName.of('SMask'))) continue;
    if (dict.get(PDFName.of('Mask'))) continue;
    // 이미 /ImageMask 인 경우 스킵
    const imageMask = dict.get(PDFName.of('ImageMask'));
    if (imageMask && imageMask.toString() === 'true') continue;
    if (!isDctFilter(dict.get(PDFName.of('Filter')))) continue;

    imageRefs.push({ ref, stream: obj });
  }

  let processed = 0;
  let skipped = 0;
  const total = imageRefs.length;

  for (let i = 0; i < imageRefs.length; i++) {
    onProgress?.({ stage: 'recompressing', current: i + 1, total });
    const { ref, stream } = imageRefs[i];
    const origBytes = stream.getContents();
    const origDict = stream.dict;
    const origW = readNumber(origDict, 'Width') ?? 0;
    const origH = readNumber(origDict, 'Height') ?? 0;

    const result = await recompressJpeg(origBytes, options.quality, options.maxImageDimension);
    if (!result) {
      skipped++;
      continue;
    }

    // 원본보다 커지면 교체하지 않음
    if (result.bytes.byteLength >= origBytes.byteLength && result.width === origW && result.height === origH) {
      skipped++;
      continue;
    }

    const newDict = origDict.clone(ctx);
    newDict.set(PDFName.of('Width'), PDFNumber.of(result.width));
    newDict.set(PDFName.of('Height'), PDFNumber.of(result.height));
    newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
    newDict.set(PDFName.of('Length'), PDFNumber.of(result.bytes.byteLength));
    newDict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
    // DecodeParms 는 DCT 에 거의 무의미 — 제거
    newDict.delete(PDFName.of('DecodeParms'));
    // 다운샘플 시 ColorSpace 는 canvas 가 RGB 로 변환하므로 DeviceRGB 로 강제
    newDict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));

    const newStream = PDFRawStream.of(newDict, result.bytes);
    ctx.assign(ref, newStream);
    processed++;
  }

  onProgress?.({ stage: 'assembling', current: total, total });

  const out = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });

  onProgress?.({ stage: 'done', current: total, total });

  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
    pageCount: doc.getPageCount(),
    imagesProcessed: processed,
    imagesSkipped: skipped,
  };
}

// ---- rasterize 모드 ----

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjs;
}

async function renderPageToJpeg(
  page: PDFPageProxy,
  scale: number,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('페이지 래스터화 실패'))),
      'image/jpeg',
      quality,
    );
  });

  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, width: canvas.width, height: canvas.height };
}

async function compressRasterize(
  file: File,
  options: PdfCompressOptions,
  onProgress?: (p: PdfCompressProgress) => void,
): Promise<PdfCompressResult> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ stage: 'preparing', current: 0, total: 0 });

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const outDoc = await PDFDocument.create();
  outDoc.setProducer('');
  outDoc.setCreator('');

  for (let i = 1; i <= pageCount; i++) {
    onProgress?.({ stage: 'rendering', current: i, total: pageCount });
    const page = await pdf.getPage(i);
    const { bytes, width, height } = await renderPageToJpeg(page, options.scale, options.quality);

    const image = await outDoc.embedJpg(bytes);
    const pdfPage = outDoc.addPage([width, height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width, height });

    page.cleanup();
  }

  onProgress?.({ stage: 'assembling', current: pageCount, total: pageCount });
  const out = await outDoc.save({ useObjectStreams: true });
  const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });

  onProgress?.({ stage: 'done', current: pageCount, total: pageCount });

  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
    pageCount,
  };
}

export async function compressPdf(
  file: File,
  options: Partial<PdfCompressOptions> = {},
  onProgress?: (p: PdfCompressProgress) => void,
): Promise<PdfCompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (opts.mode === 'rasterize') return compressRasterize(file, opts, onProgress);
  if (opts.mode === 'smart') return compressSmart(file, opts, onProgress);
  return compressLight(file);
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
