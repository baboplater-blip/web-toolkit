import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { toast } from '@/components/ui/toast';
import { clearStatus, registerChannel, reportStatus } from './realtime-status';

/**
 * Realtime 구독 실패·끊김 감지 → 지수 백오프 재시도 + 사용자 토스트.
 *
 * Supabase 채널은 `.subscribe((status) => ...)` 로 상태 콜백을 받는다.
 * - SUBSCRIBED       : 연결 성공 → 카운터 리셋
 * - CHANNEL_ERROR    : 권한·네트워크 문제
 * - TIMED_OUT        : 초기 연결 지연
 * - CLOSED           : 서버 또는 네트워크 끊김
 *
 * `rebuild` 콜백은 새 채널을 만들어 반환한다 — 기존 채널은 이 유틸이 제거한다.
 */

export interface RealtimeRetryOptions {
  /** 토스트·로그에 쓰일 식별자 (채팅방/에이전트 등). */
  key: string;
  /** 새 채널을 만들어 반환하는 팩토리. */
  rebuild: () => RealtimeChannel;
  /** 채널 정리 콜백 (supabase.removeChannel 등). */
  cleanup: (channel: RealtimeChannel) => void;
  /** 사용자에게 보여줄 한글 이름 (토스트용). 없으면 key 사용. */
  label?: string;
  /** 초기 구독 실패 후 최대 재시도 횟수 (0 = 무한). 기본 0. */
  maxAttempts?: number;
  /** 끊겼다가 재연결되었을 때 실행 — gap-fill 쿼리 용도. 첫 SUBSCRIBED 에서는 호출 안 됨. */
  onResubscribed?: () => void;
}

export interface RealtimeRetryHandle {
  channel: RealtimeChannel;
  stop: () => void;
  /** 백오프 대기를 건너뛰고 즉시 새 채널로 재연결한다. */
  reconnect: () => void;
}

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

export function subscribeWithRetry(opts: RealtimeRetryOptions): RealtimeRetryHandle {
  let attempts = 0;
  let stopped = false;
  let current: RealtimeChannel = opts.rebuild();
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  let lastErrorToastAt = 0;

  const forceReconnect = () => {
    if (stopped) return;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    attempts = 0;
    opts.cleanup(current);
    current = opts.rebuild();
    wire(current);
  };

  const schedule = () => {
    if (stopped) return;
    if (opts.maxAttempts && attempts >= opts.maxAttempts) return;
    const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempts);
    attempts += 1;
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      if (stopped) return;
      opts.cleanup(current);
      current = opts.rebuild();
      wire(current);
    }, delay);
  };

  const wire = (channel: RealtimeChannel) => {
    channel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (stopped) return;
      if (status === 'SUBSCRIBED') {
        if (attempts > 0) {
          toast(`${opts.label ?? opts.key} 실시간 연결이 복구되었습니다`, {
            variant: 'success',
            id: `rt-ok-${opts.key}`,
          });
          try {
            opts.onResubscribed?.();
          } catch (e) {
            console.warn(`[realtime] onResubscribed(${opts.key}) 실패`, e);
          }
        }
        attempts = 0;
        reportStatus(opts.key, 'subscribed');
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // 동일 key 는 5초에 한 번만 토스트
        const now = Date.now();
        if (now - lastErrorToastAt > 5000) {
          lastErrorToastAt = now;
          toast(`${opts.label ?? opts.key} 실시간 연결이 끊어졌습니다. 자동 재연결 중...`, {
            variant: 'warning',
            id: `rt-err-${opts.key}`,
          });
        }
        reportStatus(opts.key, 'reconnecting');
        schedule();
      }
    });
  };

  wire(current);
  registerChannel(opts.key, opts.label ?? opts.key, forceReconnect);

  return {
    get channel() {
      return current;
    },
    reconnect: forceReconnect,
    stop: () => {
      stopped = true;
      if (pendingTimer) clearTimeout(pendingTimer);
      opts.cleanup(current);
      clearStatus(opts.key);
    },
  };
}
