import { InlineToolAd } from '@/components/InlineToolAd';
import { ToolNavigation } from '@/components/tools/ToolNavigation';

/**
 * 도구 섹션 공통 레이아웃.
 * - 도구 페이지 본문 위에 인라인 광고(허브 제외)
 * - 도구 페이지 하단에 자동으로 prev/next + 같은 카테고리 메뉴 노출
 */
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InlineToolAd />
      {children}
      <ToolNavigation />
    </>
  );
}
