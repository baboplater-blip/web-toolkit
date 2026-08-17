import type { Metadata } from 'next';
import { TOOLS } from '@/lib/tools/registry';
import { EnToolsCatalog } from '@/components/en/EnToolsCatalog';

/**
 * English /en/tools — interactive catalog.
 *
 * This server file owns the metadata and JSON-LD; the searchable/filterable
 * grid is the client component <EnToolsCatalog>. Static export prerenders the
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
  title: 'All Tools — Web Toolkit',
  description: `${READY_COUNT} free browser tools across PDF, image, video, audio, OCR, AI, and more. Search and filter — all client-side, no upload.`,
  alternates: {
    canonical: '/en/tools',
    languages: {
      'ko-KR': '/tools',
      en: '/en/tools',
      'x-default': '/tools',
    },
  },
  openGraph: {
    title: 'All Tools — Web Toolkit',
    description: `${READY_COUNT} free, browser-only tools. No upload, no signup.`,
    type: 'website',
    siteName: 'Web Toolkit',
    locale: 'en_US',
    url: '/en/tools',
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: 'Web Toolkit catalog' },
    ],
  },
};

const COLLECTION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'All Tools — Web Toolkit',
  description: `${READY_COUNT} free browser-only tools.`,
  inLanguage: 'en',
  isPartOf: { '@type': 'WebSite', name: 'Web Toolkit', url: SITE_URL },
  url: `${SITE_URL}/en/tools`,
};

const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Web Toolkit', item: `${SITE_URL}/en` },
    { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/en/tools` },
  ],
};

export default function EnglishToolsHubPage() {
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
      <EnToolsCatalog readyCount={READY_COUNT} />
    </>
  );
}
