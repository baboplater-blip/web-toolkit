'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Message } from '@/lib/supabase/types';

/**
 * 브라우저 Notification API를 통해 작업 완료 시 알림을 표시하는 훅.
 * document.hidden 상태(탭 비활성)일 때만 알림을 보낸다.
 */
export function useNotification(messages: Message[]) {
  const prevStatusMap = useRef<Map<string, string>>(new Map());

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // 첫 마운트 시 권한 요청
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // 메시지 상태 변화 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    for (const message of messages) {
      if (message.role !== 'assistant') continue;

      const prevStatus = prevStatusMap.current.get(message.id);
      const currentStatus = message.status;

      // streaming → completed 전환 감지
      if (prevStatus === 'streaming' && currentStatus === 'completed') {
        if (document.hidden) {
          const contentPreview = message.content.substring(0, 80);
          new Notification('작업 완료', {
            body: contentPreview || '작업이 완료되었습니다.',
            icon: '/favicon.ico',
            tag: `msg-${message.id}`,
          });
        }
      }

      // streaming → error 전환도 알림
      if (prevStatus === 'streaming' && currentStatus === 'error') {
        if (document.hidden) {
          new Notification('작업 오류', {
            body: message.error_message || '작업 중 오류가 발생했습니다.',
            icon: '/favicon.ico',
            tag: `msg-${message.id}`,
          });
        }
      }
    }

    // 현재 상태 스냅샷 저장
    const nextMap = new Map<string, string>();
    for (const message of messages) {
      nextMap.set(message.id, message.status);
    }
    prevStatusMap.current = nextMap;
  }, [messages]);
}
