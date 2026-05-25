/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `이미지 → ASCII 아트 — Web Toolkit`;
const DESCRIPTION = `이미지를 텍스트 문자로 변환. TXT/PNG 출력.`;
const URL_PATH = '/tools/image/ascii-art';
const OG_IMAGE = '/og/image.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["ascii","아스키","art","아트","문자","text","image","이미지","브라우저 도구","무료","온라인","no upload"],
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
        alt: `이미지 → ASCII 아트 — 이미지 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"이미지 → ASCII 아트","description":"이미지를 텍스트 문자로 변환. TXT/PNG 출력.","url":"https://agent-control-panel-phi.vercel.app/tools/image/ascii-art","applicationCategory":"MultimediaApplication","applicationSubCategory":"이미지","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;

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
