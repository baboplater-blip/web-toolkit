/**
 * PDF 전용 공통 유틸. pdf-lib (정확히는 @cantoo/pdf-lib — pdf-lib + SVG 지원 fork)
 * 의존이 있으므로 PDF 도구 페이지에서만 import 한다.
 *
 * 파일/다운로드 일반 유틸은 `./file-utils` 에 있다.
 */

import { PDFDocument } from '@cantoo/pdf-lib';

export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes, { updateMetadata: false });
}

export async function saveAsBlob(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
}

// 호환성 re-export — 옛 코드가 pdf-common 에서 가져오던 유틸들을 점진 마이그레이션 중.
// 새 코드는 `@/lib/tools/file-utils` 에서 직접 import 할 것.
export {
  isPdfFile,
  isImageFile,
  parsePageRanges,
  allPages,
  stripExtension,
  triggerDownload,
} from './file-utils';
