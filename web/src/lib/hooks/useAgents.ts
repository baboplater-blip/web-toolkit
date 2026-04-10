'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Agent } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAgents() {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .order('name');
      if (data) setAgents(data as Agent[]);
      setLoading(false);
    }

    fetchAgents();

    // 기존 채널 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`agents-status-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Agent).id ? (payload.new as Agent) : a
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setAgents((prev) => [...prev, payload.new as Agent]);
          } else if (payload.eventType === 'DELETE') {
            setAgents((prev) =>
              prev.filter((a) => a.id !== (payload.old as Agent).id)
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
  }, []);

  return { agents, loading };
}
