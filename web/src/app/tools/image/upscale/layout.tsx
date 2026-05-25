/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `AI 이미지 업스케일 — Web Toolkit`;
const DESCRIPTION = `ESRGAN 초해상도로 2x/3x/4x 확대. 1MP 이하 권장.`;
const URL_PATH = '/tools/image/upscale';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["upscale","enlarge","확대","업스케일","esrgan","sr","AI","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"AI 이미지 업스케일","description":"ESRGAN 초해상도로 2x/3x/4x 확대. 1MP 이하 권장.","url":"https://web-toolkit.vercel.app/tools/image/upscale","applicationCategory":"UtilitiesApplication","applicationSubCategory":"AI","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
