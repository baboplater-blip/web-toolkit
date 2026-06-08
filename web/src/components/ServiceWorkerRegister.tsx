'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';

/**
 * 페이지 로드 직후 Service Worker 등록.
 * - 이미 등록돼 있으면 업데이트 체크만 수행
 * - 새 SW 가 설치 대기 중이면 즉시 skipWaiting 메시지 전송 → 다음 네비게이션부터 새 캐시 사용
 *
 * usePushSubscription 에도 register 가 있지만, 푸시 미사용자도 오프라인 캐시를 받게 하려면
 * 이 컴포넌트가 전역에서 한 번 등록해주어야 한다.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // 개발 모드에서는 등록하지 않음 — HMR 과 충돌 방지.
    if (process.env.NODE_ENV !== 'production') return;

    // 리스너·타이머는 effect cleanup 에서 해제한다.
    // (beforeunload 는 모바일·BFCache 에서 신뢰할 수 없어 누수 위험 → 사용 안 함)
    let periodic: ReturnType<typeof setInterval> | undefined;
    let onVisibility: (() => void) | undefined;

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // 설치 대기 중인 SW 가 있으면 바로 활성화 요청.
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // 새 SW 가 대기 중 → 사용자에게 알리고 즉시 전환.
              installing.postMessage({ type: 'SKIP_WAITING' });
              toast('새 버전이 감지되었습니다 — 다음 화면 전환부터 적용됩니다', {
                variant: 'info',
                duration: 6000,
                id: 'sw-update-ready',
              });
            }
          });
        });

        // controller 가 새 SW 로 교체되면:
        //  - 페이지가 hidden 이면 즉시 reload (작업 중 아님)
        //  - visible 이면 토스트로 안내 (사용자 작업 손실 방지)
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          if (document.visibilityState === 'hidden') {
            location.reload();
            return;
          }
          toast('새 버전 적용됨 — 새로고침하면 즉시 사용', {
            variant: 'success',
            duration: 8000,
            id: 'sw-update-active',
          });
        });

        // 탭이 활성화될 때마다 SW 업데이트 체크 (사용자가 돌아오면 새 버전 자동 감지)
        onVisibility = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisibility);

        // 주기적으로도 업데이트 체크 (15분마다).
        periodic = setInterval(() => {
          reg.update().catch(() => {});
        }, 15 * 60 * 1000);
      } catch (e) {
        // 등록 실패해도 앱 동작에는 지장 없음. 프로덕션 콘솔 오염 방지(BP).
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[SW] 등록 실패:', e);
        }
      }
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    // 언마운트 시 일괄 정리 — load 리스너(아직 안 붙었을 수도)·주기 타이머·가시성 리스너.
    return () => {
      window.removeEventListener('load', onLoad);
      if (periodic !== undefined) clearInterval(periodic);
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
