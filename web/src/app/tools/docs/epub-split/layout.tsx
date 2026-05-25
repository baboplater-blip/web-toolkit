/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `EPUB 챕터 분할 — Web Toolkit`;
const DESCRIPTION = `EPUB 의 챕터를 각각 독립된 EPUB 으로 분할해 ZIP 으로 묶습니다.`;
const URL_PATH = '/tools/docs/epub-split';
const OG_IMAGE = '/og/docs.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["epub","split","분할","챕터","chapter","나누기","문서 변환","브라우저 도구","무료","온라인","no upload"],
  alternates: { canonical: URL_PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ko_KR',
    url: URL_PATH,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `EPUB 챕터 분할 — 문서 변환 도구`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"EPUB 챕터 분할","description":"EPUB 의 챕터를 각각 독립된 EPUB 으로 분할해 ZIP 으로 묶습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/epub-split","applicationCategory":"BusinessApplication","applicationSubCategory":"문서 변환","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;

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
