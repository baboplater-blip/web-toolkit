/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `연차·주휴수당 계산기 — Web Toolkit`;
const DESCRIPTION = `입사일 기준 연차 일수 + 주휴수당 산정.`;
const URL_PATH = '/tools/util/leave';
const OG_IMAGE = '/og/util.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["연차","주휴수당","연차계산","근무일","annual leave","근속","휴가","유틸","브라우저 도구","무료","온라인","no upload"],
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
        alt: `연차·주휴수당 계산기 — 유틸 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"연차·주휴수당 계산기","description":"입사일 기준 연차 일수 + 주휴수당 산정.","url":"https://agent-control-panel-phi.vercel.app/tools/util/leave","applicationCategory":"UtilitiesApplication","applicationSubCategory":"유틸","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"연차·주휴수당 계산기 사용 방법","description":"입사일 기준 연차 일수 + 주휴수당 산정.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"연차·주휴수당 계산기","url":"https://agent-control-panel-phi.vercel.app/tools/util/leave"},"step":[{"@type":"HowToStep","position":1,"name":"값 입력","text":"날짜·금액·수치·단위 등 필요한 값을 입력칸에 넣습니다. 텍스트를 붙여넣는 것이 아니라 항목별로 값을 채웁니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/leave#step1"},{"@type":"HowToStep","position":2,"name":"실시간 계산","text":"입력을 바꾸는 즉시 결과가 다시 계산되어 화면에 표시됩니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/leave#step2"},{"@type":"HowToStep","position":3,"name":"결과 복사","text":"계산된 결과값을 클립보드에 복사해 바로 활용합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/leave#step3"}]} as const;

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
