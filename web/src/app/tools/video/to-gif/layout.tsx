/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `비디오 → GIF — Web Toolkit`;
const DESCRIPTION = `비디오의 구간을 GIF 애니메이션으로 변환합니다.`;
const URL_PATH = '/tools/video/to-gif';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["gif","animation","ffmpeg","video","mp4","비디오","브라우저 도구","무료","온라인","no upload"],
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"비디오 → GIF","description":"비디오의 구간을 GIF 애니메이션으로 변환합니다.","url":"https://web-toolkit.vercel.app/tools/video/to-gif","applicationCategory":"MultimediaApplication","applicationSubCategory":"비디오","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://web-toolkit.vercel.app"}} as const;

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
