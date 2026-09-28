/**
 * jsPDF `.html()` 은 전역 `html2canvas` 가 있으면 그것을 쓰고, 없으면 `html2canvas`(1.x) 를
 * 동적 import 한다. html2canvas 1.x 는 `lab()`·`oklch()` 색 함수를 파싱하지 못해
 * Tailwind v4 페이지에서 "Attempting to parse an unsupported color function" 으로 실패한다.
 * 호출 전에 이 함수를 await 하면 최신 색 함수를 지원하는 html2canvas-pro 가 전역에 주입된다.
 */
export async function installModernHtml2Canvas(): Promise<void> {
  const g = globalThis as { html2canvas?: unknown };
  if (g.html2canvas) return;
  const mod = await import('html2canvas-pro');
  g.html2canvas = mod.default;
}
