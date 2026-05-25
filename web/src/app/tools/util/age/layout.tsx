/* auto-generated metadata layout — generate-tool-metadata.mjs */
import type { Metadata } from 'next';

const TITLE = `나이 계산기 — Web Toolkit`;
const DESCRIPTION = `만/연/세는 나이 동시 계산 + 마일스톤 일수.`;
const URL_PATH = '/tools/util/age';
const OG_IMAGE = '/og/util.png';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["나이","age","만나이","세는나이","연나이","생일","birthday","유틸","브라우저 도구","무료","온라인","no upload"],
  alternates: { canonical: URL_PATH },
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
        alt: `나이 계산기 — 유틸 도구`,
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

const JSON_LD = {"@context":"https://schema.org","@type":"WebApplication","name":"나이 계산기","description":"만/연/세는 나이 동시 계산 + 마일스톤 일수.","url":"https://agent-control-panel-phi.vercel.app/tools/util/age","applicationCategory":"UtilitiesApplication","applicationSubCategory":"유틸","operatingSystem":"Any","browserRequirements":"Requires JavaScript and HTML5 Canvas.","inLanguage":"ko-KR","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"publisher":{"@type":"Organization","name":"Web Toolkit","url":"https://agent-control-panel-phi.vercel.app"}} as const;

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {children}
    </>
  );
}
