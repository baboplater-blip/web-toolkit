/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const TITLE = `QR 코드 생성/읽기 — Web Toolkit`;
const DESCRIPTION = `텍스트·URL → QR 생성, 이미지 → QR 해독.`;
const URL_PATH = '/tools/util/qr';
const OG_IMAGE = '/og/tools/qr-code.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["qr","qrcode","큐알","qr code","qr 생성","qr 스캔","큐알코드","qr reader","유틸","브라우저 도구","무료","온라인","no upload"],
  alternates: {
    canonical: URL_PATH,
    languages: {
      'ko-KR': URL_PATH,
      'en': '/en/tools/qr-code',
      'ja': '/ja/tools/qr-code',
      'zh': '/zh/tools/qr-code',
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
        alt: `QR 코드 생성/읽기 — 유틸 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"QR 코드 생성/읽기","description":"텍스트·URL → QR 생성, 이미지 → QR 해독.","url":"https://__SITE_URL__/tools/util/qr","applicationCategory":"UtilitiesApplication","applicationSubCategory":"유틸","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://__SITE_URL__"}} as const;
const HOWTO_JSON_LD = {"@context":"https://schema.org","@type":"HowTo","name":"QR 코드 생성/읽기 사용 방법","description":"텍스트·URL → QR 생성, 이미지 → QR 해독.","inLanguage":"ko-KR","totalTime":"PT1M","tool":{"@type":"WebApplication","name":"QR 코드 생성/읽기","url":"https://__SITE_URL__/tools/util/qr"},"step":[{"@type":"HowToStep","position":1,"name":"옵션 선택","text":"필요한 형식·길이·강도 등 옵션을 화면에서 선택합니다.","url":"https://__SITE_URL__/tools/util/qr#step1"},{"@type":"HowToStep","position":2,"name":"생성","text":"\"생성\" 버튼을 누르면 브라우저 내장 Web Crypto API 로 즉시 결과가 만들어집니다.","url":"https://__SITE_URL__/tools/util/qr#step2"},{"@type":"HowToStep","position":3,"name":"복사·저장","text":"결과를 클립보드에 복사하거나 파일로 저장합니다.","url":"https://__SITE_URL__/tools/util/qr#step3"}]} as const;

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
