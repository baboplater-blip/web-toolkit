import { ToolNavigation } from '@/components/tools/ToolNavigation';

/**
 * 도구 섹션 공통 레이아웃.
 * - 도구 페이지 하단에 자동으로 prev/next + 같은 카테고리 메뉴 노출
 * - hub 페이지(/tools) 에서는 ToolNavigation 이 매칭 실패 → 자동 null 반환
 */
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToolNavigation />
    </>
  );
}
