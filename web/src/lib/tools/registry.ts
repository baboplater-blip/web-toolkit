/**
 * 도구 레지스트리. 허브 페이지가 이 목록으로 카드 그리드를 렌더.
 *
 * 새 도구 추가 시:
 *   1) 페이지 경로 (href) 에 맞게 app/tools/{slug}/page.tsx 생성
 *   2) 이 파일에 ToolMeta 를 push 하고 status: 'ready' 지정
 */

import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Clapperboard,
  Crop,
  Eraser,
  FastForward,
  FileImage,
  FileLock,
  FileMinus,
  FilePlus,
  FileSearch,
  FileText,
  FileVideo,
  Film,
  Images,
  Layers,
  Maximize2,
  Merge,
  PenTool,
  RotateCw,
  ScanText,
  Scissors,
  ShieldOff,
  Shuffle,
  SplitSquareHorizontal,
  Stamp,
  Type,
  Wand2,
} from 'lucide-react';

export type ToolCategory = 'image' | 'pdf' | 'security' | 'ai' | 'video' | 'gif';
export type ToolStatus = 'ready' | 'planned';

export interface ToolMeta {
  id: string;
  title: string;
  description: string;
  href: string;
  category: ToolCategory;
  icon: LucideIcon;
  status: ToolStatus;
  /** 구현 Phase 로 정렬. 1 = 우선순위 최상위. */
  phase: 1 | 2 | 3 | 4 | 5;
  /** 검색에서 매칭될 추가 키워드 (한/영) */
  keywords?: string[];
}

export const CATEGORY_LABELS: Record<ToolCategory | 'all', string> = {
  all: '전체',
  image: '이미지',
  pdf: 'PDF',
  video: '비디오',
  gif: 'GIF',
  security: '보안',
  ai: 'AI',
};

export const TOOLS: ToolMeta[] = [
  // ---- Ready ----
  {
    id: 'compress',
    title: '파일 용량 줄이기',
    description: '이미지와 PDF 를 브라우저에서 압축합니다.',
    href: '/tools/compress',
    category: 'pdf',
    icon: Wand2,
    status: 'ready',
    phase: 1,
    keywords: ['압축', '용량', 'compress', 'shrink', 'reduce'],
  },

  // ---- Phase 1: 고빈도 PDF ----
  {
    id: 'pdf-merge',
    title: 'PDF 합치기',
    description: '여러 PDF 파일을 하나로 병합합니다.',
    href: '/tools/pdf/merge',
    category: 'pdf',
    icon: Merge,
    status: 'ready',
    phase: 1,
    keywords: ['merge', 'combine', '병합'],
  },
  {
    id: 'pdf-split',
    title: 'PDF 분할',
    description: '페이지 범위로 PDF 를 나눕니다.',
    href: '/tools/pdf/split',
    category: 'pdf',
    icon: SplitSquareHorizontal,
    status: 'ready',
    phase: 1,
    keywords: ['split', 'divide', '분할', '나누기'],
  },
  {
    id: 'pdf-rotate',
    title: 'PDF 회전',
    description: '선택한 페이지를 90/180/270도 회전합니다.',
    href: '/tools/pdf/rotate',
    category: 'pdf',
    icon: RotateCw,
    status: 'ready',
    phase: 1,
    keywords: ['rotate', '회전'],
  },
  {
    id: 'pdf-organize',
    title: 'PDF 페이지 정리',
    description: '페이지 재정렬·삭제·복제를 썸네일로 처리합니다.',
    href: '/tools/pdf/organize',
    category: 'pdf',
    icon: Shuffle,
    status: 'ready',
    phase: 1,
    keywords: ['organize', 'reorder', 'delete', '정리', '순서'],
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF → JPG',
    description: '각 페이지를 JPG 이미지로 추출합니다.',
    href: '/tools/pdf/to-jpg',
    category: 'pdf',
    icon: FileImage,
    status: 'ready',
    phase: 1,
    keywords: ['extract', 'image', '이미지 추출', '변환'],
  },
  {
    id: 'pdf-from-jpg',
    title: 'JPG → PDF',
    description: '여러 이미지를 하나의 PDF 로 묶습니다.',
    href: '/tools/pdf/from-jpg',
    category: 'pdf',
    icon: FileText,
    status: 'ready',
    phase: 1,
    keywords: ['convert', '변환', 'combine'],
  },
  {
    id: 'pdf-page-numbers',
    title: 'PDF 페이지 번호',
    description: '페이지 번호를 일괄 삽입합니다.',
    href: '/tools/pdf/page-numbers',
    category: 'pdf',
    icon: Layers,
    status: 'ready',
    phase: 1,
    keywords: ['number', 'paginate', '페이지번호'],
  },
  {
    id: 'pdf-watermark',
    title: 'PDF 워터마크',
    description: '텍스트/이미지 워터마크를 추가합니다.',
    href: '/tools/pdf/watermark',
    category: 'pdf',
    icon: Stamp,
    status: 'ready',
    phase: 1,
    keywords: ['watermark', '워터마크'],
  },
  {
    id: 'pdf-crop',
    title: 'PDF 여백 자르기',
    description: '페이지 박스를 잘라 여백을 제거합니다.',
    href: '/tools/pdf/crop',
    category: 'pdf',
    icon: Crop,
    status: 'ready',
    phase: 1,
    keywords: ['crop', 'trim', '여백'],
  },

  // ---- Phase 2: 이미지 ----
  {
    id: 'image-resize',
    title: '이미지 리사이즈',
    description: '픽셀/비율/목표 용량으로 크기를 조정합니다.',
    href: '/tools/image/resize',
    category: 'image',
    icon: Maximize2,
    status: 'ready',
    phase: 2,
    keywords: ['resize', '크기', '조정'],
  },
  {
    id: 'image-crop',
    title: '이미지 자르기',
    description: '드래그로 영역 지정, 비율 프리셋 지원.',
    href: '/tools/image/crop',
    category: 'image',
    icon: Scissors,
    status: 'ready',
    phase: 2,
    keywords: ['crop', '자르기'],
  },
  {
    id: 'image-rotate',
    title: '이미지 회전/반전',
    description: '90/180/270도 회전 및 좌우·상하 반전.',
    href: '/tools/image/rotate',
    category: 'image',
    icon: RotateCw,
    status: 'ready',
    phase: 2,
    keywords: ['rotate', 'flip', '회전', '반전'],
  },
  {
    id: 'image-convert',
    title: '이미지 포맷 변환',
    description: 'JPG/PNG/WebP/AVIF 간 변환. 다중 파일 지원.',
    href: '/tools/image/convert',
    category: 'image',
    icon: FileImage,
    status: 'ready',
    phase: 2,
    keywords: ['convert', 'format', '변환', 'webp', 'avif'],
  },
  {
    id: 'image-watermark',
    title: '이미지 워터마크',
    description: '텍스트/로고 워터마크 합성.',
    href: '/tools/image/watermark',
    category: 'image',
    icon: Stamp,
    status: 'ready',
    phase: 2,
    keywords: ['watermark', '워터마크'],
  },
  {
    id: 'images-to-pdf',
    title: '여러 이미지 → PDF',
    description: '이미지를 순서대로 묶어 PDF 로 만듭니다.',
    href: '/tools/pdf/from-jpg',
    category: 'image',
    icon: Images,
    status: 'ready',
    phase: 2,
    keywords: ['convert', 'combine', 'PDF로'],
  },
  {
    id: 'image-batch-compress',
    title: '이미지 일괄 압축',
    description: '여러 장을 한 번에 압축하여 ZIP 으로 저장.',
    href: '/tools/image/batch-compress',
    category: 'image',
    icon: Archive,
    status: 'ready',
    phase: 2,
    keywords: ['batch', 'bulk', '일괄', 'zip'],
  },

  // ---- Phase 3: 보안/편집 ----
  {
    id: 'pdf-unlock',
    title: 'PDF 잠금 해제',
    description: '편집/인쇄 제한 제거 또는 열람 암호 해제 (래스터화).',
    href: '/tools/pdf/unlock',
    category: 'security',
    icon: ShieldOff,
    status: 'ready',
    phase: 3,
    keywords: ['unlock', 'decrypt', '잠금', '암호해제'],
  },
  {
    id: 'pdf-protect',
    title: 'PDF 암호 설정',
    description: '열람·권한 암호와 세부 권한(인쇄·편집·복사 등) 설정.',
    href: '/tools/pdf/protect',
    category: 'security',
    icon: FileLock,
    status: 'ready',
    phase: 3,
    keywords: ['protect', 'encrypt', 'password', '암호설정'],
  },
  {
    id: 'pdf-sign',
    title: 'PDF 서명',
    description: '마우스/터치로 직접 서명하여 PDF 에 삽입합니다.',
    href: '/tools/pdf/sign',
    category: 'security',
    icon: PenTool,
    status: 'ready',
    phase: 3,
    keywords: ['sign', 'signature', '서명'],
  },
  {
    id: 'pdf-repair',
    title: 'PDF 복구',
    description: '2단계 복구: 구조 복원 + 래스터 재조립 폴백.',
    href: '/tools/pdf/repair',
    category: 'security',
    icon: FilePlus,
    status: 'ready',
    phase: 3,
    keywords: ['repair', 'fix', '복구'],
  },

  // ---- Phase 4: AI ----
  {
    id: 'ocr',
    title: 'OCR (이미지/PDF → 텍스트)',
    description: '한국어 포함 이미지·PDF 의 문자를 인식합니다. Tesseract 기반.',
    href: '/tools/ocr',
    category: 'ai',
    icon: ScanText,
    status: 'ready',
    phase: 4,
    keywords: ['ocr', 'text', '문자', '추출', 'tesseract'],
  },
  {
    id: 'remove-background',
    title: 'AI 배경 제거',
    description: '인물·상품 배경을 자동 분리. 투명 배경 PNG 출력.',
    href: '/tools/image/remove-background',
    category: 'ai',
    icon: Eraser,
    status: 'ready',
    phase: 4,
    keywords: ['background', 'bg', '배경', '누끼'],
  },
  {
    id: 'blur-face',
    title: '얼굴 블러',
    description: 'AI 로 얼굴 자동 감지 + 블러/모자이크. 수동 박스 추가 가능.',
    href: '/tools/image/blur-face',
    category: 'ai',
    icon: FileSearch,
    status: 'ready',
    phase: 4,
    keywords: ['face', 'blur', 'privacy', '모자이크', 'mosaic'],
  },
  {
    id: 'image-upscale',
    title: 'AI 이미지 업스케일',
    description: 'ESRGAN 초해상도로 2x/3x/4x 확대. 1MP 이하 권장.',
    href: '/tools/image/upscale',
    category: 'ai',
    icon: FileMinus,
    status: 'ready',
    phase: 4,
    keywords: ['upscale', 'enlarge', '확대', '업스케일', 'esrgan', 'sr'],
  },

  // ---- Phase 5: 비디오 & GIF (FFmpeg.wasm) ----
  {
    id: 'video-to-gif',
    title: '비디오 → GIF',
    description: '비디오의 구간을 GIF 애니메이션으로 변환합니다.',
    href: '/tools/video/to-gif',
    category: 'video',
    icon: Clapperboard,
    status: 'ready',
    phase: 5,
    keywords: ['gif', 'animation', 'ffmpeg', 'video', 'mp4'],
  },
  {
    id: 'video-convert',
    title: '비디오 포맷 변환',
    description: 'MP4 / WebM / MOV / AVI / MKV 상호 변환.',
    href: '/tools/video/convert',
    category: 'video',
    icon: FileVideo,
    status: 'ready',
    phase: 5,
    keywords: ['convert', 'format', 'mp4', 'webm', 'avi'],
  },
  {
    id: 'video-trim',
    title: '비디오 자르기',
    description: '구간 지정으로 비디오를 잘라냅니다.',
    href: '/tools/video/trim',
    category: 'video',
    icon: Scissors,
    status: 'ready',
    phase: 5,
    keywords: ['trim', 'cut', '자르기'],
  },
  {
    id: 'video-compress',
    title: '비디오 압축',
    description: '해상도·비트레이트 조정으로 용량을 줄입니다.',
    href: '/tools/video/compress',
    category: 'video',
    icon: Archive,
    status: 'ready',
    phase: 5,
    keywords: ['compress', 'shrink', '압축', '용량'],
  },
  {
    id: 'video-extract-frames',
    title: '비디오 → 프레임 추출',
    description: '각 프레임을 이미지로 추출합니다.',
    href: '/tools/video/extract-frames',
    category: 'video',
    icon: Film,
    status: 'ready',
    phase: 5,
    keywords: ['frames', 'extract', '프레임', '스틸'],
  },

  {
    id: 'gif-maker',
    title: 'GIF 만들기',
    description: '여러 이미지를 순서대로 애니메이션 GIF 로 묶습니다.',
    href: '/tools/gif/maker',
    category: 'gif',
    icon: Images,
    status: 'ready',
    phase: 5,
    keywords: ['gif', 'animate', 'maker', '만들기'],
  },
  {
    id: 'gif-resize',
    title: 'GIF 리사이즈',
    description: 'GIF 크기를 조정합니다.',
    href: '/tools/gif/resize',
    category: 'gif',
    icon: Maximize2,
    status: 'ready',
    phase: 5,
    keywords: ['resize', '크기'],
  },
  {
    id: 'gif-optimize',
    title: 'GIF 최적화',
    description: '팔레트·프레임 드롭으로 용량을 줄입니다.',
    href: '/tools/gif/optimize',
    category: 'gif',
    icon: Archive,
    status: 'ready',
    phase: 5,
    keywords: ['optimize', 'compress', '최적화', '용량'],
  },
  {
    id: 'gif-crop',
    title: 'GIF 영역 자르기',
    description: 'GIF 의 특정 영역만 잘라냅니다.',
    href: '/tools/gif/crop',
    category: 'gif',
    icon: Crop,
    status: 'ready',
    phase: 5,
    keywords: ['crop', '자르기'],
  },
  {
    id: 'gif-trim',
    title: 'GIF 구간 자르기',
    description: '시작·끝 시간을 지정하여 GIF 를 자릅니다.',
    href: '/tools/gif/trim',
    category: 'gif',
    icon: Scissors,
    status: 'ready',
    phase: 5,
    keywords: ['trim', 'cut', '구간'],
  },
  {
    id: 'gif-effects',
    title: 'GIF 효과',
    description: '역재생 · 배속 · 핑퐁 반복 효과를 적용합니다.',
    href: '/tools/gif/effects',
    category: 'gif',
    icon: FastForward,
    status: 'ready',
    phase: 5,
    keywords: ['reverse', 'speed', '역재생', '배속', 'pingpong'],
  },
  {
    id: 'gif-text',
    title: 'GIF 텍스트 삽입',
    description: 'GIF 전체에 표시될 텍스트·자막을 추가합니다.',
    href: '/tools/gif/text',
    category: 'gif',
    icon: Type,
    status: 'ready',
    phase: 5,
    keywords: ['text', 'caption', '자막'],
  },
];

/** status:'ready' 만 반환 */
export const readyTools = () => TOOLS.filter((t) => t.status === 'ready');

/** 검색 쿼리 + 카테고리 필터 적용 */
export function filterTools(query: string, category: ToolCategory | 'all'): ToolMeta[] {
  const q = query.trim().toLowerCase();
  return TOOLS.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (!q) return true;
    const hay = [
      t.title,
      t.description,
      ...(t.keywords ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  }).sort((a, b) => {
    // ready 우선, 그 다음 phase 오름차순
    if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
    return a.phase - b.phase;
  });
}
