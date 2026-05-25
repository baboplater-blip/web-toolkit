/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `얼굴 블러 — Web Toolkit`;
const DESCRIPTION = `AI 로 얼굴 자동 감지 + 블러/모자이크. 수동 박스 추가 가능.`;
const URL_PATH = '/tools/image/blur-face';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["face","blur","privacy","모자이크","mosaic","AI","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"얼굴 블러","description":"AI 로 얼굴 자동 감지 + 블러/모자이크. 수동 박스 추가 가능.","url":"https://web-toolkit.vercel.app/tools/image/blur-face","applicationCategory":"UtilitiesApplication","applicationSubCategory":"AI","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
