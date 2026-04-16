/**
 * PDF 페이지 썸네일 렌더링 유틸 (pdfjs-dist 기반).
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface Thumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  /** 원본 1배율 크기 (pt 단위) */
  originalWidth: number;
  originalHeight: number;
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjs;
}

export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  return pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
}

/**
 * 단일 페이지를 지정 최대 크기로 렌더링하여 dataURL 반환.
 * @param maxDim 긴 변 최대 픽셀 (기본 200)
 */
export async function renderThumbnail(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  maxDim: number = 200,
  format: 'jpeg' | 'png' = 'jpeg',
  quality = 0.7,
): Promise<Thumbnail> {
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxDim / Math.max(baseViewport.width, baseViewport.height);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const mime = `image/${format}`;
  const dataUrl =
    format === 'jpeg' ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);

  page.cleanup();

  return {
    pageNumber,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    originalWidth: baseViewport.width,
    originalHeight: baseViewport.height,
  };
}

/**
 * 전체 페이지 순차 렌더링. 진행률 콜백 지원.
 */
export async function renderAllThumbnails(
  file: File,
  onProgress?: (current: number, total: number) => void,
  maxDim = 180,
): Promise<Thumbnail[]> {
  const pdf = await openPdf(file);
  const results: Thumbnail[] = [];
  const total = pdf.numPages;
  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    results.push(await renderThumbnail(pdf, i, maxDim));
  }
  pdf.destroy();
  return results;
}
