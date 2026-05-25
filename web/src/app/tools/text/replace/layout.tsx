/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `일괄 찾기·치환 — Web Toolkit`;
const DESCRIPTION = `정규식·캡처 그룹 지원 일괄 치환. 매칭 개수 실시간 표시.`;
const URL_PATH = '/tools/text/replace';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["replace","find","substitute","치환","바꾸기","찾기","regex","정규식","텍스트","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"일괄 찾기·치환","description":"정규식·캡처 그룹 지원 일괄 치환. 매칭 개수 실시간 표시.","url":"https://web-toolkit.vercel.app/tools/text/replace","applicationCategory":"UtilitiesApplication","applicationSubCategory":"텍스트","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
