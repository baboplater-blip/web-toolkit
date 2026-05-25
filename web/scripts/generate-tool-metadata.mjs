#!/usr/bin/env node
/**
 * 각 도구 페이지 폴더에 metadata 전용 layout.tsx 를 자동 생성.
 *
 * page.tsx 가 'use client' 라 metadata export 가 불가능하므로
 * server component 인 layout.tsx 에 metadata + JSON-LD 구조화 데이터를
 * 함께 박아둔다.
 *
 * registry.ts 의 ToolMeta 목록을 파싱해 각 도구의 href 폴더에
 * layout.tsx 를 작성한다. 이미 layout.tsx 가 있고 자동 생성 마커가 있으면
 * 덮어쓰고, 없으면 건너뛴다 (사용자가 직접 작성한 layout 보호).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL_OG_DIR_REL = 'public/og/tools';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, '..');
const REGISTRY_PATH = join(WEB_ROOT, 'src/lib/tools/registry.ts');

const MARKER = '/* auto-generated metadata layout — generate-tool-metadata.mjs */';
const SITE_NAME = 'Web Toolkit';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agent-control-panel-phi.vercel.app').replace(/\/$/, '');

const CATEGORY_LABEL = {
  image: '이미지',
  pdf: 'PDF',
  video: '비디오',
  gif: 'GIF',
  audio: '오디오',
  docs: '문서 변환',
  text: '텍스트',
  dev: '개발자',
  util: '유틸',
  security: '보안',
  ai: 'AI',
};

const APPLICATION_CATEGORY = {
  image: 'MultimediaApplication',
  pdf: 'BusinessApplication',
  video: 'MultimediaApplication',
  gif: 'MultimediaApplication',
  audio: 'MultimediaApplication',
  docs: 'BusinessApplication',
  text: 'UtilitiesApplication',
  dev: 'DeveloperApplication',
  util: 'UtilitiesApplication',
  security: 'SecurityApplication',
  ai: 'UtilitiesApplication',
};

/**
 * registry.ts 에서 ToolMeta 객체 블록을 추출한다.
 *
 * 각 객체 블록 ({ id: '...', ... }) 안에서 단순 키들을 정규식으로 뽑는다.
 * keywords 는 한 줄에 들어오는 경우와 여러 줄에 걸친 경우 모두 처리.
 */
function parseRegistry() {
  const src = readFileSync(REGISTRY_PATH, 'utf-8');
  const tools = [];

  // ToolMeta 객체 블록을 큰 단위로 분리
  const blockRe = /\{\s*id:\s*'([^']+)',[\s\S]*?\n\s*\},?/g;
  let match;
  while ((match = blockRe.exec(src)) !== null) {
    const block = match[0];
    const id = match[1];

    const title = pickString(block, 'title');
    const description = pickString(block, 'description');
    const href = pickString(block, 'href');
    const category = pickString(block, 'category');
    const status = pickString(block, 'status');
    const keywords = pickArray(block, 'keywords');

    if (!title || !description || !href || !category) continue;

    tools.push({ id, title, description, href, category, status, keywords });
  }

  return tools;
}

function pickString(block, key) {
  const re = new RegExp(`${key}:\\s*'([^']*)'`);
  const m = block.match(re);
  return m ? m[1] : null;
}

function pickArray(block, key) {
  // 한 줄 배열 [...] 또는 여러 줄 배열 [\n ... \n] 모두 처리
  const re = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`);
  const m = block.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function hrefToFsPath(href) {
  // /tools/text/case → src/app/tools/text/case
  const rel = href.replace(/^\//, '');
  return join(WEB_ROOT, 'src/app', rel);
}

function buildJsonLd(tool) {
  const url = `${SITE_URL}${tool.href}`;
  const appCategory = APPLICATION_CATEGORY[tool.category] ?? 'UtilitiesApplication';
  const categoryLabel = CATEGORY_LABEL[tool.category] ?? tool.category;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    description: tool.description,
    url,
    applicationCategory: appCategory,
    applicationSubCategory: categoryLabel,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas.',
    inLanguage: 'ko-KR',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

function renderLayout(tool) {
  const safeTitle = tool.title.replace(/`/g, '\\`');
  const safeDesc = tool.description.replace(/`/g, '\\`');
  const categoryLabel = CATEGORY_LABEL[tool.category] ?? tool.category;
  const baseKeywords = [
    ...(tool.keywords ?? []),
    categoryLabel,
    '브라우저 도구',
    '무료',
    '온라인',
    'no upload',
  ];
  // 중복 제거 + JSON 직렬화
  const dedupedKeywords = [...new Set(baseKeywords.filter(Boolean))];
  const keywordsLiteral = JSON.stringify(dedupedKeywords);
  const jsonLdLiteral = JSON.stringify(buildJsonLd(tool));
  // 도구별 OG PNG 가 commit 되어 있으면 그것을 우선, 없으면 카테고리 폴백
  const toolOgPath = join(WEB_ROOT, TOOL_OG_DIR_REL, `${tool.id}.png`);
  const ogImagePath = existsSync(toolOgPath)
    ? `/og/tools/${tool.id}.png`
    : `/og/${tool.category}.png`;

  return `${MARKER}
import type { Metadata } from 'next';

const TITLE = \`${safeTitle} — ${SITE_NAME}\`;
const DESCRIPTION = \`${safeDesc}\`;
const URL_PATH = '${tool.href}';
const OG_IMAGE = '${ogImagePath}';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ${keywordsLiteral},
  alternates: { canonical: URL_PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: '${SITE_NAME}',
    locale: 'ko_KR',
    url: URL_PATH,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: \`${safeTitle} — ${categoryLabel} 도구\`,
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

const JSON_LD = ${jsonLdLiteral} as const;

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
`;
}

function main() {
  const tools = parseRegistry();
  let written = 0;
  let skipped = 0;
  let preserved = 0;

  for (const tool of tools) {
    if (tool.status === 'planned') {
      skipped++;
      continue;
    }
    const dir = hrefToFsPath(tool.href);
    if (!existsSync(dir)) {
      console.warn(`!! 폴더 없음: ${dir} (${tool.id})`);
      skipped++;
      continue;
    }
    const layoutPath = join(dir, 'layout.tsx');
    if (existsSync(layoutPath)) {
      const existing = readFileSync(layoutPath, 'utf-8');
      if (!existing.startsWith(MARKER)) {
        console.warn(`-- 수동 작성된 layout 보존: ${layoutPath}`);
        preserved++;
        continue;
      }
    }
    writeFileSync(layoutPath, renderLayout(tool), 'utf-8');
    written++;
  }

  console.log(`\n도구 ${tools.length}개 중`);
  console.log(`  ✔ 생성/갱신: ${written}`);
  console.log(`  ↩ 보존 (수동 layout): ${preserved}`);
  console.log(`  ✗ 건너뜀 (폴더 없음/planned): ${skipped}`);
}

main();
