/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `HEIC → JPG — Web Toolkit`;
const DESCRIPTION = `iPhone HEIC 사진을 JPG/PNG 로 변환합니다.`;
const URL_PATH = '/tools/image/heic-to-jpg';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["heic","jpg","png","iphone","아이폰","사진","변환","convert","이미지","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"HEIC → JPG","description":"iPhone HEIC 사진을 JPG/PNG 로 변환합니다.","url":"https://web-toolkit.vercel.app/tools/image/heic-to-jpg","applicationCategory":"MultimediaApplication","applicationSubCategory":"이미지","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
