/** cubic-bezier 이징 함수 평가 유틸 (외부 의존성 없음). */

/** 4개 제어값을 가진 cubic-bezier 정의. (P0=0,0 / P3=1,1 고정) */
export interface BezierControls {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 단일 1차원 좌표축에 대한 3차 베지어 값 B(t). P0=0, P3=1 고정. */
function sampleAxis(t: number, p1: number, p2: number): number {
  const mt = 1 - t;
  // P0=0, P3=1 이므로 첫·마지막 항은 t^3 만 남는다.
  return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t;
}

/** x(t) 의 t 에 대한 도함수. 뉴턴법에 사용. */
function sampleAxisDerivative(t: number, p1: number, p2: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * p1 + 6 * mt * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

/**
 * 주어진 x(0~1)에 대응하는 매개변수 t 를 역산한다.
 * 뉴턴-랩슨으로 빠르게 수렴하고, 실패 시 이분법으로 안정화한다.
 */
function solveTForX(x: number, x1: number, x2: number): number {
  let t = x;
  for (let i = 0; i < 8; i += 1) {
    const xAtT = sampleAxis(t, x1, x2) - x;
    const dx = sampleAxisDerivative(t, x1, x2);
    if (Math.abs(xAtT) < 1e-6) return t;
    if (Math.abs(dx) < 1e-6) break;
    t -= xAtT / dx;
  }

  // 뉴턴법 실패 시 이분법 보강.
  // 부동소수 특성상 low < high 가 영원히 참일 수 있어(수렴 정체) 반복 횟수를 60회로 제한한다.
  let low = 0;
  let high = 1;
  t = x;
  for (let i = 0; i < 60 && low < high; i += 1) {
    const xAtT = sampleAxis(t, x1, x2);
    if (Math.abs(xAtT - x) < 1e-6) return t;
    if (xAtT < x) low = t;
    else high = t;
    t = (low + high) / 2;
  }
  return t;
}

/**
 * cubic-bezier 이징을 평가한다. 입력 progress(0~1=x)에 대한 출력 값(0~1=y).
 * CSS transition-timing-function 과 동일한 의미.
 */
export function evaluateEasing(controls: BezierControls, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped === 0) return 0;
  if (clamped === 1) return 1;
  const t = solveTForX(clamped, controls.x1, controls.x2);
  return sampleAxis(t, controls.y1, controls.y2);
}

/** cubic-bezier(...) CSS 문자열로 직렬화한다(소수 3자리). */
export function toCssBezier(controls: BezierControls): string {
  const round = (value: number) => Number(value.toFixed(3));
  return `cubic-bezier(${round(controls.x1)}, ${round(controls.y1)}, ${round(controls.x2)}, ${round(controls.y2)})`;
}

/** CSS 표준 이징 프리셋. */
export const BEZIER_PRESETS: ReadonlyArray<{ name: string; controls: BezierControls }> = [
  { name: 'ease', controls: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
  { name: 'linear', controls: { x1: 0, y1: 0, x2: 1, y2: 1 } },
  { name: 'ease-in', controls: { x1: 0.42, y1: 0, x2: 1, y2: 1 } },
  { name: 'ease-out', controls: { x1: 0, y1: 0, x2: 0.58, y2: 1 } },
  { name: 'ease-in-out', controls: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
];
