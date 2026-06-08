import type { Metadata } from 'next';
import { TOOLS } from '@/lib/tools/registry';
import { JaToolsCatalog } from '@/components/ja/JaToolsCatalog';

/**
 * Japanese /ja/tools — interactive catalog.
 *
 * This server file owns the metadata and JSON-LD; the searchable/filterable
 * grid is the client component <JaToolsCatalog>. Static export prerenders the
 * catalog's initial state (all tools, no query) into the HTML, so the full
 * list stays crawlable while search and filtering hydrate on top.
 */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-toolkit.vercel.app'
)
  .replace(/^﻿/, '')
  .replace(/\/$/, '');

const READY_COUNT = TOOLS.filter((t) => t.status === 'ready').length;

export const metadata: Metadata = {
  title: 'すべてのツール — Web Toolkit',
  description: `PDF・画像・動画・音声・OCR・AIなど${READY_COUNT}個の無料ブラウザツール。検索・絞り込みが可能で、すべてクライアント側処理、アップロード不要。`,
  alternates: {
    canonical: '/ja/tools',
    languages: {
      'ko-KR': '/tools',
      en: '/en/tools',
      ja: '/ja/tools',
      'x-default': '/tools',
    },
  },
  openGraph: {
    title: 'すべてのツール — Web Toolkit',
    description: `${READY_COUNT}個の無料・ブラウザ完結ツール。アップロード不要・登録不要。`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'ja_JP',
    url: '/ja/tools',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit カタログ' },
    ],
  },
};

const COLLECTION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'すべてのツール — Web Toolkit',
  description: `${READY_COUNT}個の無料・ブラウザ完結ツール。`,
  inLanguage: 'ja',
  isPartOf: { '@type': 'WebSite', name: 'Web Toolkit', url: SITE_URL },
  url: `${SITE_URL}/ja/tools`,
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/ja` },
    { '@type': 'ListItem', position: 2, name: 'ツール', item: `${SITE_URL}/ja/tools` },
  ],
};

export default function JapaneseToolsHubPage() {
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
      <JaToolsCatalog readyCount={READY_COUNT} />
    </>
  );
}
