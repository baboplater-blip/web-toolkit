/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const TITLE = `SVG 최적화 — Web Toolkit`;
const DESCRIPTION = `SVG의 불필요한 메타데이터·공백·소수점을 정리해 용량을 줄입니다.`;
const URL_PATH = '/tools/dev/svg-optimize';
const OG_IMAGE = '/og/dev.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["svg 최적화","svg optimize","svgo","minify svg","용량 줄이기","개발자","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/svg-optimize',
      'ja': '/ja/tools/svg-optimize',
      'zh': '/zh/tools/svg-optimize',
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
        alt: `SVG 최적화 — 개발자 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"SVG 최적화","description":"SVG의 불필요한 메타데이터·공백·소수점을 정리해 용량을 줄입니다.","url":"https://__SITE_URL__/tools/dev/svg-optimize","applicationCategory":"DeveloperApplication","applicationSubCategory":"개발자","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://__SITE_URL__"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"SVG 최적화 사용 방법","description":"SVG의 불필요한 메타데이터·공백·소수점을 정리해 용량을 줄입니다.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"SVG 최적화","url":"https://__SITE_URL__/tools/dev/svg-optimize"},"step":[{"@type":"HowToStep","position":1,"name":"입력","text":"변환·분석할 텍스트나 데이터를 입력 영역에 붙여넣습니다.","url":"https://__SITE_URL__/tools/dev/svg-optimize#step1"},{"@type":"HowToStep","position":2,"name":"결과 확인","text":"결과가 실시간으로 표시됩니다. 옵션을 조절해 결과를 다듬을 수 있습니다.","url":"https://__SITE_URL__/tools/dev/svg-optimize#step2"},{"@type":"HowToStep","position":3,"name":"복사·저장","text":"결과를 클립보드에 복사하거나 파일로 내려받습니다.","url":"https://__SITE_URL__/tools/dev/svg-optimize#step3"}]} as const;

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
