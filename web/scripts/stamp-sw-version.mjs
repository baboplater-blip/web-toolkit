#!/usr/bin/env node
/**
 * Service Worker 의 SW_VERSION 을 빌드마다 자동 갱신.
 *
 * 이유: SW_VERSION 이 하드코딩된 문자열이면 코드 수정·배포해도 사용자 브라우저의
 * 옛 SW 가 그대로 유지되어 옛 응답을 캐시한다. 새 버전을 받으려면 매번 수동 bump
 * 필요 — 비효율적.
 *
 * 빌드 시 git short SHA + 빌드 timestamp 로 자동 갱신해 매 배포마다
 * 새 SW 로 인식 → activate 단계에서 옛 캐시 자동 청소 + 즉시 교체.
 *
 * 환경:
 *   - prebuild 단계에서 실행
 *   - git 정보 없으면 timestamp 만 사용 (fallback)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SW_PATH = join(__dirname, '..', 'public', 'sw.js');

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function buildVersion() {
  const sha = getGitSha();
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMM
  return sha ? `webtoolkit-sw-${sha}-${ts}` : `webtoolkit-sw-${ts}`;
}

const sw = readFileSync(SW_PATH, 'utf8');
const newVersion = buildVersion();
const updated = sw.replace(
  /const SW_VERSION = '[^']+';/,
  `const SW_VERSION = '${newVersion}';`,
);

if (updated === sw) {
  console.error('[stamp-sw-version] SW_VERSION 상수를 찾지 못했습니다.');
  process.exit(1);
}

writeFileSync(SW_PATH, updated);
console.log(`[stamp-sw-version] SW_VERSION → ${newVersion}`);
