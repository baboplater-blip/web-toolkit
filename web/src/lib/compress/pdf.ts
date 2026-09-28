/**
 * PDF 압축 유틸리티.
 *
 * 세 가지 모드 지원:
 * - 'light': 메타데이터 제거 + ObjectStream 압축. 5~15% 감소, 원본 완전 보존.
 * - 'smart': 내부 JPEG(XObject) 을 재인코딩 + 다운샘플. 원본 PDF 구조/벡터/텍스트 완전 보존,
 *            이미지 품질만 조절. 10~80% 감소 (이미지 비중에 따라).
 * - 'rasterize': 각 페이지 전체를 JPEG 로 변환 후 새 PDF 재조립. 40~90% 감소,
 *                텍스트 선택/벡터 상실.
 *
 * @cantoo/pdf-lib 는 함수 호출 시점에 lazy load — 이 모듈을 import 하는 페이지의
 * 초기 JS 번들에 pdf-lib(~600KB) 가 포함되지 않는다.
 */

import type { PDFDocument, PDFRawStream, PDFDict, PDFRef } from '@cantoo/pdf-lib';
import type { PDFPageProxy } from 'pdfjs-dist';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';

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
  const { PDFDocument } = await loadPdfLib();
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

/** 디코딩된 8bit RGB/Gray 원시 픽셀을 캔버스로 JPEG 재인코딩(다운샘플 포함). */
async function recompressPixels(
  pixels: Uint8Array,
  width: number,
  height: number,
  comps: 1 | 3,
  targetQuality: number,
  maxDimension: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  if (width <= 0 || height <= 0 || pixels.length < width * height * comps) return null;
  const src = document.createElement('canvas');
  src.width = width;
  src.height = height;
  const sctx = src.getContext('2d');
  if (!sctx) return null;
  const imageData = sctx.createImageData(width, height);
  const d = imageData.data;
  for (let i = 0, p = 0, n = width * height; i < n; i++, p += 4) {
    if (comps === 3) {
      d[p] = pixels[i * 3];
      d[p + 1] = pixels[i * 3 + 1];
      d[p + 2] = pixels[i * 3 + 2];
    } else {
      d[p] = d[p + 1] = d[p + 2] = pixels[i];
    }
    d[p + 3] = 255;
  }
  sctx.putImageData(imageData, 0, 0);

  let tgtW = width;
  let tgtH = height;
  if (maxDimension > 0) {
    const longest = Math.max(tgtW, tgtH);
    if (longest > maxDimension) {
      const s = maxDimension / longest;
      tgtW = Math.max(1, Math.round(tgtW * s));
      tgtH = Math.max(1, Math.round(tgtH * s));
    }
  }
  let canvas = src;
  if (tgtW !== width || tgtH !== height) {
    canvas = document.createElement('canvas');
    canvas.width = tgtW;
    canvas.height = tgtH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(src, 0, 0, tgtW, tgtH);
  }
  const outBlob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', targetQuality);
  });
  if (!outBlob) return null;
  return { bytes: new Uint8Array(await outBlob.arrayBuffer()), width: tgtW, height: tgtH };
}

async function compressSmart(
  file: File,
  options: PdfCompressOptions,
  onProgress?: (p: PdfCompressProgress) => void,
): Promise<PdfCompressResult> {
  onProgress?.({ stage: 'preparing', current: 0, total: 0 });

  const { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray, decodePDFRawStream } =
    await loadPdfLib();

  // helper closures — pdf-lib 의 값(클래스/static) 을 캡처
  // pdf-lib 가 직접 풀 수 있는 필터(예측자 DecodeParms 가 없을 때만 사용)
  const DECODABLE = new Set([
    '/FlateDecode',
    '/ASCII85Decode',
    '/ASCIIHexDecode',
    '/LZWDecode',
    '/RunLengthDecode',
  ]);
  const filterNames = (filter: unknown): string[] | null => {
    if (!filter) return [];
    if (filter instanceof PDFName) return [filter.toString()];
    if (filter instanceof PDFArray) {
      const names: string[] = [];
      for (let k = 0; k < filter.size(); k++) {
        const n = filter.lookup(k);
        if (!(n instanceof PDFName)) return null;
        names.push(n.toString());
      }
      return names;
    }
    return null;
  };
  const readNumber = (dict: PDFDict, key: string): number | null => {
    const v = dict.get(PDFName.of(key));
    if (v instanceof PDFNumber) return v.asNumber();
    return null;
  };

  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  stripMetadata(doc);

  const ctx = doc.context;

  onProgress?.({ stage: 'scanning', current: 0, total: 0 });

  // kind: 'dct' = JPEG 그대로 / 'dct-chain' = ASCII85 등으로 감싼 JPEG /
  //       'raw' = Flate 등으로 무손실 압축된 8bit RGB·Gray 픽셀 (JPEG 로 재인코딩)
  type Kind = 'dct' | 'dct-chain' | 'raw';
  const collected: { ref: PDFRef; stream: PDFRawStream; kind: Kind; comps: 1 | 3 }[] = [];
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
    const names = filterNames(dict.lookup(PDFName.of('Filter')));
    if (!names || names.length === 0) continue;
    const hasParms = !!dict.lookup(PDFName.of('DecodeParms'));
    const last = names[names.length - 1];
    const prefix = names.slice(0, -1);
    if (last === '/DCTDecode') {
      if (prefix.length === 0) {
        collected.push({ ref, stream: obj, kind: 'dct', comps: 3 });
      } else if (!hasParms && prefix.every((n) => DECODABLE.has(n))) {
        collected.push({ ref, stream: obj, kind: 'dct-chain', comps: 3 });
      }
      continue;
    }
    // 무손실 원시 픽셀: 8bit DeviceRGB/DeviceGray, Decode 배열·예측자 없음
    if (hasParms || dict.get(PDFName.of('Decode'))) continue;
    if (!names.every((n) => DECODABLE.has(n))) continue;
    if (readNumber(dict, 'BitsPerComponent') !== 8) continue;
    const cs = dict.lookup(PDFName.of('ColorSpace'));
    const csName = cs instanceof PDFName ? cs.toString() : '';
    if (csName !== '/DeviceRGB' && csName !== '/DeviceGray') continue;
    collected.push({ ref, stream: obj, kind: 'raw', comps: csName === '/DeviceRGB' ? 3 : 1 });
  }

  let processed = 0;
  let skipped = 0;
  const total = collected.length;

  for (let i = 0; i < collected.length; i++) {
    onProgress?.({ stage: 'recompressing', current: i + 1, total });
    const { ref, stream, kind, comps } = collected[i];
    const origBytes = stream.getContents();
    const origDict = stream.dict;
    const origW = readNumber(origDict, 'Width') ?? 0;
    const origH = readNumber(origDict, 'Height') ?? 0;

    let result: { bytes: Uint8Array; width: number; height: number } | null = null;
    try {
      if (kind === 'dct') {
        result = await recompressJpeg(origBytes, options.quality, options.maxImageDimension);
      } else if (kind === 'dct-chain') {
        // 앞단 필터(ASCII85 등)만 풀어 JPEG 바이트를 얻는다
        const tmpDict = origDict.clone(ctx);
        const arr = tmpDict.lookup(PDFName.of('Filter'), PDFArray);
        const inner = PDFArray.withContext(ctx);
        for (let k = 0; k < arr.size() - 1; k++) inner.push(arr.get(k));
        tmpDict.set(PDFName.of('Filter'), inner);
        const jpeg = decodePDFRawStream(PDFRawStream.of(tmpDict, origBytes)).decode();
        result = await recompressJpeg(jpeg, options.quality, options.maxImageDimension);
      } else {
        const pixels = decodePDFRawStream(stream).decode();
        result = await recompressPixels(pixels, origW, origH, comps, options.quality, options.maxImageDimension);
      }
    } catch (err) {
      console.warn('[compress-pdf] image decode failed', err);
      result = null;
    }
    if (!result) {
      skipped++;
      continue;
    }

    // 원본(인코딩된 스트림)보다 커지면 교체하지 않음
    if (result.bytes.byteLength >= origBytes.byteLength) {
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
  const { PDFDocument } = await loadPdfLib();
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
    const { bytes } = await renderPageToJpeg(page, options.scale, options.quality);
    // 페이지 크기는 원본 pt 단위(배율 1) 유지 — 렌더 배율은 해상도에만 반영
    const base = page.getViewport({ scale: 1 });

    const image = await outDoc.embedJpg(bytes);
    const pdfPage = outDoc.addPage([base.width, base.height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });

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
  try {
    if (opts.mode === 'rasterize') return await compressRasterize(file, opts, onProgress);
    if (opts.mode === 'smart') return await compressSmart(file, opts, onProgress);
    return await compressLight(file);
  } catch (err) {
    // 암호화 PDF: pdf-lib(EncryptedPDFError)·pdf.js(PasswordException) 의 영문 에러를 한국어로 정규화
    const name = (err as { name?: string } | null)?.name;
    const msg = err instanceof Error ? err.message : '';
    if (name === 'EncryptedPDFError' || name === 'PasswordException' || /is encrypted|password/i.test(msg)) {
      throw new Error(
        '암호화된(비밀번호가 걸린) PDF 는 압축할 수 없습니다. "PDF 잠금 해제" 도구로 먼저 해제하세요.',
      );
    }
    throw err;
  }
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
