/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `GIF 구간 자르기 — Web Toolkit`;
const DESCRIPTION = `GIF 의 시작·끝 시간을 지정해 원하는 구간만 잘라 새 GIF 로 저장합니다. 앞뒤 불필요한 프레임을 제거할 때 유용합니다.`;
const URL_PATH = '/tools/gif/trim';
const OG_IMAGE = '/og/tools/gif-trim.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["trim","cut","segment","구간","자르기","gif trim","프레임","GIF","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/gif-trim',
      'ja': '/ja/tools/gif-trim',
      'zh': '/zh/tools/gif-trim',
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
        alt: `GIF 구간 자르기 — GIF 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"GIF 구간 자르기","description":"GIF 의 시작·끝 시간을 지정해 원하는 구간만 잘라 새 GIF 로 저장합니다. 앞뒤 불필요한 프레임을 제거할 때 유용합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/gif/trim","applicationCategory":"MultimediaApplication","applicationSubCategory":"GIF","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"GIF 구간 자르기 사용 방법","description":"GIF 의 시작·끝 시간을 지정해 원하는 구간만 잘라 새 GIF 로 저장합니다. 앞뒤 불필요한 프레임을 제거할 때 유용합니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"GIF 구간 자르기","url":"https://agent-control-panel-phi.vercel.app/tools/gif/trim"},"step":[{"@type":"HowToStep","position":1,"name":"파일 업로드","text":"도구 페이지를 열고 변환할 파일을 드롭존에 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/gif/trim#step1"},{"@type":"HowToStep","position":2,"name":"옵션 설정","text":"GIF 구간 자르기에 필요한 옵션을 화면에서 선택합니다. 미리보기로 결과를 확인할 수 있습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/gif/trim#step2"},{"@type":"HowToStep","position":3,"name":"결과 다운로드","text":"\"다운로드\" 버튼을 눌러 처리된 파일을 기기에 저장합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/gif/trim#step3"}]} as const;

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
