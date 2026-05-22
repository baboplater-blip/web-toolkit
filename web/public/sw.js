/**
 * Web Toolkit — Service Worker
 *
 * 담당:
 *   1) PWA 홈화면 설치 스코프 확보
 *   2) 오프라인 첫 로딩 캐시 — 도구 페이지의 즉시 진입 경험
 *   3) 옛 ACP 시절 캐시(채팅·대시보드·하네스) 정리
 *
 * 미션 변경(2026-05-22): agent-control-panel(채팅 시스템) → web-toolkit(도구 모음).
 * Web Push / Supabase / 채팅 라우트는 제거되었으니 본 SW 도 단순화.
 */
/* eslint-disable */

const SW_VERSION = 'webtoolkit-sw-v1-20260522';
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;

/** 첫 설치 시 미리 받아둘 핵심 경로. 도구 사이트라 허브 + 설정 + 오프라인만. */
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
      // 옛 ACP 캐시(`acp-sw-*`) 와 이전 버전의 webtoolkit 캐시 모두 청소.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('acp-sw-') || (k.startsWith('webtoolkit-sw-') && !k.startsWith(SW_VERSION)))
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

function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.startsWith('/_next/static/') ||
    path.startsWith('/icon-') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path === '/manifest.json'
  );
}

/** 옛 라우트(`/chat`, `/dashboard`, `/harnesses`, `/share`, `/api/*`)는 곧장 /tools 로 리다이렉트. */
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

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline');
    if (offline) return offline;
    const fallback = await caches.match('/tools');
    if (fallback) return fallback;
    return new Response('오프라인', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request)
      .then((res) => {
        if (res.ok) cache.put(request, res.clone()).catch(() => {});
      })
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
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

  // RSC 페이로드(`?_rsc=...`) 요청은 SW 가 건드리지 않고 브라우저 기본 경로로.
  if (url.searchParams.has('_rsc')) return;

  // 옛 라우트 → /tools 로 즉시 리다이렉트 (옛 홈 화면 PWA 사용자 보호).
  if (isLegacyRoute(url.pathname)) {
    event.respondWith(Response.redirect('/tools', 302));
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
