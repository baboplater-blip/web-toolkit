#!/usr/bin/env node
/**
 * 각 도구 페이지 폴더에 metadata 전용 layout.tsx 를 자동 생성.
 *
 * 이유: page.tsx 가 'use client' 라 metadata export 가 불가능.
 * App Router 의 layout 은 server component 라 metadata 를 가질 수 있다.
 *
 * registry.ts 의 ToolMeta 목록을 파싱해서 각 도구의 href 폴더에
 * layout.tsx 를 작성한다. 이미 layout.tsx 가 있고 자동 생성 마커가 있으면
 * 덮어쓰고, 없으면 건너뛴다 (사용자가 직접 작성한 layout 보호).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, '..');
const REGISTRY_PATH = join(WEB_ROOT, 'src/lib/tools/registry.ts');
const APP_TOOLS = join(WEB_ROOT, 'src/app/tools');

const MARKER = '/* auto-generated metadata layout — generate-tool-metadata.mjs */';
const SITE_NAME = 'Web Toolkit';

function parseRegistry() {
  const src = readFileSync(REGISTRY_PATH, 'utf-8');
  const tools = [];
  const re = /\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*description:\s*'([^']+)',\s*href:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    tools.push({ id: m[1], title: m[2], description: m[3], href: m[4] });
  }
  return tools;
}

function hrefToFsPath(href) {
  // /tools/text/case → src/app/tools/text/case
  const rel = href.replace(/^\//, '');
  return join(WEB_ROOT, 'src/app', rel);
}

function renderLayout(tool) {
  const safeTitle = tool.title.replace(/`/g, '\\`');
  const safeDesc = tool.description.replace(/`/g, '\\`');
  return `${MARKER}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: \`${safeTitle} — ${SITE_NAME}\`,
  description: \`${safeDesc}\`,
  openGraph: {
    title: \`${safeTitle} — ${SITE_NAME}\`,
    description: \`${safeDesc}\`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: \`${safeTitle} — ${SITE_NAME}\`,
    description: \`${safeDesc}\`,
  },
};

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
}

function main() {
  const tools = parseRegistry();
  let written = 0;
  let skipped = 0;
  let preserved = 0;

  for (const tool of tools) {
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
  console.log(`  ✗ 건너뜀 (폴더 없음): ${skipped}`);
}

main();
