/**
 * 제휴(어필리에이트) 지점 — 수익화 훅 (Phase δ, 보수적).
 *
 * 이 프로젝트의 도구 작업영역은 영구히 광고/제휴 없이 청정하게 유지한다.
 * 제휴 링크는 **가이드(how-to) 페이지에만** 노출하며, 아래 항목이 모두
 * `active: false` 이거나 비어 있으면 아무것도 렌더되지 않는다(기본 OFF).
 * 노출 시에도 항상 '추천/스폰서' 라벨 + rel="sponsored nofollow" 로 표기해
 * 신뢰를 지킨다. 도구 작업영역(드롭존·결과)에는 절대 쓰지 않는다.
 *
 * ── 문맥 추천 구조 ──
 * 키는 **도구 id**(`'pdf-merge'`) 또는 **카테고리**(`'pdf'`). 가이드를 열면
 * `affiliatesFor(toolId, category)` 가 도구 우선 → 카테고리 순으로 관련성 높은
 * 항목만 골라준다. 즉 PDF 가이드엔 PDF 관련 제안, 이미지 가이드엔 이미지/디자인
 * 관련 제안만 나오고, 무관한 광고는 섞이지 않는다.
 *
 * ── 켜는 방법 (실제 제휴 계약 후) ──
 * 1) 아래 PLACEHOLDERS 의 해당 항목에서 `href` 를 실제 제휴 링크로 교체.
 * 2) 같은 항목의 `active: true` 로 변경.
 *    → 그 즉시 해당 카테고리/도구 가이드 하단에 '추천' 카드로 노출된다.
 * 아무것도 켜지 않으면 사이트는 지금처럼 제휴 노출 0 으로 동작한다.
 *
 * ⚠️ 실재하지 않는 제휴를 가짜 링크로 켜서 사용자를 오도하지 말 것.
 *    href 가 비었거나 active=false 면 자동으로 렌더에서 제외된다.
 */

export type AffiliateLocale = 'ko' | 'en' | 'ja' | 'zh';

/** 다국어 텍스트. ko 는 필수, 나머지는 없으면 ko(→en) 로 폴백. */
export interface LocalizedText {
  ko: string;
  en?: string;
  ja?: string;
  zh?: string;
}

export interface AffiliateOffer {
  /**
   * 이 제안을 실제로 노출할지. 기본 false → 렌더 0.
   * 실제 제휴 계약 후 href 를 채우고 true 로 바꾼다.
   */
  active: boolean;
  /** 표시 라벨 (다국어). */
  label: LocalizedText;
  /** 한 줄 설명 (다국어). */
  blurb: LocalizedText;
  /** 외부 링크 (https). 비어 있으면 active 여도 노출 안 함(실수 방지). */
  href: string;
}

/**
 * 카테고리(`'pdf'`) 또는 도구 id(`'pdf-merge'`) 를 키로 한 문맥 제안 맵.
 *
 * 아래 항목은 전부 `active: false` + `href: ''` 인 **자리표시자**다.
 * 실제 제휴가 정해지면 href 를 채우고 active 를 켜라(주석의 "켜는 방법" 참고).
 * 자리표시자는 "어떤 도구 가이드에 어떤 성격의 제휴가 어울리는지"를
 * 코드로 문서화하는 역할도 한다 — 무관한 광고가 붙지 않도록.
 */
export const AFFILIATES: Record<string, AffiliateOffer[]> = {
  // ── 카테고리 단위 (해당 카테고리 모든 도구 가이드에 폴백 노출) ──
  pdf: [
    {
      active: false,
      href: '',
      label: {
        ko: '데스크톱 PDF 편집 소프트웨어',
        en: 'Desktop PDF editor',
        ja: 'デスクトップ PDF 編集ソフト',
        zh: '桌面 PDF 编辑软件',
      },
      blurb: {
        ko: '대용량·일괄 처리, OCR, 전자서명이 필요하면 전문 데스크톱 앱.',
        en: 'For large batches, OCR and e-signing, a pro desktop app.',
        ja: '大容量・一括処理、OCR、電子署名にはプロ向けデスクトップアプリ。',
        zh: '需要大批量、OCR、电子签名时可选专业桌面应用。',
      },
    },
  ],
  image: [
    {
      active: false,
      href: '',
      label: {
        ko: '스톡 이미지 · 디자인 도구',
        en: 'Stock photos & design tools',
        ja: 'ストック画像・デザインツール',
        zh: '图库与设计工具',
      },
      blurb: {
        ko: '상업용 고해상도 이미지나 본격 디자인이 필요할 때.',
        en: 'When you need licensed high-res images or full design tools.',
        ja: '商用の高解像度画像や本格的なデザインが必要なときに。',
        zh: '需要可商用高清图片或专业设计工具时。',
      },
    },
  ],
  video: [
    {
      active: false,
      href: '',
      label: {
        ko: '영상 편집 소프트웨어',
        en: 'Video editing software',
        ja: '動画編集ソフト',
        zh: '视频编辑软件',
      },
      blurb: {
        ko: '타임라인 편집·고급 인코딩이 필요하면 데스크톱 편집기.',
        en: 'A desktop editor for timeline editing and advanced encoding.',
        ja: 'タイムライン編集・高度なエンコードにはデスクトップ編集ソフト。',
        zh: '需要时间线剪辑与高级编码时可选桌面编辑器。',
      },
    },
  ],
  audio: [
    {
      active: false,
      href: '',
      label: {
        ko: '오디오 편집 · DAW',
        en: 'Audio editor / DAW',
        ja: 'オーディオ編集・DAW',
        zh: '音频编辑 / DAW',
      },
      blurb: {
        ko: '멀티트랙 믹싱·마스터링이 필요하면 전문 오디오 편집기.',
        en: 'A pro audio editor for multitrack mixing and mastering.',
        ja: 'マルチトラック・ミキシングやマスタリングにはプロ向け編集ソフト。',
        zh: '需要多轨混音与母带处理时可选专业音频编辑器。',
      },
    },
  ],
  docs: [
    {
      active: false,
      href: '',
      label: {
        ko: '오피스 · 문서 협업 도구',
        en: 'Office & document tools',
        ja: 'オフィス・文書ツール',
        zh: '办公与文档工具',
      },
      blurb: {
        ko: '팀 협업·고급 서식이 필요한 문서 작업에.',
        en: 'For team collaboration and advanced document formatting.',
        ja: 'チーム協業や高度な書式設定が必要な文書作業に。',
        zh: '需要团队协作与高级排版的文档工作。',
      },
    },
  ],

  // ── 도구 단위 (카테고리보다 우선. 더 구체적인 제안을 걸 수 있음) ──
  // 예) 'pdf-merge': [{ active: true, href: 'https://...', label: {...}, blurb: {...} }],
};

/**
 * 해당 도구/카테고리에 연결된 **노출 가능** 제휴 항목(도구 우선, 최대 3개).
 * active=true 이고 href 가 비어있지 않은 항목만 반환한다(자리표시자 자동 제외).
 */
export function affiliatesFor(toolId: string, category: string): AffiliateOffer[] {
  return [...(AFFILIATES[toolId] ?? []), ...(AFFILIATES[category] ?? [])]
    .filter((o) => o.active && o.href.trim().length > 0)
    .slice(0, 3);
}

/** 다국어 텍스트에서 로케일 값을 고른다(없으면 en → ko 폴백). */
export function pickAffiliateText(t: LocalizedText, locale: AffiliateLocale): string {
  return t[locale] ?? t.en ?? t.ko;
}

/** 노출 가능한 제휴 설정이 하나라도 있는지(전역 가드용). */
export function hasAffiliates(): boolean {
  return Object.values(AFFILIATES).some((list) =>
    list.some((o) => o.active && o.href.trim().length > 0),
  );
}
