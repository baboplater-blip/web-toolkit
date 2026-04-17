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

/** online/busy → offline 전환 시 브라우저 알림 */
function notifyOffline(agent: Agent) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(`${agent.name} 오프라인`, {
    body: `PC "${agent.name}"이(가) 오프라인 상태로 전환되었습니다.`,
    icon: '/favicon.ico',
    tag: `offline-${agent.id}`,
  });
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const supabase = createClient();

    async function fetchAgents() {
      // 세션이 유효한지 먼저 확인 — 만료된 토큰을 자동 갱신
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[useAgents] 세션 없음 — 로그인 필요');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      if (error) {
        console.error('[useAgents] 쿼리 실패:', error.message);
      }
      if (data) {
        const checked = (data as Agent[]).map(applyStaleCheck);
        setAgents(checked);
        // 초기 상태 스냅샷 저장 (오프라인 전환 감지용)
        for (const a of checked) {
          prevStatusRef.current.set(a.id, a.status);
        }
      }
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
            // 오프라인 전환 감지
            const prevStatus = prevStatusRef.current.get(updated.id);
            if (
              prevStatus &&
              prevStatus !== 'offline' &&
              updated.status === 'offline'
            ) {
              notifyOffline(updated);
            }
            prevStatusRef.current.set(updated.id, updated.status);
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
