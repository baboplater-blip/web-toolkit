/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const TITLE = `영상 해상도 변경 — Web Toolkit`;
const DESCRIPTION = `영상을 720p·1080p 등 원하는 해상도로 다시 인코딩합니다.`;
const URL_PATH = '/tools/video/resize';
const OG_IMAGE = '/og/video.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["해상도","resize video","scale","720p","1080p","리사이즈","비디오","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/video-resize',
      'ja': '/ja/tools/video-resize',
      'zh': '/zh/tools/video-resize',
      'x-default': URL_PATH,
    },
  },
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
        alt: `영상 해상도 변경 — 비디오 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"영상 해상도 변경","description":"영상을 720p·1080p 등 원하는 해상도로 다시 인코딩합니다.","url":"https://__SITE_URL__/tools/video/resize","applicationCategory":"MultimediaApplication","applicationSubCategory":"비디오","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://__SITE_URL__"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"영상 해상도 변경 사용 방법","description":"영상을 720p·1080p 등 원하는 해상도로 다시 인코딩합니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"영상 해상도 변경","url":"https://__SITE_URL__/tools/video/resize"},"step":[{"@type":"HowToStep","position":1,"name":"파일 업로드","text":"도구 페이지를 열고 변환할 파일을 드롭존에 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.","url":"https://__SITE_URL__/tools/video/resize#step1"},{"@type":"HowToStep","position":2,"name":"옵션 설정","text":"영상 해상도 변경에 필요한 옵션을 화면에서 선택합니다. 미리보기로 결과를 확인할 수 있습니다.","url":"https://__SITE_URL__/tools/video/resize#step2"},{"@type":"HowToStep","position":3,"name":"결과 다운로드","text":"\"다운로드\" 버튼을 눌러 처리된 파일을 기기에 저장합니다.","url":"https://__SITE_URL__/tools/video/resize#step3"}]} as const;

// JSON-LD 의 sentinel(https://__SITE_URL__) 을 런타임 운영 도메인으로 치환.
const withSite = (obj: unknown) =>
  JSON.stringify(obj).replaceAll('https://__SITE_URL__', SITE_URL);

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: withSite(JSON_LD) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: withSite(HOWTO_JSON_LD) }}
      />
      {children}
    </>
  );
}
