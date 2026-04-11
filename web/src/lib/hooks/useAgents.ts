'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Agent } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** 하트비트가 이 시간(ms) 이상 지나면 오프라인으로 판정 */
const HEARTBEAT_STALE_MS = 2 * 60 * 1000;

/** last_heartbeat 기반으로 stale agent의 status를 'offline'으로 보정 */
function applyStaleCheck(agent: Agent): Agent {
  if (
    agent.status !== 'offline' &&
    agent.last_heartbeat &&
    Date.now() - new Date(agent.last_heartbeat).getTime() > HEARTBEAT_STALE_MS
  ) {
    return { ...agent, status: 'offline' };
  }
  return agent;
}

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
      if (data) setAgents((data as Agent[]).map(applyStaleCheck));
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
            const updated = applyStaleCheck(payload.new as Agent);
            setAgents((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
          } else if (payload.eventType === 'INSERT') {
            setAgents((prev) => [...prev, applyStaleCheck(payload.new as Agent)]);
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
