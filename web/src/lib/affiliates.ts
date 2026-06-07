/**
 * 제휴(어필리에이트) 지점 — 수익화 훅 (Phase δ, 보수적).
 *
 * 이 프로젝트의 도구 작업영역은 영구히 광고/제휴 없이 청정하게 유지한다.
 * 제휴 링크는 **가이드(how-to) 페이지에만** 노출하며, 아래 설정이 비어 있으면
 * 아무것도 렌더되지 않는다(기본 OFF). 실제 제휴가 정해지면 카테고리 또는 도구 id 를
 * 키로 항목을 채우면 해당 가이드 하단에 '스폰서' 라벨 + rel="sponsored nofollow" 로
 * 노출된다. 신뢰를 지키기 위해 항상 명시적으로 스폰서 표기한다.
 *
 * 예시(주석 해제 후 실제 파트너로 교체):
 *   export const AFFILIATES: Record<string, AffiliateOffer[]> = {
 *     pdf: [{ label: '대용량 PDF는 데스크톱 앱', href: 'https://...', blurb: '500MB+ 일괄 처리' }],
 *   };
 */

export interface AffiliateOffer {
  /** 표시 라벨 */
  label: string;
  /** 외부 링크 (https) */
  href: string;
  /** 한 줄 설명 */
  blurb: string;
}

/** 카테고리(`'pdf'`) 또는 도구 id(`'pdf-merge'`) 를 키로. 기본은 비어 있음(노출 0). */
export const AFFILIATES: Record<string, AffiliateOffer[]> = {};

/** 해당 도구/카테고리에 연결된 제휴 항목(도구 우선, 최대 3개). */
export function affiliatesFor(toolId: string, category: string): AffiliateOffer[] {
  return [...(AFFILIATES[toolId] ?? []), ...(AFFILIATES[category] ?? [])].slice(0, 3);
}

/** 제휴 설정이 하나라도 있는지(렌더 가드용). */
export function hasAffiliates(): boolean {
  return Object.keys(AFFILIATES).length > 0;
}
