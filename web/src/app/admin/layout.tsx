import type { Metadata } from 'next';

// 어드민 대시보드(본인 브라우저 로컬 통계 뷰)는 색인 대상이 아니다.
// 정적 export 라 페이지 자체는 도달 가능하지만 검색 색인에서는 제외한다.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
