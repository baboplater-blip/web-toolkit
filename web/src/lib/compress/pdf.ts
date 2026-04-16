/**
 * PDF 압축 유틸리티.
 *
 * 두 가지 모드 지원:
 * - 'light': pdf-lib 로 메타데이터 제거 + ObjectStream 압축. 원본 구조 유지 (벡터/텍스트 보존).
 * - 'rasterize': pdfjs-dist 로 각 페이지를 렌더링 후 JPEG 로 재인코딩하여 pdf-lib 로 재조립.
 *                이미지가 많은 스캔 PDF 에서 큰 용량 감소.
 */

import { PDFDocument } from 'pdf-lib';
import type { PDFPageProxy } from 'pdfjs-dist';

export type PdfCompressMode = 'light' | 'rasterize';

export interface PdfCompressOptions {
  mode: PdfCompressMode;
  /** rasterize 모드 전용: 0~1 JPEG 품질. 기본 0.72 */
  quality: number;
  /** rasterize 모드 전용: 렌더링 scale (1 = 원본). 기본 1.5 */
  scale: number;
}

export interface PdfCompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
}

export interface PdfCompressProgress {
  stage: 'preparing' | 'rendering' | 'assembling' | 'done';
  current: number;
  total: number;
}

const DEFAULT_OPTIONS: PdfCompressOptions = {
  mode: 'light',
  quality: 0.72,
  scale: 1.5,
};

async function compressLight(file: File): Promise<PdfCompressResult> {
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { updateMetadata: false });

  srcDoc.setTitle('');
  srcDoc.setAuthor('');
  srcDoc.setSubject('');
  srcDoc.setKeywords([]);
  srcDoc.setProducer('');
  srcDoc.setCreator('');

  const out = await srcDoc.save({ useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });

  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
    pageCount: srcDoc.getPageCount(),
  };
}

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
  return compressLight(file);
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
