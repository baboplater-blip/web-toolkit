/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const TITLE = `EXIF 뷰어 — Web Toolkit`;
const DESCRIPTION = `사진의 촬영 정보·GPS·카메라 정보를 표시합니다.`;
const URL_PATH = '/tools/image/exif-view';
const OG_IMAGE = '/og/tools/image-exif-view.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["exif","metadata","메타데이터","촬영정보","gps","카메라","이미지","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/image-exif-view',
      'ja': '/ja/tools/image-exif-view',
      'zh': '/zh/tools/image-exif-view',
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
        alt: `EXIF 뷰어 — 이미지 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"EXIF 뷰어","description":"사진의 촬영 정보·GPS·카메라 정보를 표시합니다.","url":"https://__SITE_URL__/tools/image/exif-view","applicationCategory":"MultimediaApplication","applicationSubCategory":"이미지","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://__SITE_URL__"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"EXIF 뷰어 사용 방법","description":"사진의 촬영 정보·GPS·카메라 정보를 표시합니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"EXIF 뷰어","url":"https://__SITE_URL__/tools/image/exif-view"},"step":[{"@type":"HowToStep","position":1,"name":"파일 열기","text":"도구 페이지를 열고 파일을 드롭존에 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 열리며 서버로 전송되지 않습니다.","url":"https://__SITE_URL__/tools/image/exif-view#step1"},{"@type":"HowToStep","position":2,"name":"내용 보기","text":"EXIF 뷰어이(가) 본문·메타데이터·목차 등을 화면에 표시합니다. 변환·저장 없이 바로 확인할 수 있습니다.","url":"https://__SITE_URL__/tools/image/exif-view#step2"},{"@type":"HowToStep","position":3,"name":"필요하면 내보내기","text":"도구에 따라 표시된 내용을 텍스트·마크다운·이미지로 내보낼 수 있습니다. 확인만 한다면 그대로 닫으면 됩니다.","url":"https://__SITE_URL__/tools/image/exif-view#step3"}]} as const;

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
