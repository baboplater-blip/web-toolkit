/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `비디오 → MP3 (오디오 추출) — Web Toolkit`;
const DESCRIPTION = `비디오 파일에서 오디오 트랙을 추출하여 MP3/WAV 로 저장.`;
const URL_PATH = '/tools/audio/from-video';
const OG_IMAGE = '/og/audio.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["audio","extract","mp3","오디오추출","음원","오디오","브라우저 도구","무료","온라인","no upload"],
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
        alt: `비디오 → MP3 (오디오 추출) — 오디오 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"비디오 → MP3 (오디오 추출)","description":"비디오 파일에서 오디오 트랙을 추출하여 MP3/WAV 로 저장.","url":"https://agent-control-panel-phi.vercel.app/tools/audio/from-video","applicationCategory":"MultimediaApplication","applicationSubCategory":"오디오","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;

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
