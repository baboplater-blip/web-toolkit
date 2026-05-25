/**
 * `@cantoo/pdf-lib` 의 lazy loader.
 *
 * 도구 페이지의 *초기* JS 번들에서 pdf-lib(~600KB minified)를 떼어내고
 * PDF 처리 시작 시점에만 로드한다. 한 번 로드되면 모듈 캐시에 머무므로
 * 두 번째 호출부터는 즉시 반환된다.
 *
 * 사용 패턴:
 * ```ts
 * import { loadPdfLib, type PDFDocument } from '@/lib/tools/pdf-lazy';
 *
 * async function handle(file: File) {
 *   const { PDFDocument, degrees, rgb } = await loadPdfLib();
 *   const doc = await PDFDocument.create();
 *   // ...
 * }
 * ```
 *
 * 타입(예: `PDFDocument`)은 그대로 re-export 하므로 변수 타입 어노테이션에는
 * 컴파일 타임 import 만 발생한다(런타임 영향 없음).
 */

export type {
  PDFDocument,
  PDFPage,
  PDFFont,
  PDFImage,
  PDFEmbeddedPage,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFTextField,
  PDFForm,
} from '@cantoo/pdf-lib';

let cached: typeof import('@cantoo/pdf-lib') | null = null;
let inflight: Promise<typeof import('@cantoo/pdf-lib')> | null = null;

/** @cantoo/pdf-lib 전체 모듈을 lazy load. 동시 호출은 1번만 import. */
export async function loadPdfLib(): Promise<typeof import('@cantoo/pdf-lib')> {
  if (cached) return cached;
  if (!inflight) {
    inflight = import('@cantoo/pdf-lib').then((m) => {
      cached = m;
      return m;
    });
  }
  return inflight;
}
