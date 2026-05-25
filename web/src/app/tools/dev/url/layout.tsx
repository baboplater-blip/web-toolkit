/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `URL 인코더/디코더 — Web Toolkit`;
const DESCRIPTION = `URL 구성요소를 인코딩/디코딩하고 쿼리 파라미터를 분석.`;
const URL_PATH = '/tools/dev/url';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["url","encode","decode","query","개발자","브라우저 도구","무료","온라인","no upload"],
  alternates: { canonical: URL_PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ko_KR',
    url: URL_PATH,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"URL 인코더/디코더","description":"URL 구성요소를 인코딩/디코딩하고 쿼리 파라미터를 분석.","url":"https://web-toolkit.vercel.app/tools/dev/url","applicationCategory":"DeveloperApplication","applicationSubCategory":"개발자","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {children}
    </>
  );
}
