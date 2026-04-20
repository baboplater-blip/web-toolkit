'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeWithRetry, type RealtimeRetryHandle } from '@/lib/realtime-retry';
import { toast } from '@/components/ui/toast';
import { loadSnapshot, saveSnapshot } from '@/lib/offline-cache';
import { notePositiveReaction } from '@/lib/template-feedback';
import type { Conversation, Message } from '@/lib/supabase/types';

const INITIAL_PAGE_SIZE = 100;
const OLDER_PAGE_SIZE = 100;
const SNAPSHOT_DEBOUNCE_MS = 2000;

/**
 * 하나의 대화(conversation)에 속한 메시지를 실시간 구독 + 페이지네이션한다.
 *
 * 페이지네이션 전략:
 *   - 초기 로드: 최신 N개 (created_at DESC LIMIT N → 시간순 오름차순으로 역변환)
 *   - 더 오래된 메시지 요청 시 loadOlder() 호출 → 가장 오래된 메시지 기준 이전 N개 추가 프리펜드
 *   - Realtime INSERT/UPDATE/DELETE 는 기존 로직 유지.
 */
export function useMessages(
  agentId: string | null,
  conversationId: string | null,
  conversationMeta?: Conversation | null,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  /** true = 현재 표시 중인 메시지가 IndexedDB 스냅샷이고 아직 네트워크 응답을 못 받은 상태. */
  const [isFromCache, setIsFromCache] = useState(false);
  const retryRef = useRef<RealtimeRetryHandle | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    if (retryRef.current) {
      retryRef.current.stop();
      retryRef.current = null;
    }

    if (!conversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages((prev) => (prev.length === 0 ? prev : []));
      setHasMore(false);
      setIsFromCache(false);
      return;
    }

    setLoading(true);
    setIsFromCache(false);
    let cancelled = false;
    let networkReceived = false;

    // 1) 캐시 선적용 — 네트워크 응답 전에 사용자에게 즉시 보여준다.
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled || networkReceived) return;
        const snap = await loadSnapshot(conversationId, user.id);
        if (cancelled || networkReceived) return;
        if (snap && snap.messages.length > 0) {
          setMessages((prev) => (prev.length === 0 ? snap.messages : prev));
          setIsFromCache(true);
          setLoading(false);
        }
      } catch {}
    })();

    // 2) 네트워크 조회. 성공 시 캐시를 대체, 실패 시 캐시 유지(있다면).
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(INITIAL_PAGE_SIZE);
      if (cancelled) return;
      networkReceived = true;
      if (error) {
        console.error('[useMessages] 쿼리 실패:', error.message);
        // 캐시가 이미 있으면 toast 대신 isFromCache 배너로 충분.
        setIsFromCache((current) => {
          if (!current) {
            toast('메시지를 불러오지 못했습니다.', { variant: 'error' });
          }
          return current;
        });
        setLoading(false);
        return;
      }
      const list = ((data as Message[] | null) ?? []).slice().reverse();
      setMessages(list);
      setHasMore((data?.length ?? 0) >= INITIAL_PAGE_SIZE);
      setIsFromCache(false);
      setLoading(false);
    })();

    const gapFill = async () => {
      // 재연결 직후 놓친 INSERT/UPDATE 를 메워준다.
      // 전략: 우리 state 에서 가장 최신 updated_at 이후의 행을 다시 쿼리.
      const currentLatest = (() => {
        let ts = 0;
        setMessages((prev) => {
          for (const m of prev) {
            const t = new Date(m.updated_at).getTime();
            if (t > ts) ts = t;
          }
          return prev;
        });
        return ts;
      })();
      if (!currentLatest) return;
      const sinceIso = new Date(currentLatest - 1000).toISOString();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .gte('updated_at', sinceIso)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error || !data) return;
      if (data.length === 0) return;
      let newlyAdded = 0;
      setMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        for (const row of data as Message[]) {
          if (!byId.has(row.id)) newlyAdded += 1;
          byId.set(row.id, row);
        }
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      });
      if (newlyAdded > 0) {
        toast(`재연결 후 ${newlyAdded}개 메시지를 복구했습니다`, {
          variant: 'info',
          duration: 4000,
          id: 'gap-fill',
        });
      }
    };

    retryRef.current = subscribeWithRetry({
      key: `messages-${conversationId}`,
      label: '메시지',
      rebuild: () =>
        supabase
          .channel(`messages-${conversationId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setMessages((prev) => {
                  const row = payload.new as Message;
                  return prev.some((m) => m.id === row.id) ? prev : [...prev, row];
                });
              } else if (payload.eventType === 'UPDATE') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === (payload.new as Message).id ? (payload.new as Message) : m,
                  ),
                );
              } else if (payload.eventType === 'DELETE') {
                setMessages((prev) =>
                  prev.filter((m) => m.id !== (payload.old as Message).id),
                );
              }
            },
          ),
      onResubscribed: gapFill,
      cleanup: (ch) => {
        supabase.removeChannel(ch);
      },
    });

    return () => {
      cancelled = true;
      if (retryRef.current) {
        retryRef.current.stop();
        retryRef.current = null;
      }
    };
  }, [conversationId]);

  /**
   * 오프라인 캐시 저장 — messages 나 conversation 메타가 바뀌면 2초 디바운스 후 IndexedDB 에 기록.
   * 캐시에서 방금 읽은 상태 (isFromCache=true) 거나 스트리밍 중이면 건너뛴다.
   */
  useEffect(() => {
    if (!conversationId || !conversationMeta) return;
    if (isFromCache) return;
    if (messages.length === 0) return;
    // 진행 중인 스트리밍/처리 중 상태는 부분 데이터 — 저장 안 함.
    if (messages.some((m) => m.status === 'streaming' || m.status === 'processing')) return;

    const supabase = supabaseRef.current;
    const handle = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      saveSnapshot({
        conversation: conversationMeta,
        messages,
        userId: user.id,
      });
    }, SNAPSHOT_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [conversationId, conversationMeta, messages, isFromCache]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlder || !hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;

    setLoadingOlder(true);
    const { data, error } = await supabaseRef.current
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(OLDER_PAGE_SIZE);
    setLoadingOlder(false);

    if (error) {
      toast(`이전 메시지 로드 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    const older = ((data as Message[] | null) ?? []).slice().reverse();
    setMessages((prev) => [...older, ...prev]);
    setHasMore((data?.length ?? 0) >= OLDER_PAGE_SIZE);
  }, [conversationId, hasMore, loadingOlder, messages]);

  const sendMessage = useCallback(
    async (
      content: string,
      harnessId: string | null,
      overrideConversationId?: string,
      opts?: { timeoutExtended?: boolean },
    ): Promise<boolean> => {
      const convId = overrideConversationId ?? conversationId;
      if (!agentId || !convId || !content.trim()) return false;
      const trimmed = content.trim();

      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast('로그인이 만료되었습니다. 다시 로그인해주세요.', { variant: 'warning' });
        return false;
      }

      const hasUserMessage = convId === conversationId
        ? messages.some((m) => m.role === 'user')
        : false;
      if (!hasUserMessage) {
        const autoTitle = trimmed.replace(/\s+/g, ' ').slice(0, 40);
        supabase
          .from('conversations')
          .update({ title: autoTitle })
          .eq('id', convId)
          .eq('title', '새 대화')
          .then(() => {});
      }

      const { error } = await supabase.from('messages').insert({
        agent_id: agentId,
        conversation_id: convId,
        harness_id: harnessId,
        role: 'user' as const,
        content: trimmed,
        status: 'completed' as const,
        user_id: user.id,
        timeout_extended: !!opts?.timeoutExtended,
      });

      if (error) {
        toast(`메시지 전송 실패: ${error.message}`, { variant: 'error' });
        return false;
      }
      return true;
    },
    [agentId, conversationId, messages],
  );

  const clearMessages = useCallback(async () => {
    if (!conversationId) return;
    const { error } = await supabaseRef.current
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
    if (error) {
      toast(`삭제 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    setMessages([]);
    setHasMore(false);
  }, [conversationId]);

  const cancelRunning = useCallback(async () => {
    if (!conversationId) return;
    await supabaseRef.current
      .from('messages')
      .update({ status: 'cancelled' })
      .eq('conversation_id', conversationId)
      .in('status', ['streaming', 'processing', 'pending']);
  }, [conversationId]);

  const isRunning = messages.some(
    (m) => m.status === 'streaming' || m.status === 'processing',
  );

  /**
   * 멈춘 streaming 메시지를 사용자가 수동으로 cancelled 로 종결.
   * 에이전트가 응답을 더 이상 주지 않을 때 UI 에서 정리할 수 있게 한다.
   */
  const forceStop = useCallback(async (messageId: string) => {
    const { error } = await supabaseRef.current
      .from('messages')
      .update({
        status: 'cancelled',
        error_message: '사용자가 응답 없음을 확인하고 수동 종결',
      })
      .eq('id', messageId)
      .in('status', ['streaming', 'processing', 'pending']);
    if (error) {
      toast(`중단 처리 실패: ${error.message}`, { variant: 'error' });
    }
  }, []);

  /**
   * 메시지 핀 토글. 핀 시각은 서버 시간 기준이라 로컬은 즉시 낙관적으로 now 를 박고,
   * Realtime UPDATE 로 정확한 서버 시각이 덮어쓴다.
   */
  const togglePin = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const nextPinned = !target.pinned;
      const patch = nextPinned
        ? { pinned: true, pinned_at: new Date().toISOString() }
        : { pinned: false, pinned_at: null };

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
      );
      const { error } = await supabaseRef.current
        .from('messages')
        .update(patch)
        .eq('id', messageId);
      if (error) {
        toast(`핀 변경 실패: ${error.message}`, { variant: 'error' });
        // 롤백
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, pinned: target.pinned, pinned_at: target.pinned_at }
              : m,
          ),
        );
      }
    },
    [messages],
  );

  /**
   * 메시지 반응 토글. null 이면 반응 해제.
   * 낙관적 업데이트 후 실패 시 롤백.
   */
  const setReaction = useCallback(
    async (messageId: string, reaction: 'up' | 'down' | 'curious' | null) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const prev = target.reaction;

      if (reaction === 'up' && prev !== 'up') notePositiveReaction();

      setMessages((list) =>
        list.map((m) => (m.id === messageId ? { ...m, reaction } : m)),
      );
      const { error } = await supabaseRef.current
        .from('messages')
        .update({ reaction })
        .eq('id', messageId);
      if (error) {
        toast(`반응 저장 실패: ${error.message}`, { variant: 'error' });
        setMessages((list) =>
          list.map((m) => (m.id === messageId ? { ...m, reaction: prev } : m)),
        );
      }
    },
    [messages],
  );

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    loadOlder,
    sendMessage,
    clearMessages,
    cancelRunning,
    isRunning,
    togglePin,
    setReaction,
    forceStop,
    isFromCache,
  };
}
