/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `EPUB 리더 — Web Toolkit`;
const DESCRIPTION = `EPUB 전자책을 브라우저에서 바로 읽습니다. 목차·테마·글자 크기 조절.`;
const URL_PATH = '/tools/docs/epub-reader';
const OG_IMAGE = '/og/tools/epub-reader.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["epub","리더","reader","view","뷰어","읽기","ebook","전자책","문서 변환","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/epub-reader',
      'ja': '/ja/tools/epub-reader',
      'zh': '/zh/tools/epub-reader',
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
        alt: `EPUB 리더 — 문서 변환 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"EPUB 리더","description":"EPUB 전자책을 브라우저에서 바로 읽습니다. 목차·테마·글자 크기 조절.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/epub-reader","applicationCategory":"BusinessApplication","applicationSubCategory":"문서 변환","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"EPUB 리더 사용 방법","description":"EPUB 전자책을 브라우저에서 바로 읽습니다. 목차·테마·글자 크기 조절.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"EPUB 리더","url":"https://agent-control-panel-phi.vercel.app/tools/docs/epub-reader"},"step":[{"@type":"HowToStep","position":1,"name":"파일 열기","text":"도구 페이지를 열고 파일을 드롭존에 끌어다 놓거나 선택합니다. 파일은 브라우저 안에서만 열리며 서버로 전송되지 않습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/epub-reader#step1"},{"@type":"HowToStep","position":2,"name":"내용 보기","text":"EPUB 리더이(가) 본문·메타데이터·목차 등을 화면에 표시합니다. 변환·저장 없이 바로 확인할 수 있습니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/epub-reader#step2"},{"@type":"HowToStep","position":3,"name":"필요하면 내보내기","text":"도구에 따라 표시된 내용을 텍스트·마크다운·이미지로 내보낼 수 있습니다. 확인만 한다면 그대로 닫으면 됩니다.","url":"https://agent-control-panel-phi.vercel.app/tools/docs/epub-reader#step3"}]} as const;

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
