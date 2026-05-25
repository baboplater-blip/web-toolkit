/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `Markdown → EPUB — Web Toolkit`;
const DESCRIPTION = `Markdown 을 헤딩 단위로 챕터 분할해 EPUB 으로 만듭니다. 표지 포함 가능.`;
const URL_PATH = '/tools/docs/md-to-epub';
const OG_IMAGE = '/og/tools/md-to-epub.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["markdown","md","epub","생성","create","ebook","전자책","문서 변환","브라우저 도구","무료","온라인","no upload"],
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
        alt: `Markdown → EPUB — 문서 변환 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"Markdown → EPUB","description":"Markdown 을 헤딩 단위로 챕터 분할해 EPUB 으로 만듭니다. 표지 포함 가능.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/md-to-epub","applicationCategory":"BusinessApplication","applicationSubCategory":"문서 변환","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"Markdown → EPUB 사용 방법","description":"Markdown 을 헤딩 단위로 챕터 분할해 EPUB 으로 만듭니다. 표지 포함 가능.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"Markdown → EPUB","url":"https://agent-control-panel-phi.vercel.app/tools/docs/md-to-epub"},"step":[{"@type":"HowToStep","position":1,"name":"파일 업로드","text":"도구 페이지를 열고 변환할 파일을 드롭존에 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/md-to-epub#step1"},{"@type":"HowToStep","position":2,"name":"옵션 설정","text":"Markdown → EPUB에 필요한 옵션을 화면에서 선택합니다. 미리보기로 결과를 확인할 수 있습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/md-to-epub#step2"},{"@type":"HowToStep","position":3,"name":"결과 다운로드","text":"\"다운로드\" 버튼을 눌러 처리된 파일을 기기에 저장합니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/md-to-epub#step3"}]} as const;

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
