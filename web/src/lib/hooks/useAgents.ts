'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeWithRetry, type RealtimeRetryHandle } from '@/lib/realtime-retry';
import { toast } from '@/components/ui/toast';
import type { Agent } from '@/lib/supabase/types';

const HEARTBEAT_STALE_MS = 2 * 60 * 1000;

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
  const retryRef = useRef<RealtimeRetryHandle | null>(null);
  const activityRetryRef = useRef<RealtimeRetryHandle | null>(null);
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchAgents() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[useAgents] 세션 없음 — 로그인 필요');
        if (!cancelled) setLoading(false);
        return;
      }

      const [agentRes, convRes] = await Promise.all([
        supabase.from('agents').select('*').order('name'),
        supabase
          .from('conversations')
          .select('agent_id, last_message_at')
          .order('last_message_at', { ascending: false }),
      ]);

      if (cancelled) return;
      if (agentRes.error) {
        console.error('[useAgents] 쿼리 실패:', agentRes.error.message);
        toast(`PC 목록을 불러오지 못했습니다: ${agentRes.error.message}`, { variant: 'error' });
      }

      const latestByAgent = new Map<string, string>();
      for (const row of (convRes.data ?? []) as { agent_id: string; last_message_at: string }[]) {
        if (!latestByAgent.has(row.agent_id)) {
          latestByAgent.set(row.agent_id, row.last_message_at);
        }
      }

      if (agentRes.data) {
        const checked = (agentRes.data as Agent[]).map((a) => ({
          ...applyStaleCheck(a),
          last_activity_at: latestByAgent.get(a.id) ?? null,
        }));
        setAgents(checked);
        for (const a of checked) {
          prevStatusRef.current.set(a.id, a.status);
        }
      }
      setLoading(false);
    }

    fetchAgents();

    activityRetryRef.current = subscribeWithRetry({
      key: 'agents-activity',
      label: 'PC 활동',
      rebuild: () =>
        supabase
          .channel(`agents-activity-${Date.now()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations' },
            (payload) => {
              // INSERT/UPDATE 시 last_message_at 이 최신화되므로 그에 맞춰 agent.last_activity_at 을 bump.
              if (payload.eventType === 'DELETE') return;
              const row = payload.new as { agent_id?: string; last_message_at?: string };
              if (!row?.agent_id || !row?.last_message_at) return;
              setAgents((prev) =>
                prev.map((a) => {
                  if (a.id !== row.agent_id) return a;
                  const cur = a.last_activity_at;
                  if (cur && new Date(cur).getTime() >= new Date(row.last_message_at!).getTime()) {
                    return a;
                  }
                  return { ...a, last_activity_at: row.last_message_at! };
                }),
              );
            },
          ),
      cleanup: (ch) => {
        supabase.removeChannel(ch);
      },
    });

    retryRef.current = subscribeWithRetry({
      key: 'agents-status',
      label: 'PC 상태',
      rebuild: () =>
        supabase
          .channel(`agents-status-${Date.now()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'agents' },
            (payload) => {
              if (payload.eventType === 'UPDATE') {
                const updated = applyStaleCheck(payload.new as Agent);
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
                  prev.map((a) => (a.id === updated.id ? updated : a)),
                );
              } else if (payload.eventType === 'INSERT') {
                setAgents((prev) => [...prev, applyStaleCheck(payload.new as Agent)]);
              } else if (payload.eventType === 'DELETE') {
                setAgents((prev) =>
                  prev.filter((a) => a.id !== (payload.old as Agent).id),
                );
              }
            },
          ),
      cleanup: (ch) => {
        supabase.removeChannel(ch);
      },
    });

    // UPDATE 이벤트가 뜸할 때도 heartbeat 신선도를 UI 에서 정기적으로 재평가.
    // 크래시/전원차단으로 agents.status 가 DB 에서 'online' 인 채 남아도 2분 임계로 offline 처리된다.
    const staleRecheck = setInterval(() => {
      setAgents((prev) => {
        let changed = false;
        const next = prev.map((a) => {
          const checked = applyStaleCheck(a);
          if (checked.status !== a.status) {
            changed = true;
            const prevStatus = prevStatusRef.current.get(a.id);
            if (prevStatus && prevStatus !== 'offline' && checked.status === 'offline') {
              notifyOffline(checked);
            }
            prevStatusRef.current.set(a.id, checked.status);
          }
          return checked;
        });
        return changed ? next : prev;
      });
    }, 30_000);

    return () => {
      cancelled = true;
      if (retryRef.current) {
        retryRef.current.stop();
        retryRef.current = null;
      }
      if (activityRetryRef.current) {
        activityRetryRef.current.stop();
        activityRetryRef.current = null;
      }
      clearInterval(staleRecheck);
    };
  }, []);

  return { agents, loading };
}
