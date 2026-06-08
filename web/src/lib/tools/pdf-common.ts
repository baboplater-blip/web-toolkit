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

/** 암호화된(비밀번호가 걸린) PDF 일 때 던지는 공통 에러. 호출부에서 한국어 안내로 분기. */
export const ENCRYPTED_PDF_MESSAGE =
  '암호화된(또는 비밀번호가 걸린) PDF입니다. 이 도구는 암호화된 PDF를 처리할 수 없습니다.';

/**
 * pdf-lib 의 EncryptedPDFError 여부.
 * 번들링으로 클래스 참조가 깨질 수 있어 name 기준으로 판별한다.
 */
export function isEncryptedPdfError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    (err as { name?: string }).name === 'EncryptedPDFError'
  );
}

export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const { PDFDocument } = await loadPdfLib();
  const bytes = await file.arrayBuffer();
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    // 암호화 PDF 는 명확한 한국어 메시지로 정규화해 호출부가 raw 영문 에러 대신 안내하도록.
    if (isEncryptedPdfError(err)) {
      throw new Error(ENCRYPTED_PDF_MESSAGE);
    }
    throw err;
  }
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
