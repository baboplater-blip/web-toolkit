/**
 * PDF 전용 공통 유틸 — `@cantoo/pdf-lib` 를 *함수 호출 시점*에 lazy load.
 *
 * `import { loadPdfFromFile } from '@/lib/tools/pdf-common'` 만으로는 더 이상
 * pdf-lib 가 페이지 초기 번들에 따라오지 않는다. 실제 호출이 일어나는 순간
 * `loadPdfLib()` 가 동적 import 로 모듈을 가져온다.
 *
 * 파일/다운로드 일반 유틸은 `./file-utils` 에 있다.
 */

import type { PDFDocument } from './pdf-lazy';
import { loadPdfLib } from './pdf-lazy';

export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const { PDFDocument } = await loadPdfLib();
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
