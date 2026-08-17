import type { Metadata } from 'next';
import { TOOLS } from '@/lib/tools/registry';
import { ZhToolsCatalog } from '@/components/zh/ZhToolsCatalog';

/**
 * Simplified Chinese /zh/tools — interactive catalog.
 *
 * This server file owns the metadata and JSON-LD; the searchable/filterable
 * grid is the client component <ZhToolsCatalog>. Static export prerenders the
 * catalog's initial state (all tools, no query) into the HTML, so the full
 * list stays crawlable while search and filtering hydrate on top.
 */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const READY_COUNT = TOOLS.filter((t) => t.status === 'ready').length;

export const metadata: Metadata = {
  title: '全部工具 — Web Toolkit',
  description: `PDF、图片、视频、音频、OCR、AI 等 ${READY_COUNT} 款免费浏览器工具。可搜索与筛选，全部在客户端处理，无需上传。`,
  alternates: {
    canonical: '/zh/tools',
    languages: {
      'ko-KR': '/tools',
      en: '/en/tools',
      ja: '/ja/tools',
      zh: '/zh/tools',
      'x-default': '/tools',
    },
  },
  openGraph: {
    title: '全部工具 — Web Toolkit',
    description: `${READY_COUNT} 款免费、在浏览器内完成的工具。无需上传、无需注册。`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'zh_CN',
    url: '/zh/tools',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit 目录' },
    ],
  },
};

const COLLECTION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '全部工具 — Web Toolkit',
  description: `${READY_COUNT} 款免费、在浏览器内完成的工具。`,
  inLanguage: 'zh',
  isPartOf: { '@type': 'WebSite', name: 'Web Toolkit', url: SITE_URL },
  url: `${SITE_URL}/zh/tools`,
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/zh` },
    { '@type': 'ListItem', position: 2, name: '工具', item: `${SITE_URL}/zh/tools` },
  ],
};

export default function ChineseToolsHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      <ZhToolsCatalog readyCount={READY_COUNT} />
    </>
  );
}
