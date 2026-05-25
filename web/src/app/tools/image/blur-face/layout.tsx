/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `얼굴 블러 — Web Toolkit`;
const DESCRIPTION = `AI 로 얼굴 자동 감지 + 블러/모자이크. 수동 박스 추가 가능.`;
const URL_PATH = '/tools/image/blur-face';
const OG_IMAGE = '/og/tools/blur-face.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["face","blur","privacy","모자이크","mosaic","AI","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools',
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
        alt: `얼굴 블러 — AI 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"얼굴 블러","description":"AI 로 얼굴 자동 감지 + 블러/모자이크. 수동 박스 추가 가능.","url":"https://agent-control-panel-phi.vercel.app/tools/image/blur-face","applicationCategory":"UtilitiesApplication","applicationSubCategory":"AI","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"얼굴 블러 사용 방법","description":"AI 로 얼굴 자동 감지 + 블러/모자이크. 수동 박스 추가 가능.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"얼굴 블러","url":"https://agent-control-panel-phi.vercel.app/tools/image/blur-face"},"step":[{"@type":"HowToStep","position":1,"name":"입력","text":"변환·분석할 텍스트나 데이터를 입력 영역에 붙여넣습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/blur-face#step1"},{"@type":"HowToStep","position":2,"name":"결과 확인","text":"결과가 실시간으로 표시됩니다. 옵션을 조절해 결과를 다듬을 수 있습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/blur-face#step2"},{"@type":"HowToStep","position":3,"name":"복사·저장","text":"결과를 클립보드에 복사하거나 파일로 내려받습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/image/blur-face#step3"}]} as const;

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
