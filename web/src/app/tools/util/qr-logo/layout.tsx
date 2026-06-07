/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `로고 QR 코드 — Web Toolkit`;
const DESCRIPTION = `QR 코드 가운데에 로고를 넣어 브랜드 QR을 만듭니다.`;
const URL_PATH = '/tools/util/qr-logo';
const OG_IMAGE = '/og/util.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["로고 qr","qr logo","브랜드 qr","custom qr","큐알","유틸","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/qr-logo',
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
        alt: `로고 QR 코드 — 유틸 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"로고 QR 코드","description":"QR 코드 가운데에 로고를 넣어 브랜드 QR을 만듭니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/qr-logo","applicationCategory":"UtilitiesApplication","applicationSubCategory":"유틸","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"로고 QR 코드 사용 방법","description":"QR 코드 가운데에 로고를 넣어 브랜드 QR을 만듭니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"로고 QR 코드","url":"https://agent-control-panel-phi.vercel.app/tools/util/qr-logo"},"step":[{"@type":"HowToStep","position":1,"name":"옵션 선택","text":"필요한 형식·길이·강도 등 옵션을 화면에서 선택합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/qr-logo#step1"},{"@type":"HowToStep","position":2,"name":"생성","text":"\"생성\" 버튼을 누르면 브라우저 내장 Web Crypto API 로 즉시 결과가 만들어집니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/qr-logo#step2"},{"@type":"HowToStep","position":3,"name":"복사·저장","text":"결과를 클립보드에 복사하거나 파일로 저장합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/qr-logo#step3"}]} as const;

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
