/**
 * 슈퍼카테고리 — 11개의 세부 카테고리를 5개의 상위 묶음으로 그룹핑.
 *
 * 도구가 250개를 넘어서며 11개 카테고리 수평 스크롤이 길어졌다. 홈·허브·모바일
 * 드로어가 공유하는 단일 출처(SSOT)로 상위 묶음을 정의한다. 세부 카테고리 자체는
 * 그대로 두고(URL·필터·검색 호환), 그 위에 "보기 좋은 묶음" 레이어만 얹는다.
 */

import {
  Film,
  FileText,
  Code2,
  Wrench,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ToolCategory } from './registry';

export type SuperCategory = 'media' | 'document' | 'develop' | 'utility' | 'secure';

export interface SuperCategoryMeta {
  key: SuperCategory;
  label: string;
  /** 한 줄 설명 (드로어·홈 헤더용) */
  blurb: string;
  icon: LucideIcon;
  /** 이 묶음에 속한 세부 카테고리 (표시 순서대로) */
  categories: ToolCategory[];
  /** Tailwind 강조 색 (그라데이션 + 텍스트 + 보더) */
  accent: string;
}

/** 표시 순서대로의 슈퍼카테고리 정의. */
export const SUPER_CATEGORIES: SuperCategoryMeta[] = [
  {
    key: 'document',
    label: '문서·PDF',
    blurb: 'PDF 편집·변환과 문서 데이터 처리',
    icon: FileText,
    categories: ['pdf', 'docs'],
    accent: 'from-emerald-500/15 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
  },
  {
    key: 'media',
    label: '미디어',
    blurb: '이미지·비디오·GIF·오디오 편집과 변환',
    icon: Film,
    categories: ['image', 'video', 'gif', 'audio'],
    accent: 'from-violet-500/15 to-violet-500/5 text-violet-400 border-violet-500/30',
  },
  {
    key: 'develop',
    label: '개발·텍스트',
    blurb: '개발자 도구와 텍스트 가공',
    icon: Code2,
    categories: ['dev', 'text'],
    accent: 'from-teal-500/15 to-teal-500/5 text-teal-400 border-teal-500/30',
  },
  {
    key: 'utility',
    label: '유틸리티',
    blurb: '계산·생성·생활 편의 도구',
    icon: Wrench,
    categories: ['util'],
    accent: 'from-slate-500/15 to-slate-500/5 text-slate-300 border-slate-500/30',
  },
  {
    key: 'secure',
    label: '보안·AI',
    blurb: '암호화·개인정보 보호와 AI 도구',
    icon: ShieldCheck,
    categories: ['security', 'ai'],
    accent: 'from-rose-500/15 to-rose-500/5 text-rose-400 border-rose-500/30',
  },
];

/** 세부 카테고리 → 슈퍼카테고리 역인덱스. */
const CATEGORY_TO_SUPER = new Map<ToolCategory, SuperCategory>();
for (const sc of SUPER_CATEGORIES) {
  for (const cat of sc.categories) CATEGORY_TO_SUPER.set(cat, sc.key);
}

/** 세부 카테고리가 속한 슈퍼카테고리 키. 미정의 시 'utility' 로 폴백. */
export function superCategoryOf(cat: ToolCategory): SuperCategory {
  return CATEGORY_TO_SUPER.get(cat) ?? 'utility';
}

/** 슈퍼카테고리 메타 조회. */
export function getSuperCategory(key: SuperCategory): SuperCategoryMeta | undefined {
  return SUPER_CATEGORIES.find((s) => s.key === key);
}

export const SUPER_CATEGORY_KEYS: SuperCategory[] = SUPER_CATEGORIES.map((s) => s.key);
