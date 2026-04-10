'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/supabase/types';

export function useMessages(agentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
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
      .channel(`messages-${agentId}`)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const sendMessage = useCallback(
    async (content: string, harnessId: string | null) => {
      if (!agentId || !content.trim()) return;

      const { error } = await supabase.from('messages').insert({
        agent_id: agentId,
        harness_id: harnessId,
        role: 'user' as const,
        content: content.trim(),
        status: 'completed' as const,
      });

      return !error;
    },
    [agentId]
  );

  const clearMessages = useCallback(async () => {
    if (!agentId) return;
    await supabase.from('messages').delete().eq('agent_id', agentId);
    setMessages([]);
  }, [agentId]);

  return { messages, loading, sendMessage, clearMessages };
}
