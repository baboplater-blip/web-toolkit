'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

/**
 * 브라우저 Web Push 구독 상태를 관리한다.
 *
 * 동작:
 *   - 지원 여부(navigator.serviceWorker + PushManager) 판별
 *   - 현재 구독 여부 조회 (ready + getSubscription)
 *   - enable(): 권한 요청 → 서비스워커 등록 → PushManager.subscribe → /api/push/subscribe POST
 *   - disable(): 현재 구독 unsubscribe + 서버 삭제
 */

type Status = 'idle' | 'enabling' | 'disabling';

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('[push] SW 등록 실패', err);
    return null;
  }
}

export interface PushHealth {
  browserHasSub: boolean;
  dbHasSub: boolean;
  endpointMatches: boolean;
  dbRowCount: number;
  lastCheckedAt: string;
  /** 자가 복구가 수행되었는지. */
  healed: boolean;
}

export function usePushSubscription() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [health, setHealth] = useState<PushHealth | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (!ok) return;

    setPermission(Notification.permission);

    (async () => {
      const reg = await registerSW();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast('VAPID 키가 설정되지 않았습니다', { variant: 'error' });
      return false;
    }

    setStatus('enabling');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast('브라우저 알림 권한이 허용되지 않았습니다.', { variant: 'warning' });
        return false;
      }

      const reg = await registerSW();
      if (!reg) {
        toast('서비스워커를 등록할 수 없습니다.', { variant: 'error' });
        return false;
      }

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(publicKey),
        }));

      // Supabase 세션 토큰을 /api/push/subscribe 로 전달
      const {
        data: { session },
      } = await supabaseRef.current.auth.getSession();
      if (!session?.access_token) {
        toast('로그인이 필요합니다', { variant: 'warning' });
        return false;
      }

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        toast('알림 구독 저장 실패', { variant: 'error' });
        return false;
      }
      setSubscribed(true);
      toast('알림이 활성화되었습니다', { variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast(`알림 활성화 실패: ${msg}`, { variant: 'error' });
      return false;
    } finally {
      setStatus('idle');
    }
  }, []);

  const disable = useCallback(async (): Promise<boolean> => {
    setStatus('disabling');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        const {
          data: { session },
        } = await supabaseRef.current.auth.getSession();
        if (session?.access_token) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ endpoint }),
          });
        }
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast('알림을 해제했습니다', { variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast(`해제 실패: ${msg}`, { variant: 'error' });
      return false;
    } finally {
      setStatus('idle');
    }
  }, []);

  /**
   * 브라우저 구독과 Supabase DB 상태를 대조해 불일치를 자동 복구한다.
   *   - 브라우저에 있는데 DB 에 없으면: 재등록
   *   - 브라우저에 없는데 DB 에 있으면: 서버에서 제거
   *   - endpoint 가 다르면: 최신 endpoint 로 갱신
   */
  const checkSubscription = useCallback(async (): Promise<PushHealth | null> => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

    const reg = await navigator.serviceWorker.getRegistration('/');
    const browserSub = await reg?.pushManager.getSubscription();
    const browserEndpoint = browserSub?.endpoint ?? null;

    const { data: rows } = await supabaseRef.current
      .from('push_subscriptions')
      .select('endpoint');
    const dbEndpoints = ((rows ?? []) as { endpoint: string }[]).map((r) => r.endpoint);
    const dbRowCount = dbEndpoints.length;
    const endpointMatches = browserEndpoint ? dbEndpoints.includes(browserEndpoint) : false;

    let healed = false;
    const {
      data: { session },
    } = await supabaseRef.current.auth.getSession();

    // 브라우저에는 있는데 DB 에 없으면 재등록
    if (browserSub && !endpointMatches && session?.access_token) {
      const json = browserSub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (res.ok) healed = true;
    }

    // 브라우저에는 없는데 DB 에 이 유저의 구독이 있으면 정리
    if (!browserSub && dbRowCount > 0 && session?.access_token) {
      for (const endpoint of dbEndpoints) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ endpoint }),
        });
      }
      healed = true;
    }

    const snapshot: PushHealth = {
      browserHasSub: !!browserSub,
      dbHasSub: dbRowCount > 0,
      endpointMatches,
      dbRowCount,
      lastCheckedAt: new Date().toISOString(),
      healed,
    };
    setHealth(snapshot);
    setSubscribed(!!browserSub);
    return snapshot;
  }, []);

  return { supported, permission, subscribed, status, enable, disable, checkSubscription, health };
}
