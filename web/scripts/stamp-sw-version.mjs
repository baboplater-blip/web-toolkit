#!/usr/bin/env node
/**
 * Service Worker 의 SW_VERSION 을 빌드마다 자동 갱신.
 *
 * 이유: SW_VERSION 이 하드코딩된 문자열이면 코드 수정·배포해도 사용자 브라우저의
 * 옛 SW 가 그대로 유지되어 옛 응답을 캐시한다. 새 버전을 받으려면 매번 수동 bump
 * 필요 — 비효율적.
 *
 * 빌드 시 git short SHA 로 자동 갱신해 커밋이 바뀔 때마다 새 SW 로 인식
 * → activate 단계에서 옛 캐시 자동 청소 + 즉시 교체.
 *
 * 결정성: 버전은 SHA 만 사용한다. 과거엔 timestamp 를 덧붙였으나, 같은 커밋을
 * 재빌드할 때마다 sw.js 가 달라져(비결정적) 불필요한 SW 교체·캐시 무효화가
 * 발생했다. SHA 만 쓰면 같은 커밋은 같은 sw.js → 재현 가능한 빌드.
 *
 * 환경:
 *   - prebuild 단계에서 실행
 *   - git 정보 없으면 timestamp 로 폴백 (CI 외 환경·shallow 체크아웃 대비)
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
  // SHA 가 있으면 SHA 만 사용 → 같은 커밋은 항상 같은 버전(결정적).
  // SHA 가 없을 때만 timestamp 로 폴백.
  if (sha) return `webtoolkit-sw-${sha}`;
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMM
  return `webtoolkit-sw-${ts}`;
}

const sw = readFileSync(SW_PATH, 'utf8');
const SW_VERSION_RE = /const SW_VERSION = '[^']+';/;

// 상수 자체가 없으면 진짜 오류(빌드 중단). 단, 이미 같은 버전이라 치환이
// no-op 인 경우는 정상(같은 커밋 재빌드) — 결정적 빌드라 오히려 기대 동작이다.
if (!SW_VERSION_RE.test(sw)) {
  console.error('[stamp-sw-version] SW_VERSION 상수를 찾지 못했습니다.');
  process.exit(1);
}

const newVersion = buildVersion();
const updated = sw.replace(SW_VERSION_RE, `const SW_VERSION = '${newVersion}';`);

if (updated === sw) {
  console.log(`[stamp-sw-version] SW_VERSION 이미 최신(${newVersion}) — 갱신 생략`);
} else {
  writeFileSync(SW_PATH, updated);
  console.log(`[stamp-sw-version] SW_VERSION → ${newVersion}`);
}
