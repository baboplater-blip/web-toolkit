/**
 * Phase 1 PDF 도구 공통 유틸.
 */

import { PDFDocument } from 'pdf-lib';

export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes, { updateMetadata: false });
}

export async function saveAsBlob(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * "1-3, 5, 7-9" 같은 페이지 범위 문자열을 1-based 페이지 번호 배열로 변환.
 * 공백·한글 콤마·다양한 구분자 허용. 범위 밖 값은 무시. 중복 제거.
 */
export function parsePageRanges(spec: string, totalPages: number): number[] {
  const result: number[] = [];
  const seen = new Set<number>();
  const parts = spec.split(/[,，\s]+/).filter(Boolean);
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= totalPages && !seen.has(n)) {
        result.push(n);
        seen.add(n);
      }
      continue;
    }
    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      const start = Math.max(1, Number(match[1]));
      const end = Math.min(totalPages, Number(match[2]));
      if (start > end) continue;
      for (let i = start; i <= end; i++) {
        if (!seen.has(i)) {
          result.push(i);
          seen.add(i);
        }
      }
    }
  }
  return result;
}

/** 모든 페이지 번호 배열 [1..n] */
export function allPages(total: number): number[] {
  return Array.from({ length: total }, (_, i) => i + 1);
}

/** 파일명에서 확장자 제거 */
export function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.substring(0, dot) : name;
}

/** 다운로드 트리거 */
export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
