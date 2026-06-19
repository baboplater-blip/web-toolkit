/**
 * Web Toolkit — Service Worker
 *
 * 담당:
 *   1) PWA 홈화면 설치 스코프 확보
 *   2) 오프라인 첫 로딩 캐시 — 도구 페이지의 즉시 진입 경험
 *   3) 옛 ACP 시절 캐시(채팅·대시보드·하네스) 정리
 *
 * 전략:
 *   - 페이지(navigate): network-first → 실패 시 캐시 → 오프라인 페이지
 *   - 정적 자산(_next/static): cache-first + 백그라운드 갱신 (SWR)
 *   - 아이콘·매니페스트: cache-first
 *   - RUNTIME 캐시는 최대 80개 항목 (LRU)
 *   - ASSET 캐시는 최대 250개 항목 (LRU) — hash 자산 누적 폭주 방지
 *
 * 캐시 버전 정책:
 *   - STATIC/ASSET 는 SW_VERSION 으로 버저닝 → 배포 시 옛 셸·옛 hash 자산 청소
 *   - RUNTIME 은 버전 비의존(webtoolkit-runtime) → 배포해도 사용자가 받아둔 오프라인
 *     페이지가 유지됨. activate 청소가 webtoolkit-sw- prefix 만 지우므로 살아남는다.
 *
 * 미션 변경(2026-05-22): agent-control-panel → web-toolkit.
 */
/* eslint-disable */

const SW_VERSION = 'webtoolkit-sw-e77650a';
const STATIC_CACHE = `${SW_VERSION}-static`;
// RUNTIME 은 의도적으로 버전 비의존 — 배포 간 오프라인 페이지 보존.
const RUNTIME_CACHE = 'webtoolkit-runtime';
const ASSET_CACHE = `${SW_VERSION}-asset`;

const RUNTIME_MAX_ENTRIES = 80;
const ASSET_MAX_ENTRIES = 250;

/**
 * 사전 캐시 대상.
 *   - 핵심 셸: 랜딩 / 도구 허브 / 오프라인 폴백 / 매니페스트 / 아이콘
 *   - 인기 경량 도구 HTML — WASM 없이 즉시 동작하거나 의존성이 작은 것 우선
 *   - HTML 만 미리 받고, _next/static chunks 는 첫 온라인 방문 시 runtime 캐시에서 자연 누적
 *   - cache.add 는 실패해도 install 자체는 통과(allSettled) — 한 URL 실패로 전체 PWA 가
 *     깨지지 않도록.
 */
const PRECACHE_URLS = [
  // 셸
  '/',
  '/tools',
  '/settings',
  '/offline',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  // 광고 설정 — 첫 방문에도 LCP 임계 경로에서 즉시 사용 가능
  '/ads-config.json',
  // 광고 이미지 (data URL 분리 후) — top 은 LCP 후보라 사전 캐시 중요
  '/ads/top.webp',
  '/ads/sidebarLeft.webp',
  '/ads/sidebarRight.webp',
  // 기본 OG (공유 카드 라이브 캐시)
  '/og/default.png',
  // 영문 진입점 — 비한국어 사용자도 오프라인 셸 확보
  '/en',
  '/en/tools',
  // 오프라인 도구 — 외부 WASM/CDN 다운로드 없이 동작하는 경량 도구.
  // src/lib/offline-tools.ts 의 OFFLINE_TOOL_IDS 와 동기화 유지.
  // (HTML 만 사전 캐시 — _next/static chunk 는 첫 온라인 방문 시 runtime 누적)
  '/tools/util/qr',
  '/tools/util/barcode',
  '/tools/util/base64',
  '/tools/util/json',
  '/tools/util/palette',
  '/tools/util/hash',
  '/tools/util/unit',
  '/tools/util/percentage',
  '/tools/util/age',
  '/tools/util/dday',
  '/tools/dev/jwt',
  '/tools/dev/uuid',
  '/tools/dev/password',
  '/tools/dev/url',
  '/tools/dev/url-parser',
  '/tools/dev/color',
  '/tools/dev/timestamp',
  '/tools/dev/lorem',
  '/tools/dev/cron',
  '/tools/dev/sql-format',
  '/tools/dev/jsonpath',
  '/tools/dev/json-xml',
  '/tools/dev/md-table',
  '/tools/text/regex',
  '/tools/text/diff',
  '/tools/text/count',
  '/tools/text/case',
  '/tools/text/sort',
  '/tools/text/html-entities',
  '/tools/docs/csv-json',
  '/tools/docs/yaml-json',
  '/tools/security/totp',
  '/tools/security/rsa-keypair',
  '/tools/security/text-encrypt',
  '/tools/security/file-encrypt',
  '/tools/security/redact',
  // 오피스 계산기·생성기 (순수 JS/Canvas, 외부 다운로드 없음)
  '/tools/util/salary',
  '/tools/util/severance',
  '/tools/util/leave',
  '/tools/util/vat',
  '/tools/util/vcard-qr',
  '/tools/image/seal',
  '/tools/image/id-photo',
  '/tools/docs/excel-formula',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})),
      );
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k.startsWith('acp-sw-') ||
              (k.startsWith('webtoolkit-sw-') && !k.startsWith(SW_VERSION)),
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isNextStatic(path) {
  return path.startsWith('/_next/static/');
}

function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.startsWith('/icon-') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path === '/manifest.json' ||
    path === '/ads-config.json' ||
    path.endsWith('.woff') ||
    path.endsWith('.woff2')
  );
}

function isLegacyRoute(pathname) {
  return (
    pathname === '/chat' ||
    pathname.startsWith('/chat/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/harnesses' ||
    pathname.startsWith('/harnesses/') ||
    pathname === '/share' ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/api/')
  );
}

/** 캐시 크기 제한 — 오래된 항목부터 제거 (단순 FIFO, RUNTIME·ASSET 공용) */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status < 400) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
      trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline');
    if (offline) return offline;
    const fallback = await caches.match('/tools');
    if (fallback) return fallback;
    return new Response('오프라인', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/** _next/static 자산: 캐시 우선 (hash 가 박힌 immutable URL — cache miss 시만 fetch) */
async function staticAssetCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
      // hash 자산은 무한 누적될 수 있으므로 LRU 상한 적용.
      trimCache(cacheName, ASSET_MAX_ENTRIES).catch(() => {});
    }
    return response;
  } catch {
    return new Response('', { status: 504 });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    return new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(request.url)) return;

  // RSC payload 는 SW 가 건드리지 않음
  if (url.searchParams.has('_rsc')) return;

  // 옛 라우트(채팅·대시보드·API 등) → 캐시된 /tools 셸로 응답.
  // 주의: navigate 요청에 redirect 타입 Response 로 응답하면 브라우저가 거부해
  // 네트워크 오류가 난다(respondWith 규약). 그래서 Response.redirect 대신
  // /tools 셸을 직접 서빙해 옛 홈화면 PWA 사용자를 안전하게 보호한다.
  if (isLegacyRoute(url.pathname)) {
    event.respondWith(
      caches.match('/tools').then((cached) => cached || fetch('/tools')),
    );
    return;
  }

  // _next/static: cache-first (URL 에 hash 가 박혀 있으므로 immutable)
  if (isNextStatic(url.pathname)) {
    event.respondWith(staticAssetCacheFirst(request, ASSET_CACHE));
    return;
  }

  // 페이지 네비게이션: network-first
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 정적 아이콘·매니페스트·폰트: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
