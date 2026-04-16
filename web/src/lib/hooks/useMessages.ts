'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useMessages(agentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    // 기존 채널 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!agentId) {
      setMessages([]);
      return;
    }

    setLoading(true);

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('agent_id', agentId!)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setMessages(data as Message[]);
      setLoading(false);
    }

    fetchMessages();

    const channel = supabase
      .channel(`messages-${agentId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === (payload.new as Message).id
                  ? (payload.new as Message)
                  : m
              )
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [agentId]);

  const sendMessage = useCallback(
    async (content: string, harnessId: string | null, continueMode = false) => {
      if (!agentId || !content.trim()) return;

      // 컨텍스트 유지 모드: [CTX] 접두사를 붙여 agent가 --continue 플래그를 사용하도록 전달
      const finalContent = continueMode
        ? `[CTX]${content.trim()}`
        : content.trim();

      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (!user) return false;

      const { error } = await supabaseRef.current.from('messages').insert({
        agent_id: agentId,
        harness_id: harnessId,
        role: 'user' as const,
        content: finalContent,
        status: 'completed' as const,
        user_id: user.id,
      } as never);

      return !error;
    },
    [agentId]
  );

  const clearMessages = useCallback(async () => {
    if (!agentId) return;
    await supabaseRef.current.from('messages').delete().eq('agent_id', agentId);
    setMessages([]);
  }, [agentId]);

  // 실행 중인 메시지 취소
  const cancelRunning = useCallback(async () => {
    if (!agentId) return;
    await supabaseRef.current
      .from('messages')
      .update({ status: 'cancelled' as any })
      .eq('agent_id', agentId)
      .in('status', ['streaming', 'processing', 'pending']);
  }, [agentId]);

  const isRunning = messages.some(
    (m) => m.status === 'streaming' || m.status === ('processing' as any)
  );

  return { messages, loading, sendMessage, clearMessages, cancelRunning, isRunning };
}
