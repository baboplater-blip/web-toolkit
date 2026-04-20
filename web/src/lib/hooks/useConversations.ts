'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeWithRetry, type RealtimeRetryHandle } from '@/lib/realtime-retry';
import { toast } from '@/components/ui/toast';
import {
  saveConversationList,
  loadConversationList,
} from '@/lib/offline-cache';
import type { Conversation } from '@/lib/supabase/types';

/**
 * 에이전트별 대화(스레드) 목록을 실시간으로 유지하고,
 * 새 대화 생성·제목 수정·보관(archive)·삭제 유틸을 제공한다.
 *
 * 규칙:
 *  - 기본은 archived=false 목록만 최신순으로 반환.
 *  - 에이전트가 선택되지 않은 경우 빈 배열.
 */
export function useConversations(agentId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const retryRef = useRef<RealtimeRetryHandle | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    if (retryRef.current) {
      retryRef.current.stop();
      retryRef.current = null;
    }

    if (!agentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversations((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    setLoading(true);
    let cancelled = false;
    let networkReceived = false;

    // 1) 캐시 선제 표시 — 네트워크 응답 전에 목록이 즉시 나타나게 한다.
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled || networkReceived) return;
        const snap = await loadConversationList(agentId, user.id);
        if (cancelled || networkReceived) return;
        if (snap && snap.conversations.length > 0) {
          setConversations((prev) => (prev.length === 0 ? snap.conversations : prev));
        }
      } catch {}
    })();

    // 2) 네트워크 조회. 성공 시 캐시 저장 + 덮어쓰기. 실패 시 캐시 유지.
    (async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('archived', false)
        .order('pinned', { ascending: false })
        .order('last_message_at', { ascending: false })
        .limit(100);
      if (cancelled) return;
      networkReceived = true;
      if (error) {
        console.error('[useConversations] 쿼리 실패:', error.message);
        // 캐시 없을 때만 토스트로 실패 알림.
        setConversations((prev) => {
          if (prev.length === 0) {
            toast('대화 목록을 불러오지 못했습니다.', { variant: 'error' });
          }
          return prev;
        });
        setLoading(false);
        return;
      }
      const fresh = (data as Conversation[] | null) ?? [];
      setConversations(fresh);
      setLoading(false);

      // 캐시 업데이트 — 비동기 fire-and-forget.
      if (fresh.length > 0) {
        supabase.auth.getUser().then(({ data: u }) => {
          if (u.user) {
            saveConversationList({
              agentId,
              userId: u.user.id,
              conversations: fresh,
            });
          }
        });
      }
    })();

    retryRef.current = subscribeWithRetry({
      key: `conversations-${agentId}`,
      label: '대화',
      rebuild: () =>
        supabase
          .channel(`conversations-${agentId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversations',
              filter: `agent_id=eq.${agentId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const row = payload.new as Conversation;
                if (row.archived) return;
                setConversations((prev) =>
                  prev.some((c) => c.id === row.id) ? prev : [row, ...prev],
                );
              } else if (payload.eventType === 'UPDATE') {
                const row = payload.new as Conversation;
                setConversations((prev) => {
                  if (row.archived) {
                    return prev.filter((c) => c.id !== row.id);
                  }
                  const exists = prev.some((c) => c.id === row.id);
                  const merged = exists
                    ? prev.map((c) => (c.id === row.id ? row : c))
                    : [row, ...prev];
                  return merged
                    .slice()
                    .sort((a, b) => {
                      // pinned 우선, 그 다음 최신 last_message_at.
                      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                      return (
                        new Date(b.last_message_at).getTime() -
                        new Date(a.last_message_at).getTime()
                      );
                    });
                });
              } else if (payload.eventType === 'DELETE') {
                const row = payload.old as Conversation;
                setConversations((prev) => prev.filter((c) => c.id !== row.id));
              }
            },
          ),
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
  }, [agentId]);

  const createConversation = useCallback(
    async (title?: string): Promise<Conversation | null> => {
      if (!agentId) return null;
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast('로그인이 만료되었습니다. 다시 로그인해주세요.', { variant: 'warning' });
        return null;
      }
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          title: title?.trim() || '새 대화',
        })
        .select()
        .single();
      if (error || !data) {
        toast(`대화 생성 실패: ${error?.message ?? '알 수 없음'}`, { variant: 'error' });
        return null;
      }
      // Realtime 이 INSERT 를 전달하겠지만, 즉시 반영을 위해 낙관적으로 추가.
      setConversations((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [data as Conversation, ...prev],
      );
      return data as Conversation;
    },
    [agentId],
  );

  const renameConversation = useCallback(async (id: string, title: string) => {
    const trimmed = title.trim().slice(0, 80);
    if (!trimmed) return false;
    const { error } = await supabaseRef.current
      .from('conversations')
      .update({ title: trimmed })
      .eq('id', id);
    if (error) {
      toast(`이름 변경 실패: ${error.message}`, { variant: 'error' });
      return false;
    }
    return true;
  }, []);

  const archiveConversation = useCallback(async (id: string) => {
    const { error } = await supabaseRef.current
      .from('conversations')
      .update({ archived: true })
      .eq('id', id);
    if (error) {
      toast(`보관 실패: ${error.message}`, { variant: 'error' });
      return false;
    }
    return true;
  }, []);

  const togglePinConversation = useCallback(
    async (id: string): Promise<boolean> => {
      const current = conversations.find((c) => c.id === id);
      const next = !(current?.pinned ?? false);
      // 낙관적 업데이트
      setConversations((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, pinned: next } : c))
          .slice()
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return (
              new Date(b.last_message_at).getTime() -
              new Date(a.last_message_at).getTime()
            );
          }),
      );
      const { error } = await supabaseRef.current
        .from('conversations')
        .update({ pinned: next })
        .eq('id', id);
      if (error) {
        toast(`고정 변경 실패: ${error.message}`, { variant: 'error' });
        // 롤백
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, pinned: !next } : c)),
        );
        return false;
      }
      return true;
    },
    [conversations],
  );

  /**
   * 기존 대화를 복제해 새 대화를 만든다.
   * - 같은 에이전트 내에 제목 "... (포크)" 로 새 conversation row 생성
   * - 원본의 모든 메시지를 그대로 복사 (id 는 새로 생성)
   * - claude_session_id 는 복제하지 않음 — Claude CLI 는 새 세션으로 계속하게 된다
   */
  /**
   * 기존 대화를 포크.
   * - untilMessageId 가 주어지면 해당 메시지를 포함하지 않고 그 직전까지만 복제
   *   ("이 지점에서 다른 방향 시도"). 메시지 편집의 경우 untilMessageId = 편집 대상 user 메시지.
   * - 주어지지 않으면 전체 복제 (기존 동작).
   * - claude_session_id 는 복제하지 않는다 (새 Claude CLI 세션으로 시작).
   */
  const forkConversation = useCallback(
    async (
      sourceId: string,
      options?: { untilMessageId?: string; suffix?: string },
    ): Promise<Conversation | null> => {
      if (!agentId) return null;
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast('로그인이 만료되었습니다', { variant: 'warning' });
        return null;
      }

      const { data: source, error: srcErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', sourceId)
        .maybeSingle();
      if (srcErr || !source) {
        toast('원본 대화를 찾을 수 없습니다', { variant: 'error' });
        return null;
      }

      const suffix = options?.suffix ?? '(포크)';
      const baseTitle = String(source.title ?? '대화');
      const newTitle =
        baseTitle.length > 70 ? baseTitle.slice(0, 70) + ' ' + suffix : baseTitle + ' ' + suffix;

      const { data: newConv, error: insErr } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          title: newTitle,
        })
        .select()
        .single();
      if (insErr || !newConv) {
        toast(`포크 실패: ${insErr?.message ?? '알 수 없음'}`, { variant: 'error' });
        return null;
      }

      // 원본 메시지 로드. untilMessageId 가 있으면 그 이전(created_at <)까지만.
      let cutoff: string | null = null;
      if (options?.untilMessageId) {
        const { data: anchor } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', options.untilMessageId)
          .maybeSingle();
        cutoff = (anchor?.created_at as string | undefined) ?? null;
      }

      let q = supabase
        .from('messages')
        .select('agent_id, harness_id, role, content, status, error_message, created_at')
        .eq('conversation_id', sourceId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (cutoff) q = q.lt('created_at', cutoff);

      const { data: messages } = await q;

      if (messages && messages.length > 0) {
        const rows = (messages as Array<Record<string, unknown>>).map((m) => ({
          agent_id: m.agent_id as string,
          user_id: user.id,
          conversation_id: newConv.id,
          harness_id: (m.harness_id as string | null) ?? null,
          role: m.role as 'user' | 'assistant' | 'system',
          content: String(m.content ?? ''),
          status: (m.status as string) ?? 'completed',
          error_message: (m.error_message as string | null) ?? null,
        }));
        for (let i = 0; i < rows.length; i += 200) {
          const chunk = rows.slice(i, i + 200);
          const { error } = await supabase.from('messages').insert(chunk);
          if (error) {
            toast(`메시지 복제 중 오류: ${error.message}`, { variant: 'error' });
            break;
          }
        }
      }

      setConversations((prev) =>
        prev.some((c) => c.id === newConv.id) ? prev : [newConv as Conversation, ...prev],
      );
      return newConv as Conversation;
    },
    [agentId],
  );

  /**
   * 특정 대화의 태그를 통째로 교체한다.
   * - 빈 문자열/공백/중복 제거 + 각 태그 최대 24자 + 최대 8개 제한.
   */
  const updateConversationTags = useCallback(async (id: string, nextTags: string[]) => {
    const cleaned = Array.from(
      new Set(
        nextTags
          .map((t) => t.trim().slice(0, 24))
          .filter((t) => t.length > 0),
      ),
    ).slice(0, 8);
    const { error } = await supabaseRef.current
      .from('conversations')
      .update({ tags: cleaned })
      .eq('id', id);
    if (error) {
      toast(`태그 저장 실패: ${error.message}`, { variant: 'error' });
      return false;
    }
    // Realtime UPDATE 가 갱신을 반영하지만 낙관적 즉시 반영.
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, tags: cleaned } : c)),
    );
    return true;
  }, []);

  /**
   * 대화 요약 수동/자동 저장.
   * summary_updated_at 은 서버 시각(now())으로 갱신하도록 클라이언트에서도 ISO now 를 동봉.
   * 빈 문자열을 주면 요약 삭제로 처리.
   */
  const updateConversationSummary = useCallback(
    async (id: string, summary: string | null) => {
      const normalized = summary && summary.trim() ? summary.trim().slice(0, 4000) : null;
      const patch = {
        summary: normalized,
        summary_updated_at: normalized ? new Date().toISOString() : null,
      };
      const { error } = await supabaseRef.current
        .from('conversations')
        .update(patch)
        .eq('id', id);
      if (error) {
        toast(`요약 저장 실패: ${error.message}`, { variant: 'error' });
        return false;
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
      return true;
    },
    [],
  );

  const unarchiveConversation = useCallback(async (id: string) => {
    const { error } = await supabaseRef.current
      .from('conversations')
      .update({ archived: false })
      .eq('id', id);
    if (error) {
      toast(`복구 실패: ${error.message}`, { variant: 'error' });
      return false;
    }
    return true;
  }, []);

  /** 보관함(아카이브) 목록을 1회성으로 조회. 실시간 구독은 하지 않는다. */
  const listArchived = useCallback(async (): Promise<Conversation[]> => {
    if (!agentId) return [];
    const { data, error } = await supabaseRef.current
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('archived', true)
      .order('last_message_at', { ascending: false })
      .limit(200);
    if (error) {
      toast('보관함을 불러오지 못했습니다', { variant: 'error' });
      return [];
    }
    return (data as Conversation[] | null) ?? [];
  }, [agentId]);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabaseRef.current
      .from('conversations')
      .delete()
      .eq('id', id);
    if (error) {
      toast(`삭제 실패: ${error.message}`, { variant: 'error' });
      return false;
    }
    return true;
  }, []);

  return {
    conversations,
    loading,
    createConversation,
    renameConversation,
    archiveConversation,
    togglePinConversation,
    unarchiveConversation,
    listArchived,
    deleteConversation,
    forkConversation,
    updateConversationTags,
    updateConversationSummary,
  };
}
