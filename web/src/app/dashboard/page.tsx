'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  MessageSquare,
  Monitor,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import type { Agent, Message } from '@/lib/supabase/types';

/** 시간 차이를 한국어 상대 시간으로 변환 */
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

/** system_info JSON 요약 */
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

/** 상태 설정 */
const statusConfig = {
  online: { label: '온라인', color: 'bg-green-500', textColor: 'text-green-500', icon: Wifi },
  offline: { label: '오프라인', color: 'bg-gray-400', textColor: 'text-gray-400', icon: WifiOff },
  busy: { label: '작업 중', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Loader2 },
} as const;

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentMessages, setRecentMessages] = useState<(Message & { agent_name?: string })[]>([]);
  const [errorMessages, setErrorMessages] = useState<(Message & { agent_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    // 에이전트 목록
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    const agentList = (agentData ?? []) as Agent[];
    setAgents(agentList);

    // 에이전트 이름 매핑
    const agentMap = new Map(agentList.map((a) => [a.id, a.name]));

    // 최근 완료 메시지 10개
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
        }))
      );
    }

    // 에러 메시지 5개
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
        }))
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const onlineCount = agents.filter((a) => a.status === 'online' || a.status === 'busy').length;
  const offlineCount = agents.filter((a) => a.status === 'offline').length;

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <h1 className="font-semibold text-base">Agent Control Panel - 대시보드</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={refreshing}
              title="새로고침"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/tools">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                도구
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                채팅
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-4 max-w-5xl mx-auto space-y-4">
        {/* 1. 전체 현황 카드 */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            전체 현황
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">총 PC</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">{onlineCount}</p>
              <p className="text-xs text-muted-foreground mt-1">온라인</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-400">{offlineCount}</p>
              <p className="text-xs text-muted-foreground mt-1">오프라인</p>
            </div>
          </div>
        </div>

        {/* 2. PC별 상태 카드 */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            PC 상태
          </h2>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              등록된 PC가 없습니다
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {agents.map((agent) => {
                const status = statusConfig[agent.status];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{agent.name}</p>
                        <Badge
                          variant={agent.status === 'online' ? 'default' : agent.status === 'busy' ? 'secondary' : 'outline'}
                          className="text-[10px] shrink-0"
                        >
                          {agent.status === 'busy' ? (
                            <StatusIcon className="h-2.5 w-2.5 animate-spin mr-0.5" />
                          ) : (
                            <div className={`h-1.5 w-1.5 rounded-full ${status.color} mr-0.5`} />
                          )}
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {agent.last_heartbeat && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(agent.last_heartbeat)}
                          </span>
                        )}
                        {agent.system_info && Object.keys(agent.system_info).length > 0 && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {formatSystemInfo(agent.system_info)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 2컬럼: 최근 작업 + 에러 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 3. 최근 작업 카드 */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              최근 완료 작업
            </h2>
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                완료된 작업이 없습니다
              </p>
            ) : (
              <ScrollArea className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-lg border p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {msg.agent_name}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {msg.content.substring(0, 100)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* 4. 에러 카드 */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              최근 에러
            </h2>
            {errorMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                에러가 없습니다
              </p>
            ) : (
              <ScrollArea className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {errorMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="destructive" className="text-[10px]">
                          {msg.agent_name}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-red-400 line-clamp-2">
                        {msg.error_message ?? msg.content.substring(0, 100)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
