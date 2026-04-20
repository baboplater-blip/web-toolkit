'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  listOutbox,
  removeOutboxItem,
  updateOutboxItem,
  purgeExpiredFailed,
  OUTBOX_MAX_ATTEMPTS,
  type OutboxItem,
} from '@/lib/outbox';
import { toast } from '@/components/ui/toast';

/**
 * 오프라인 전송 큐 상태 및 flush 훅.
 *
 * - 초기 로드 + 주기적 재조회 + 온라인 복귀 이벤트에 반응
 * - 온라인이고 로그인된 상태라면 queue 를 순차로 flush
 * - 각 아이템:
 *     1) conversationId 가 null 이면 먼저 새 대화 생성
 *     2) messages 테이블에 user 메시지 INSERT
 *     3) 성공 → removeOutboxItem; 실패 → attempts++ & MAX_ATTEMPTS 초과 시 failed=true
 */
export function useOutbox() {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [flushing, setFlushing] = useState(false);
  const supabaseRef = useRef(createClient());
  const flushingRef = useRef(false);

  const refresh = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setItems([]);
      return [] as OutboxItem[];
    }
    // 7일 넘게 남은 영구실패 자동 파기 — refresh 마다 한 번.
    await purgeExpiredFailed();
    const list = await listOutbox(user.id);
    setItems(list);
    return list;
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    flushingRef.current = true;
    setFlushing(true);
    try {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const pending = (await listOutbox(user.id)).filter(
        (x) => !x.failed && x.attempts < OUTBOX_MAX_ATTEMPTS,
      );
      if (pending.length === 0) return;

      let sentCount = 0;
      let permFailed = 0;
      for (const item of pending) {
        // 1) conversationId null 이면 새 대화 생성.
        let convId = item.conversationId;
        if (!convId) {
          const title = item.content.trim().slice(0, 50) || '새 대화';
          const { data: conv, error: convErr } = await supabase
            .from('conversations')
            .insert({ agent_id: item.agentId, user_id: user.id, title })
            .select()
            .single();
          if (convErr || !conv) {
            const failed = item.attempts + 1 >= OUTBOX_MAX_ATTEMPTS;
            await updateOutboxItem({
              ...item,
              attempts: item.attempts + 1,
              failed,
              lastError: `대화 생성 실패: ${convErr?.message ?? '알 수 없음'}`,
            });
            if (failed) permFailed++;
            continue;
          }
          convId = conv.id as string;
        }

        // 2) user 메시지 INSERT.
        const { error: msgErr } = await supabase.from('messages').insert({
          agent_id: item.agentId,
          user_id: user.id,
          conversation_id: convId,
          harness_id: item.harnessId,
          role: 'user',
          content: item.content,
          status: 'completed',
        });
        if (msgErr) {
          const failed = item.attempts + 1 >= OUTBOX_MAX_ATTEMPTS;
          await updateOutboxItem({
            ...item,
            conversationId: convId,
            attempts: item.attempts + 1,
            failed,
            lastError: msgErr.message,
          });
          if (failed) permFailed++;
          continue;
        }

        await removeOutboxItem(item.id);
        sentCount++;
      }

      await refresh();

      if (sentCount > 0) {
        toast(`대기 중이던 ${sentCount}건 전송 완료`, {
          variant: 'success',
          duration: 5000,
        });
      }
      if (permFailed > 0) {
        toast(`${permFailed}건 반복 실패 — 오프라인 큐 설정에서 확인`, {
          variant: 'error',
          duration: 6000,
        });
      }
    } finally {
      flushingRef.current = false;
      setFlushing(false);
    }
  }, [refresh]);

  // 최초 로드.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 온라인 복귀 감지 → flush.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      flush();
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [flush]);

  // 페이지 로드 시 이미 온라인이고 큐가 있으면 즉시 flush 한 번.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && items.length > 0) {
      flush();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length === 0]);

  return {
    items,
    flushing,
    refresh,
    flush,
    pendingCount: items.filter((x) => !x.failed).length,
    failedCount: items.filter((x) => x.failed).length,
  };
}
