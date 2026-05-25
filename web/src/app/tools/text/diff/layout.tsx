/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `텍스트 비교 (Diff) — Web Toolkit`;
const DESCRIPTION = `두 텍스트의 차이를 줄 단위로 비교합니다.`;
const URL_PATH = '/tools/text/diff';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["diff","compare","비교","텍스트","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"텍스트 비교 (Diff)","description":"두 텍스트의 차이를 줄 단위로 비교합니다.","url":"https://web-toolkit.vercel.app/tools/text/diff","applicationCategory":"UtilitiesApplication","applicationSubCategory":"텍스트","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
