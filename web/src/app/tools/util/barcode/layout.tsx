/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `바코드 생성 — Web Toolkit`;
const DESCRIPTION = `Code128 / EAN / UPC 바코드를 생성합니다.`;
const URL_PATH = '/tools/util/barcode';
const OG_IMAGE = '/og/tools/barcode.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["barcode","바코드","유틸","브라우저 도구","무료","온라인","no upload"],
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
        alt: `바코드 생성 — 유틸 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"바코드 생성","description":"Code128 / EAN / UPC 바코드를 생성합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/barcode","applicationCategory":"UtilitiesApplication","applicationSubCategory":"유틸","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"바코드 생성 사용 방법","description":"Code128 / EAN / UPC 바코드를 생성합니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"바코드 생성","url":"https://agent-control-panel-phi.vercel.app/tools/util/barcode"},"step":[{"@type":"HowToStep","position":1,"name":"입력","text":"변환·분석할 텍스트나 데이터를 입력 영역에 붙여넣습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/barcode#step1"},{"@type":"HowToStep","position":2,"name":"결과 확인","text":"결과가 실시간으로 표시됩니다. 옵션을 조절해 결과를 다듬을 수 있습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/barcode#step2"},{"@type":"HowToStep","position":3,"name":"복사·저장","text":"결과를 클립보드에 복사하거나 파일로 내려받습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/util/barcode#step3"}]} as const;

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
