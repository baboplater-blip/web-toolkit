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

export async function openPdf(file: File, password?: string): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  try {
    // password 가 주어지면 암호화 PDF 의 열람 암호로 전달 (PasswordException 재시도용)
    return await pdfjs.getDocument({ data: new Uint8Array(buf), password }).promise;
  } catch (err) {
    throw normalizePdfjsError(err);
  }
}

/**
 * pdf.js PasswordException 여부 — code 1 = 암호 필요, 2 = 암호 틀림.
 */
export function isPasswordException(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'PasswordException';
}

/**
 * PasswordException 의 message 를 한국어로 바꾸되 name/code 는 보존.
 * 비밀번호 입력 UI 가 name === 'PasswordException' 으로 감지할 수 있게 한다.
 */
export function normalizePdfjsError(err: unknown): unknown {
  if (!isPasswordException(err)) return err;
  const code = (err as { code?: number }).code;
  const msg =
    code === 2
      ? '비밀번호가 올바르지 않습니다. 다시 입력해주세요.'
      : '암호화된(또는 비밀번호가 걸린) PDF입니다. 비밀번호를 입력해주세요.';
  const friendly = new Error(msg) as Error & { name: string; code?: number };
  friendly.name = 'PasswordException';
  if (typeof code === 'number') friendly.code = code;
  return friendly;
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
