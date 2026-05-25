/**
 * `@imgly/background-removal` 의 lazy loader.
 *
 * 같은 페이지에서 두 번 `await import(...)` 하면 webpack 이 각 호출 위치를
 * 별도 chunk 로 분리해 동일 라이브러리(+ onnxruntime-web 의존 ~390KB) 가
 * 두 chunk 에 복제된다. 헬퍼 한 곳에서 import 하고 inflight promise 를
 * 캐시하면 dynamic import 호출 위치가 한 곳이 되어 chunk 하나로 묶인다.
 */

let cached: typeof import('@imgly/background-removal') | null = null;
let inflight: Promise<typeof import('@imgly/background-removal')> | null = null;

export async function loadBgRemoval(): Promise<typeof import('@imgly/background-removal')> {
  if (cached) return cached;
  if (!inflight) {
    inflight = import('@imgly/background-removal').then((m) => {
      cached = m;
      return m;
    });
  }
  return inflight;
}
