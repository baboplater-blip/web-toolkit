/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `EXIF 제거 — Web Toolkit`;
const DESCRIPTION = `사진의 위치·촬영 정보를 제거합니다 (개인정보 보호).`;
const URL_PATH = '/tools/image/exif-strip';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["exif","strip","privacy","제거","개인정보","위치","gps","이미지","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"EXIF 제거","description":"사진의 위치·촬영 정보를 제거합니다 (개인정보 보호).","url":"https://web-toolkit.vercel.app/tools/image/exif-strip","applicationCategory":"MultimediaApplication","applicationSubCategory":"이미지","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
