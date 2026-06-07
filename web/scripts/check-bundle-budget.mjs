#!/usr/bin/env node
/**
 * Bundle budget gate (Phase δ) — server-less, pre-merge.
 *
 * The Lighthouse Nightly workflow detects regressions *after* deploy, against
 * the live site. This gate runs in CI on every push/PR against the static
 * `out/` build and FAILS before a heavy dependency can ship: it measures the
 * gzipped First-Load JS (every `<script src>` the page boots with) for a set of
 * representative pages and asserts each stays under budget.
 *
 * Budgets are regression guards calibrated ~8% above the 2026-06-07 baseline
 * (tool pages ≈ 334 KB gzip, hubs ≈ 330 KB). Raise them deliberately — a bump
 * here should be a conscious decision recorded in the commit, not silent drift.
 *
 * Usage: node scripts/check-bundle-budget.mjs   (run after `npm run build`)
 */

import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'out');

// 대표 페이지 + 카테고리별 1개. 라벨, html 경로(out 기준), 예산(gzip KB).
// 2026-06-07: 4개국어(ko·en·ja·zh) 다국어 SEO 데이터 완성으로 베이스라인 상향.
// CommandPalette·ToolConvertLinks(클라이언트, 전 페이지/도구 페이지 마운트)가
// convert-matrix(FORMATS)·use-cases(USE_CASES)·ko-compares 를 import 하면서
// 다국어 본문이 공유 청크에 포함된다. zh 추가로 +약 15KB(gzip).
// TODO(perf): 두 클라이언트 컴포넌트를 다국어 프로즈에서 분리(경량 인덱스 import)해
//             원복 추진 — 별도 perf 라운드. 분리 후 이 예산을 다시 내릴 것.
const TOOL_BUDGET = 385; // 도구 페이지 (다국어 4개국 베이스라인)
const HUB_BUDGET = 380; // 허브·인덱스·홈 (다국어 4개국 베이스라인)

const SAMPLES = [
  { label: 'home /', html: 'index.html', budget: HUB_BUDGET },
  { label: 'tools hub', html: 'tools.html', budget: HUB_BUDGET },
  { label: 'guide index', html: 'guide.html', budget: HUB_BUDGET },
  { label: 'pdf/merge', html: 'tools/pdf/merge.html', budget: TOOL_BUDGET },
  { label: 'image/favicon', html: 'tools/image/favicon.html', budget: TOOL_BUDGET },
  { label: 'video/crop', html: 'tools/video/crop.html', budget: TOOL_BUDGET },
  { label: 'audio/tone', html: 'tools/audio/tone.html', budget: TOOL_BUDGET },
  { label: 'dev/base-converter', html: 'tools/dev/base-converter.html', budget: TOOL_BUDGET },
  { label: 'util/percentage', html: 'tools/util/percentage.html', budget: TOOL_BUDGET },
  { label: 'security/text-hash', html: 'tools/security/text-hash.html', budget: TOOL_BUDGET },
];

/** Sum gzipped bytes of every initial <script src="/_next/...js"> in a page. */
function firstLoadGzip(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const refs = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
  const uniq = [...new Set(refs)];
  let gz = 0;
  let missing = 0;
  for (const ref of uniq) {
    const file = join(OUT, ref.replace(/^\//, ''));
    if (!existsSync(file)) {
      missing++;
      continue;
    }
    gz += gzipSync(readFileSync(file)).length;
  }
  return { chunks: uniq.length, gzipKB: gz / 1024, missing };
}

function main() {
  if (!existsSync(OUT)) {
    console.error(`✗ out/ 가 없습니다. 먼저 \`npm run build\` 를 실행하세요. (${OUT})`);
    process.exit(2);
  }

  let failed = 0;
  let skipped = 0;
  console.log('번들 예산 게이트 — First-Load JS (gzip)');
  console.log('─'.repeat(64));
  console.log(`${'페이지'.padEnd(22)}${'gzip'.padStart(10)}${'예산'.padStart(9)}   결과`);
  console.log('─'.repeat(64));

  for (const s of SAMPLES) {
    const htmlPath = join(OUT, s.html);
    if (!existsSync(htmlPath)) {
      console.log(`${s.label.padEnd(22)}${'—'.padStart(10)}${(s.budget + 'KB').padStart(9)}   SKIP (없음)`);
      skipped++;
      continue;
    }
    const { gzipKB } = firstLoadGzip(htmlPath);
    const over = gzipKB > s.budget;
    if (over) failed++;
    const mark = over ? '❌ 초과' : '✅';
    console.log(
      `${s.label.padEnd(22)}${(gzipKB.toFixed(1) + 'KB').padStart(10)}${(s.budget + 'KB').padStart(9)}   ${mark}`,
    );
  }

  console.log('─'.repeat(64));
  if (failed > 0) {
    console.error(`\n✗ ${failed}개 페이지가 번들 예산을 초과했습니다. 무거운 의존성이 공유 청크에 들어갔는지 확인하세요.`);
    console.error('  의도된 증가라면 scripts/check-bundle-budget.mjs 의 TOOL_BUDGET/HUB_BUDGET 를 커밋과 함께 올리세요.');
    process.exit(1);
  }
  console.log(`\n✓ 통과 (${SAMPLES.length - skipped}개 페이지 예산 내${skipped ? `, ${skipped}개 스킵` : ''}).`);
}

main();
