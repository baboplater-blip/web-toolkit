/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `SVG → PNG — Web Toolkit`;
const DESCRIPTION = `벡터 SVG 를 원하는 해상도의 PNG 로 래스터화합니다.`;
const URL_PATH = '/tools/image/svg-to-png';
const OG_IMAGE = '/og/tools/image-svg-to-png.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["svg","png","raster","래스터","벡터","convert","변환","이미지","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/image-svg-to-png',
      'ja': '/ja/tools/image-svg-to-png',
      'zh': '/zh/tools/image-svg-to-png',
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
        alt: `SVG → PNG — 이미지 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"SVG → PNG","description":"벡터 SVG 를 원하는 해상도의 PNG 로 래스터화합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/svg-to-png","applicationCategory":"MultimediaApplication","applicationSubCategory":"이미지","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"SVG → PNG 사용 방법","description":"벡터 SVG 를 원하는 해상도의 PNG 로 래스터화합니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"SVG → PNG","url":"https://agent-control-panel-phi.vercel.app/tools/image/svg-to-png"},"step":[{"@type":"HowToStep","position":1,"name":"파일 업로드","text":"도구 페이지를 열고 변환할 파일을 드롭존에 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/svg-to-png#step1"},{"@type":"HowToStep","position":2,"name":"옵션 설정","text":"SVG → PNG에 필요한 옵션을 화면에서 선택합니다. 미리보기로 결과를 확인할 수 있습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/svg-to-png#step2"},{"@type":"HowToStep","position":3,"name":"결과 다운로드","text":"\"다운로드\" 버튼을 눌러 처리된 파일을 기기에 저장합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/svg-to-png#step3"}]} as const;

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_JSON_LD) }}
      />
      {children}
    </>
  );
}
