'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentLogs } from '@/components/sidebar/AgentLogs';
import {
  LayoutDashboard,
  Monitor,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
  MessageSquare,
  Wifi,
  WifiOff,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Agent, Message } from '@/lib/supabase/types';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatSystemInfo(info: Record<string, unknown>): string {
  const parts: string[] = [];
  if (info.cpu) {
    const cpuStr = String(info.cpu);
    const match = cpuStr.match(/[iIrR][3579]-?\w+/);
    parts.push(match ? match[0] : cpuStr.substring(0, 20));
  }
  if (info.totalMemory) parts.push(String(info.totalMemory));
  if (info.cores) parts.push(`${info.cores}코어`);
  return parts.join(' \u00b7 ') || '-';
}

const STATUS = {
  online: {
    label: '온라인',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    icon: Wifi,
  },
  busy: {
    label: '작업 중',
    dot: 'bg-amber-500 animate-pulse',
    text: 'text-amber-400',
    bg: 'bg-amber-500/15',
    icon: Play,
  },
  offline: {
    label: '오프라인',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
    bg: 'bg-zinc-500/15',
    icon: WifiOff,
  },
} as const;

function StatusPill({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        s.bg,
        s.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

type TabKey = 'recent' | 'errors';

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentMessages, setRecentMessages] = useState<
    (Message & { agent_name?: string })[]
  >([]);
  const [errorMessages, setErrorMessages] = useState<
    (Message & { agent_name?: string })[]
  >([]);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>('recent');
  const [logAgentId, setLogAgentId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    const agentList = (agentData ?? []) as Agent[];
    setAgents(agentList);
    if (!logAgentId && agentList.length > 0) {
      const online =
        agentList.find((a) => a.status === 'online' || a.status === 'busy') ??
        agentList[0];
      setLogAgentId(online.id);
    }

    const agentMap = new Map(agentList.map((a) => [a.id, a.name]));

    const { data: recentData } = await supabase
      .from('messages')
      .select('*')
      .eq('role', 'assistant')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentData) {
      setRecentMessages(
        (recentData as Message[]).map((m) => ({
          ...m,
          agent_name: agentMap.get(m.agent_id) ?? '알 수 없음',
        })),
      );
    }

    const { data: errorData } = await supabase
      .from('messages')
      .select('*')
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(5);

    if (errorData) {
      setErrorMessages(
        (errorData as Message[]).map((m) => ({
          ...m,
          agent_name: agentMap.get(m.agent_id) ?? '알 수 없음',
        })),
      );
    }

    // 오늘 작업 통계 (assistant 메시지 기준)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayData } = await supabase
      .from('messages')
      .select('status')
      .eq('role', 'assistant')
      .gte('created_at', todayStart.toISOString());

    if (todayData) {
      const msgs = todayData as { status: string }[];
      setTodayStats({
        total: msgs.length,
        completed: msgs.filter((m) => m.status === 'completed').length,
        errors: msgs.filter((m) => m.status === 'error').length,
        cancelled: msgs.filter((m) => m.status === 'cancelled').length,
      });
    }

    setLoading(false);
  }, [supabase, logAgentId]);

  useEffect(() => {
    fetchData();

  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const onlineCount = agents.filter(
    (a) => a.status === 'online' || a.status === 'busy',
  ).length;
  const offlineCount = agents.filter((a) => a.status === 'offline').length;

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-4">
          <LayoutDashboard className="h-5 w-5" />
          <h1 className="text-base font-semibold">현황</h1>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="새로고침"
              title="새로고침"
            >
              <RefreshCw
                className={cn('h-5 w-5', refreshing && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        {/* 전체 현황 */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            전체 현황
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{agents.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">총 PC</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{onlineCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">온라인</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-zinc-400">{offlineCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">오프라인</p>
            </div>
          </div>
        </section>

        {/* 오늘 작업 통계 */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            오늘 작업
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{todayStats.total}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">총 작업</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{todayStats.completed}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">완료</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{todayStats.errors}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">오류</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-400">{todayStats.cancelled}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">취소</p>
            </div>
          </div>
          {todayStats.total > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.round((todayStats.completed / todayStats.total) * 100)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-emerald-400">
                {Math.round((todayStats.completed / todayStats.total) * 100)}%
              </span>
            </div>
          )}
        </section>

        {/* PC 상태 */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PC 상태
          </h2>
          {agents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              등록된 PC가 없습니다
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/chat?agent=${agent.id}`}
                  className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {agent.name}
                      </p>
                      <StatusPill status={agent.status} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      {agent.last_heartbeat && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo(agent.last_heartbeat)}
                        </span>
                      )}
                      {agent.system_info &&
                        Object.keys(agent.system_info).length > 0 && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="truncate text-[11px] text-muted-foreground">
                              {formatSystemInfo(agent.system_info)}
                            </span>
                          </>
                        )}
                    </div>
                  </div>
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 최근 작업 / 에러 (탭) */}
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setTab('recent')}
              className={cn(
                'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors',
                tab === 'recent'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              최근 완료 {recentMessages.length > 0 && `(${recentMessages.length})`}
            </button>
            <button
              type="button"
              onClick={() => setTab('errors')}
              className={cn(
                'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors',
                tab === 'errors'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-3.5 w-3.5',
                  errorMessages.length > 0 && 'text-red-400',
                )}
              />
              에러 {errorMessages.length > 0 && `(${errorMessages.length})`}
            </button>
          </div>

          {tab === 'recent' ? (
            recentMessages.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                완료된 작업이 없습니다
              </p>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="space-y-1 rounded-lg border p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                          {msg.agent_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeAgo(msg.created_at)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {msg.content.substring(0, 140)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )
          ) : errorMessages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              에러가 없습니다
            </p>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {errorMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="space-y-1 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">
                        {msg.agent_name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(msg.created_at)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-red-400">
                      {msg.error_message ?? msg.content.substring(0, 140)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </section>

        {/* 에이전트 로그 */}
        {agents.length > 0 && (
          <section className="rounded-xl border bg-card p-1.5">
            <div className="flex items-center gap-2 px-3 pt-2 pb-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                에이전트 로그
              </h2>
              <select
                value={logAgentId ?? ''}
                onChange={(e) => setLogAgentId(e.target.value || null)}
                className="ml-auto h-7 rounded-md border bg-background px-2 text-xs"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-t">
              <AgentLogs agentId={logAgentId} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
