/** 의존성 없는 경량 SVG 최적화 (브라우저 전용). */

export interface OptimizeOptions {
  /** 소수점 반올림 자리수 */
  precision: number;
  /** 주석 제거 */
  removeComments: boolean;
  /** 편집기 메타데이터(<metadata>, sodipodi/inkscape 등) 제거 */
  removeMetadata: boolean;
  /** 태그 사이·과도한 공백 정리 */
  collapseWhitespace: boolean;
}

export const DEFAULT_OPTIONS: OptimizeOptions = {
  precision: 2,
  removeComments: true,
  removeMetadata: true,
  collapseWhitespace: true,
};

/** XML 주석(<!-- ... -->)을 제거한다. */
function stripComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * 편집기 메타데이터 요소·속성을 제거한다.
 * <metadata>, <sodipodi:*>, <inkscape:*> 요소와 관련 네임스페이스 속성을 정리.
 */
function stripMetadata(svg: string): string {
  let result = svg;
  // <metadata>...</metadata> 및 자기닫힘.
  result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  result = result.replace(/<metadata[^>]*\/>/gi, '');
  // 편집기 전용 요소(접두사 네임스페이스).
  // 여는 태그의 속성부는 `[^>]*>` 로 `>` 까지 한 번에 소비해 백트래킹 표면을 줄인다
  // (기존 `[\s\S]*?` 는 백레퍼런스와 결합 시 ReDoS 위험). 내부 콘텐츠만 게으른 매칭.
  result = result.replace(/<(sodipodi|inkscape):[a-zA-Z-]+[^>]*>[\s\S]*?<\/\1:[a-zA-Z-]+>/gi, '');
  result = result.replace(/<(sodipodi|inkscape):[a-zA-Z-]+[^>]*\/>/gi, '');
  // 편집기 전용 속성 및 그 네임스페이스 선언.
  result = result.replace(/\s(?:sodipodi|inkscape):[a-zA-Z-]+="[^"]*"/gi, '');
  result = result.replace(/\sxmlns:(?:sodipodi|inkscape|dc|cc|rdf)="[^"]*"/gi, '');
  return result;
}

/**
 * 태그 외부 텍스트(인덴트·줄바꿈)의 과도한 공백을 정리한다.
 * 태그 사이의 순수 공백은 제거하고, 속성 내부 값은 보존한다.
 */
function collapseWhitespace(svg: string): string {
  // 태그와 태그 사이의 공백만으로 이뤄진 구간 제거.
  let result = svg.replace(/>\s+</g, '><');
  // 연속 공백을 단일 공백으로(태그 바깥 텍스트 보호 위해 태그 단위로는 위에서 처리됨).
  result = result.replace(/\s{2,}/g, ' ');
  return result.trim();
}

/**
 * 속성 값과 path 데이터 안의 부동소수를 지정 자리수로 반올림한다.
 * 불필요한 후행 0과 소수점을 제거해 더 짧게 만든다.
 */
function roundNumbers(svg: string, precision: number): string {
  const safePrecision = Math.max(0, Math.min(8, Math.floor(precision)));
  // 정수가 아닌 소수만 대상으로 한다(지수 표기 포함하지 않는 단순 십진수).
  return svg.replace(/-?\d*\.\d+/g, (match) => {
    const value = Number(match);
    if (!Number.isFinite(value)) return match;
    const rounded = Number(value.toFixed(safePrecision));
    return String(rounded);
  });
}

/** UTF-8 바이트 길이를 계산한다. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** 옵션에 따라 SVG 를 최적화한다. */
export function optimizeSvg(svg: string, options: OptimizeOptions): string {
  let result = svg;
  if (options.removeComments) result = stripComments(result);
  if (options.removeMetadata) result = stripMetadata(result);
  result = roundNumbers(result, options.precision);
  if (options.collapseWhitespace) result = collapseWhitespace(result);
  return result;
}

/** 입력이 SVG 로 보이는지 간단 검사한다. */
export function looksLikeSvg(text: string): boolean {
  return /<svg[\s>]/i.test(text);
}
