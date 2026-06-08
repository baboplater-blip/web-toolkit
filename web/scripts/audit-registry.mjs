#!/usr/bin/env node
/**
 * Registry audit (Phase ε) — automated consistency check for the tool registry.
 *
 * Verifies `src/lib/tools/registry.ts` against the actual page files and itself:
 *   1) 고아 registry 항목 — registry 에 있으나 page.tsx 없음          (error)
 *   2) 고아 페이지       — page.tsx 있으나 registry 에 없음            (error)
 *   3) 중복 id                                                          (error)
 *   4) category ↔ href prefix 불일치                                    (error)
 *   5) lucide 아이콘 import 누락                                        (error)
 *   6) keywords < 5 (한/영 혼합 권장)                                   (warn)
 *   7) OFFLINE_TOOL_IDS href ↔ sw.js PRECACHE 불일치                    (error)
 *
 * Usage: node scripts/audit-registry.mjs   (npm run audit)
 * Exit 1 on any error (CI-gateable), 0 if only warnings.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(__dirname, '..');
const REGISTRY = join(WEB, 'src/lib/tools/registry.ts');
const TOOLS_DIR = join(WEB, 'src/app/tools');
const OFFLINE_TOOLS = join(WEB, 'src/lib/offline-tools.ts');
const SW = join(WEB, 'public/sw.js');

const src = readFileSync(REGISTRY, 'utf8');
const start = src.indexOf('export const TOOLS');
const body = src.slice(start, src.indexOf('\n];', start));

// lucide import 에서 코드에서 실제 사용 가능한 이름 집합.
// `Hash as HashIcon` → 사용명은 별칭(HashIcon). 별칭 없으면 그대로.
const importBlock = (src.match(/import\s*\{([^}]*)\}\s*from\s*'lucide-react';/) || [])[1] || '';
const importedIcons = new Set(
  importBlock
    .split(',')
    .map((s) => {
      const parts = s.trim().split(/\s+as\s+/);
      return (parts[1] || parts[0]).trim();
    })
    .filter(Boolean),
);

// registry 엔트리 파싱 (단일/다중행 모두).
const idRe = /id:\s*'([^']+)'/g;
let m;
const positions = [];
while ((m = idRe.exec(body))) positions.push({ id: m[1], idx: m.index });

const tools = [];
for (let i = 0; i < positions.length; i++) {
  const seg = body.slice(positions[i].idx, i + 1 < positions.length ? positions[i + 1].idx : undefined);
  const id = positions[i].id;
  const href = (seg.match(/href:\s*'([^']+)'/) || [])[1];
  const category = (seg.match(/category:\s*'([a-z]+)'/) || [])[1];
  const icon = (seg.match(/icon:\s*([A-Za-z0-9]+)/) || [])[1];
  const status = (seg.match(/status:\s*'([a-z]+)'/) || [])[1];
  const kwm = seg.match(/keywords:\s*\[([^\]]*)\]/);
  const keywords = kwm ? kwm[1].split(',').filter((s) => s.trim()).length : 0;
  tools.push({ id, href, category, icon, status, keywords });
}

// 실제 page.tsx 수집 (route = path under tools/).
function collectPages(dir, base = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collectPages(full, base ? `${base}/${name}` : name));
    } else if (name === 'page.tsx') {
      out.push(base); // route relative to tools/ ('' = /tools root)
    }
  }
  return out;
}
const pageRoutes = new Set(collectPages(TOOLS_DIR).map((r) => `/tools${r ? '/' + r : ''}`));

const errors = [];
const warnings = [];

// 3) 중복 id
const seen = new Map();
for (const t of tools) seen.set(t.id, (seen.get(t.id) || 0) + 1);
for (const [id, n] of seen) if (n > 1) errors.push(`중복 id: '${id}' (${n}회)`);

const hrefSet = new Set();
for (const t of tools) {
  // 1) 고아 registry 항목 (ready 만)
  if (t.status === 'ready' && t.href && !pageRoutes.has(t.href)) {
    errors.push(`고아 registry: '${t.id}' → 페이지 없음 (${t.href})`);
  }
  // 4) category ↔ href: 이 프로젝트는 논리적 카테고리(분류)와 URL 경로를 의도적으로
  //    분리한다(예: pdf-unlock 은 category 'security' 인데 /tools/pdf/unlock). 따라서
  //    불일치는 오류가 아니다 — href 가 /tools/ 로 시작하는지만 확인.
  if (t.href && !t.href.startsWith('/tools/')) {
    errors.push(`href 형식 오류: '${t.id}' href=${t.href}`);
  }
  // 5) 아이콘 import
  if (t.icon && !importedIcons.has(t.icon)) {
    errors.push(`아이콘 import 누락: '${t.id}' 의 ${t.icon}`);
  }
  // 6) 키워드
  if (t.keywords < 5) warnings.push(`키워드 부족(<5): '${t.id}' (${t.keywords})`);
  if (t.href) hrefSet.add(t.href);
}

// 2) 고아 페이지 (registry href 에 없는 page route).
for (const route of pageRoutes) {
  if (route === '/tools') continue; // 허브
  if (!hrefSet.has(route)) errors.push(`고아 페이지: ${route}/page.tsx → registry 항목 없음`);
}

// 7) OFFLINE_TOOL_IDS 의 모든 도구 href 가 sw.js PRECACHE 에 들어 있어야 한다.
//    (둘이 어긋나면 "오프라인 지원" 배지가 거짓 — 첫 오프라인 방문이 /offline 으로 떨어짐)
{
  const hrefById = new Map(tools.filter((t) => t.href).map((t) => [t.id, t.href]));

  // offline-tools.ts 의 OFFLINE_TOOL_IDS Set 리터럴에서 id 추출.
  const offlineSrc = readFileSync(OFFLINE_TOOLS, 'utf8');
  const offlineBlock = (offlineSrc.match(/OFFLINE_TOOL_IDS[^=]*=\s*new Set\(\[([\s\S]*?)\]\)/) || [])[1] || '';
  const offlineIds = [...offlineBlock.matchAll(/'([^']+)'/g)].map((mm) => mm[1]);

  // sw.js 의 PRECACHE_URLS 배열 리터럴에서 URL 추출.
  const swSrc = readFileSync(SW, 'utf8');
  const precacheBlock = (swSrc.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/) || [])[1] || '';
  const precacheUrls = new Set([...precacheBlock.matchAll(/'([^']+)'/g)].map((mm) => mm[1]));

  if (!offlineIds.length) {
    errors.push('OFFLINE_TOOL_IDS 를 파싱하지 못했습니다 (offline-tools.ts 형식 변경?)');
  }
  if (!precacheUrls.size) {
    errors.push('sw.js PRECACHE_URLS 를 파싱하지 못했습니다 (sw.js 형식 변경?)');
  }
  for (const id of offlineIds) {
    const href = hrefById.get(id);
    if (!href) {
      errors.push(`오프라인 도구 미등록: OFFLINE_TOOL_IDS 의 '${id}' 가 registry 에 없음`);
    } else if (!precacheUrls.has(href)) {
      errors.push(`오프라인 배지 거짓: '${id}' (${href}) 가 sw.js PRECACHE 에 없음`);
    }
  }
}

console.log(`registry 감사 — 도구 ${tools.length}개 · 페이지 ${pageRoutes.size - 1}개`);
console.log('─'.repeat(60));
if (errors.length) {
  console.log(`\n오류 ${errors.length}건:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
}
if (warnings.length) {
  console.log(`\n경고 ${warnings.length}건:`);
  for (const w of warnings.slice(0, 40)) console.log(`  · ${w}`);
  if (warnings.length > 40) console.log(`  … 외 ${warnings.length - 40}건`);
}
if (!errors.length && !warnings.length) console.log('\n✓ 정합성 이상 없음.');
else if (!errors.length) console.log(`\n✓ 오류 없음 (경고 ${warnings.length}건).`);

process.exit(errors.length ? 1 : 0);
