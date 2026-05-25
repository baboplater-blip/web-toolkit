import type { Metadata } from 'next';
import { InlineToolAd } from '@/components/InlineToolAd';
import { ToolNavigation } from '@/components/tools/ToolNavigation';

const SITE_NAME = 'Web Toolkit';
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
).replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Web Toolkit — 브라우저 도구 모음',
  description:
    '브라우저에서 완결되는 PDF·이미지·비디오·오디오·OCR·AI 도구 모음. 파일이 서버로 전송되지 않습니다.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Web Toolkit — 브라우저 도구 모음',
    description:
      '브라우저에서 완결되는 PDF·이미지·비디오·오디오·OCR·AI 도구. 업로드 없음.',
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    url: '/tools',
  },
  twitter: {
    card: 'summary',
    title: 'Web Toolkit — 브라우저 도구 모음',
    description: '브라우저에서 완결되는 무료 도구 모음. 업로드 없음.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: SITE_NAME,
      item: `${SITE_URL}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: '도구',
      item: `${SITE_URL}/tools`,
    },
  ],
};

/**
 * 도구 섹션 공통 레이아웃.
 * - 도구 페이지 본문 위에 인라인 광고(허브 제외)
 * - 도구 페이지 하단에 자동으로 prev/next + 같은 카테고리 메뉴 노출
 * - BreadcrumbList JSON-LD 로 검색엔진 경로 표기
 */
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <InlineToolAd />
      {children}
      <ToolNavigation />
    </>
  );
}
