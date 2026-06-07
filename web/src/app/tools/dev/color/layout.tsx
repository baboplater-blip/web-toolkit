/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `색상 변환기 — Web Toolkit`;
const DESCRIPTION = `HEX / RGB / HSL / OKLCH 색상 표기 상호 변환.`;
const URL_PATH = '/tools/dev/color';
const OG_IMAGE = '/og/tools/color-converter.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["color","색상","hex","rgb","hsl","oklch","convert","변환","개발자","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/color-converter',
      'ja': '/ja/tools/color-converter',
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
        alt: `색상 변환기 — 개발자 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"색상 변환기","description":"HEX / RGB / HSL / OKLCH 색상 표기 상호 변환.","url":"https://agent-control-panel-phi.vercel.app/tools/dev/color","applicationCategory":"DeveloperApplication","applicationSubCategory":"개발자","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"색상 변환기 사용 방법","description":"HEX / RGB / HSL / OKLCH 색상 표기 상호 변환.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"색상 변환기","url":"https://agent-control-panel-phi.vercel.app/tools/dev/color"},"step":[{"@type":"HowToStep","position":1,"name":"값 입력","text":"날짜·금액·수치·단위 등 필요한 값을 입력칸에 넣습니다. 텍스트를 붙여넣는 것이 아니라 항목별로 값을 채웁니다.","url":"https://agent-control-panel-phi.vercel.app/tools/dev/color#step1"},{"@type":"HowToStep","position":2,"name":"실시간 계산","text":"입력을 바꾸는 즉시 결과가 다시 계산되어 화면에 표시됩니다.","url":"https://agent-control-panel-phi.vercel.app/tools/dev/color#step2"},{"@type":"HowToStep","position":3,"name":"결과 복사","text":"계산된 결과값을 클립보드에 복사해 바로 활용합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/dev/color#step3"}]} as const;

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
