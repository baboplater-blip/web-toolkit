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
 *
 * 미션 변경(2026-05-22): agent-control-panel → web-toolkit.
 */
/* eslint-disable */

const SW_VERSION = 'webtoolkit-sw-e162365-202605250434';
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const ASSET_CACHE = `${SW_VERSION}-asset`;

const RUNTIME_MAX_ENTRIES = 80;

const PRECACHE_URLS = [
  '/',
  '/tools',
  '/settings',
  '/offline',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
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

/** RUNTIME 캐시 크기 제한 — 오래된 항목 제거 (단순 FIFO) */
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
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
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

  // 옛 라우트 → /tools 리다이렉트 (옛 홈화면 PWA 사용자 보호)
  if (isLegacyRoute(url.pathname)) {
    event.respondWith(Response.redirect('/tools', 302));
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
