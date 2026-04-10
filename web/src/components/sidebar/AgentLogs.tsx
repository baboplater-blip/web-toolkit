'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AgentLog {
  id: string;
  agent_id: string;
  level: string;
  message: string;
  created_at: string;
}

interface AgentLogsProps {
  agentId: string | null;
}

const LEVEL_STYLES: Record<string, string> = {
  info: 'text-muted-foreground',
  warn: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
};

export function AgentLogs({ agentId }: AgentLogsProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [expanded, setExpanded] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = supabaseRef.current;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!agentId) {
      setLogs([]);
      return;
    }

    async function fetchLogs() {
      const { data } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('agent_id', agentId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setLogs((data as AgentLog[]).reverse());
    }

    fetchLogs();

    const channel = supabase
      .channel(`agent-logs-${agentId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_logs',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          setLogs((prev) => {
            const next = [...prev, payload.new as AgentLog];
            // 최대 20개만 유지
            if (next.length > 20) return next.slice(next.length - 20);
            return next;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [agentId]);

  // 새 로그 추가 시 스크롤 하단으로
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, expanded]);

  if (!agentId) return null;

  return (
    <div className="border-t px-3 py-2">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <ScrollText className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          로그
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {logs.length}
        </span>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="mt-1.5 max-h-40 overflow-y-auto rounded border bg-background p-1.5 space-y-0.5"
        >
          {logs.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              로그 없음
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-1.5 text-[10px] leading-tight">
                <span className="text-muted-foreground shrink-0">
                  {new Date(log.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span
                  className={cn(
                    'break-all',
                    LEVEL_STYLES[log.level] ?? 'text-muted-foreground'
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
