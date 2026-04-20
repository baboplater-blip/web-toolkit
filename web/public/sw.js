/**
 * Agent Control Panel — Service Worker
 *
 * 담당:
 *   1) Web Push 수신 + 알림 표시
 *   2) PWA 홈화면 설치 스코프 확보
 *   3) 오프라인 첫 로딩 캐시 — stale-while-revalidate 전략으로 "앱처럼 즉시 뜨는" 경험
 *
 * 캐시 전략:
 *   - /_next/static/*   (해시 포함 정적 자산): CacheFirst  — 영구적
 *   - / /chat /dashboard /settings 등 페이지 HTML: NetworkFirst (오프라인이면 캐시로 폴백)
 *   - 이미지·아이콘: CacheFirst
 *   - Supabase · /api/*: 건드리지 않음 (SW 우회 = 브라우저 기본 동작)
 *
 * 버전:
 *   SW_VERSION 이 바뀌면 기존 캐시는 activate 단계에서 삭제된다.
 *   새 배포마다 이 값을 올려야 구 캐시 청소가 된다.
 */
/* eslint-disable */

const SW_VERSION = 'acp-sw-v3-20260418b';
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;

/** 첫 설치 시 미리 받아둘 핵심 페이지 · 자산 목록. 이 경로들이 오프라인 진입점이 된다. */
const PRECACHE_URLS = [
  '/',
  '/chat',
  '/dashboard',
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
      // 개별 실패해도 install 이 중단되지 않도록 allSettled.
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
      // 우리 접두사로 시작하지만 현재 버전 이외의 캐시는 전부 삭제.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('acp-sw-') && !k.startsWith(SW_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/** URL 이 우리가 건드리는 오리진인지 */
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

/** 네비게이션(HTML) 요청: 네트워크 우선, 실패 시 캐시 */
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
    // 마지막 수단: /offline 전용 페이지 (완전 오프라인 폴백)
    const offline = await caches.match('/offline');
    if (offline) return offline;
    const fallback = await caches.match('/chat');
    if (fallback) return fallback;
    return new Response('오프라인', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

/** 정적 자산: 캐시 우선, 백그라운드 갱신 */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    // 백그라운드 갱신 — 다음 로드부터 최신.
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
  if (!isSameOrigin(request.url)) return; // Supabase, 외부 도메인은 건드리지 않음
  if (url.pathname.startsWith('/api/')) return; // API 응답은 브라우저 기본 경로
  if (url.pathname.startsWith('/_next/data/')) return; // RSC 데이터는 캐시하지 않음

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 나머지는 기본 동작 (stale-while-revalidate 대신 브라우저 캐시 따름).
});

// Push 이벤트 — 서버에서 Web Push 전송 시 발화.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Agent Control Panel', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Agent Control Panel';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: data.tag || 'acp-notification',
    renotify: true,
    data: {
      url: data.url || '/chat',
      agentId: data.agentId,
      conversationId: data.conversationId,
    },
    requireInteraction: data.variant === 'error',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/chat';
  const agentId = event.notification.data && event.notification.data.agentId;
  const targetUrl = agentId ? `${url}?agent=${agentId}` : url;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client) {
              await client.navigate(targetUrl);
            }
            return;
          } catch {}
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});

// 웹 앱이 수동으로 활성화를 유도할 수 있도록 message 핸들러.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
