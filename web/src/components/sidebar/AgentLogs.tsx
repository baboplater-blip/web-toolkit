'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ChevronRight, ScrollText, Search, Download, X, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AgentLog {
  id: string;
  agent_id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  conversation_id: string | null;
  message_id: string | null;
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

const LEVEL_LABEL: Record<string, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

const INITIAL_LIMIT = 100;
const OLDER_PAGE = 100;

export function AgentLogs({ agentId }: AgentLogsProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [query, setQuery] = useState('');
  const [levels, setLevels] = useState<Set<'info' | 'warn' | 'error'>>(
    new Set(['info', 'warn', 'error']),
  );

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<boolean>(true);

  /** 초기 로드 + Realtime 구독 */
  useEffect(() => {
    const supabase = supabaseRef.current;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!agentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLogs((prev) => (prev.length === 0 ? prev : []));
      setHasMore(false);
      return;
    }

    async function fetchLogs() {
      const { data } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('agent_id', agentId!)
        .order('created_at', { ascending: false })
        .limit(INITIAL_LIMIT);
      if (data) {
        const list = (data as AgentLog[]).slice().reverse();
        setLogs(list);
        setHasMore(data.length >= INITIAL_LIMIT);
      }
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
            const row = payload.new as AgentLog;
            if (prev.some((l) => l.id === row.id)) return prev;
            // 상한 없이 누적 — 무한 스크롤이 아니라 실시간 tail 이므로 500개 이상이면 앞쪽 자른다
            const next = [...prev, row];
            return next.length > 500 ? next.slice(next.length - 500) : next;
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [agentId]);

  /** 필터된 로그 */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (!levels.has(l.level)) return false;
      if (q && !l.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, query, levels]);

  /** 자동 스크롤 — 사용자가 위로 올리지 않았을 때만 */
  useEffect(() => {
    if (!expanded || !scrollRef.current || !autoScrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered, expanded]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    autoScrollRef.current = atBottom;
  }, []);

  const loadOlder = useCallback(async () => {
    if (!agentId || loadingOlder || !hasMore) return;
    const oldest = logs[0];
    if (!oldest) return;
    setLoadingOlder(true);
    const { data } = await supabaseRef.current
      .from('agent_logs')
      .select('*')
      .eq('agent_id', agentId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(OLDER_PAGE);
    setLoadingOlder(false);
    const older = (data as AgentLog[] | null) ?? [];
    setLogs((prev) => [...older.slice().reverse(), ...prev]);
    setHasMore(older.length >= OLDER_PAGE);
  }, [agentId, hasMore, loadingOlder, logs]);

  const toggleLevel = (lv: 'info' | 'warn' | 'error') => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lv)) next.delete(lv);
      else next.add(lv);
      // 모두 끄지 못하게: 최소 1개는 유지
      return next.size === 0 ? prev : next;
    });
  };

  const downloadLogs = () => {
    if (filtered.length === 0) {
      toast('내보낼 로그가 없습니다', { variant: 'warning' });
      return;
    }
    const body = filtered
      .map((l) => `[${l.created_at}] [${LEVEL_LABEL[l.level]}] ${l.message}`)
      .join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `agent-logs-${agentId?.slice(0, 8)}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
          {filtered.length}
          {query || levels.size < 3 ? ` / ${logs.length}` : ''}
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1.5">
          {/* 필터 바 */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-1 items-center gap-1 rounded border bg-background px-2">
              <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="로그 검색..."
                className="h-6 border-0 px-0 text-[11px] shadow-none focus-visible:ring-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="검색 지우기"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={downloadLogs}
              title="현재 필터 결과를 TXT로 저장"
              aria-label="로그 다운로드"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex gap-1">
            {(['info', 'warn', 'error'] as const).map((lv) => {
              const active = levels.has(lv);
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => toggleLevel(lv)}
                  className={cn(
                    'h-5 px-1.5 rounded text-[10px] font-semibold tracking-wider border transition-colors',
                    active
                      ? lv === 'error'
                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                        : lv === 'warn'
                          ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                          : 'bg-muted border-border text-foreground'
                      : 'bg-background text-muted-foreground/50 border-transparent hover:text-muted-foreground',
                  )}
                >
                  {LEVEL_LABEL[lv]}
                </button>
              );
            })}
          </div>

          {/* 로그 창 */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-60 overflow-y-auto rounded border bg-background p-1.5 space-y-0.5"
          >
            {hasMore && logs.length > 0 && (
              <div className="flex justify-center py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={loadOlder}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? '불러오는 중…' : '이전 로그 더 불러오기'}
                </Button>
              </div>
            )}
            {filtered.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                {query || levels.size < 3 ? '필터 조건에 맞는 로그가 없습니다' : '로그 없음'}
              </p>
            ) : (
              filtered.map((log) => {
                const hasLink = Boolean(log.conversation_id && agentId);
                const goto = () => {
                  if (!hasLink) return;
                  const params = new URLSearchParams();
                  params.set('agent', agentId!);
                  params.set('conversation', log.conversation_id!);
                  if (log.message_id) params.set('message', log.message_id);
                  router.push(`/chat?${params.toString()}`);
                };
                return (
                  <div
                    key={log.id}
                    className={cn(
                      'group flex gap-1.5 text-[10px] leading-tight rounded px-1',
                      hasLink && 'cursor-pointer hover:bg-muted',
                    )}
                    onClick={hasLink ? goto : undefined}
                    role={hasLink ? 'button' : undefined}
                    tabIndex={hasLink ? 0 : undefined}
                    onKeyDown={
                      hasLink
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              goto();
                            }
                          }
                        : undefined
                    }
                    title={hasLink ? '클릭하면 해당 대화로 이동' : undefined}
                  >
                    <span className="text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span
                      className={cn(
                        'break-all flex-1',
                        LEVEL_STYLES[log.level] ?? 'text-muted-foreground',
                      )}
                    >
                      {log.message}
                    </span>
                    {hasLink && (
                      <Link2 className="h-2.5 w-2.5 shrink-0 text-primary/60 opacity-0 group-hover:opacity-100 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
