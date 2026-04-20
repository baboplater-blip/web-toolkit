'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentLogs } from '@/components/sidebar/AgentLogs';
import { PullToRefresh } from '@/components/chat/PullToRefresh';
import { OfficeView } from '@/components/dashboard/OfficeView';
import { OverallStatusCard } from '@/components/dashboard/OverallStatusCard';
import { TodayStatsCard } from '@/components/dashboard/TodayStatsCard';
import { ByokUsageCard } from '@/components/dashboard/ByokUsageCard';
import { ErrorCategoriesCard } from '@/components/dashboard/ErrorCategoriesCard';
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
  CalendarClock,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isVersionOutdated, RECOMMENDED_AGENT_VERSION } from '@/lib/agent-version';
import { classifyError, type ErrorCategory } from '@/lib/error-classify';
import type { Agent, Message, Schedule } from '@/lib/supabase/types';

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

/**
 * 최근 7일 일간 완료량 시각화. 오늘은 가장 오른쪽 칸.
 * 값 전부 0 이면 옅은 회색 바로 렌더. 최댓값 기준 정규화.
 */
function Sparkline({
  values,
  tone = 'success',
  labelPrefix = '최근 7일 완료',
}: {
  values: number[];
  tone?: 'success' | 'danger';
  labelPrefix?: string;
}) {
  const padded = values.length === 7 ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...padded);
  const total = padded.reduce((a, b) => a + b, 0);
  const colorFull = tone === 'danger' ? 'bg-rose-500' : 'bg-emerald-500';
  const colorDim = tone === 'danger' ? 'bg-rose-500/60' : 'bg-emerald-500/60';
  return (
    <span
      className="inline-flex items-end gap-[1px] h-3 shrink-0"
      title={`${labelPrefix}: 총 ${total} · 일별 [${padded.join(', ')}]`}
      aria-label={`${labelPrefix} ${padded.join(', ')}`}
    >
      {padded.map((v, i) => {
        const h = Math.max(1, Math.round((v / max) * 10));
        const isToday = i === padded.length - 1;
        return (
          <span
            key={i}
            className={cn(
              'w-[3px] rounded-sm',
              v === 0 ? 'bg-muted' : isToday ? colorFull : colorDim,
            )}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </span>
  );
}

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
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(0);
  const [tab, setTab] = useState<TabKey>('recent');
  const [logAgentId, setLogAgentId] = useState<string | null>(null);

  /** 에이전트별 오늘 처리 결과 count — PC 카드 배지에 표시 */
  const [perAgentToday, setPerAgentToday] = useState<
    Record<string, { completed: number; error: number }>
  >({});

  /**
   * 에이전트별 최근 7일 일간 완료량 (가장 오래된 날 → 오늘 순 7칸).
   * 스파크라인 높이 스케일링에 사용.
   */
  const [perAgentWeekly, setPerAgentWeekly] = useState<Record<string, number[]>>(
    {},
  );

  /** 에이전트별 최근 7일 에러 일간 분포 — 빨간 스파크라인. */
  const [perAgentWeeklyErrors, setPerAgentWeeklyErrors] = useState<
    Record<string, number[]>
  >({});

  /** 최근 7일 에러 메시지 카테고리별 카운트 */
  const [errorCategories, setErrorCategories] = useState<Record<ErrorCategory, number>>(
    {} as Record<ErrorCategory, number>,
  );
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<ErrorCategory | null>(
    null,
  );

  const [schedules, setSchedules] = useState<Array<Schedule & { agent_name?: string }>>([]);

  /** 이번 달 👍 받은 메시지 Top 3 + 월간 요약. */
  const [monthlyReport, setMonthlyReport] = useState<{
    totalUp: number;
    totalDown: number;
    totalCompleted: number;
    totalError: number;
    avgDurationSec: number | null;
    mostActiveAgent: { id: string; name: string; count: number } | null;
    topUp: Array<{ id: string; agent_id: string; conversation_id: string; content: string; created_at: string; agent_name: string }>;
    monthLabel: string;
  } | null>(null);

  /**
   * BYOK 에이전트별 이번 달 사용량 집계.
   * 응답(assistant, completed) 문자 수 합계 → 대략적 토큰 추정(chars/4).
   * 정밀 요금 추적이 아니라 "이 달에 얼마나 썼는지" 가늠용 지표.
   */
  const [byokUsage, setByokUsage] = useState<
    Record<string, { calls: number; chars: number }>
  >({});

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

    // 오늘 작업 통계 (assistant 메시지 기준). agent_id 까지 함께 집계해서 PC 카드 배지에도 쓴다.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayData } = await supabase
      .from('messages')
      .select('status, agent_id')
      .eq('role', 'assistant')
      .gte('created_at', todayStart.toISOString());

    if (todayData) {
      const msgs = todayData as { status: string; agent_id: string }[];
      setTodayStats({
        total: msgs.length,
        completed: msgs.filter((m) => m.status === 'completed').length,
        errors: msgs.filter((m) => m.status === 'error').length,
        cancelled: msgs.filter((m) => m.status === 'cancelled').length,
      });

      const perAgent: Record<string, { completed: number; error: number }> = {};
      for (const m of msgs) {
        if (!m.agent_id) continue;
        const bucket = perAgent[m.agent_id] ?? { completed: 0, error: 0 };
        if (m.status === 'completed') bucket.completed += 1;
        else if (m.status === 'error') bucket.error += 1;
        perAgent[m.agent_id] = bucket;
      }
      setPerAgentToday(perAgent);
    }

    // 최근 7일 일간 완료량/에러량 (agent별) — 스파크라인용. 오늘 포함 정확히 7칸.
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const { data: weekData } = await supabase
      .from('messages')
      .select('agent_id, created_at, status, error_message, content')
      .eq('role', 'assistant')
      .in('status', ['completed', 'error'])
      .gte('created_at', weekStart.toISOString())
      .limit(10000);

    if (weekData) {
      const weekly: Record<string, number[]> = {};
      const weeklyErrors: Record<string, number[]> = {};
      const categoryCounts: Record<ErrorCategory, number> = {} as Record<
        ErrorCategory,
        number
      >;
      for (const row of weekData as {
        agent_id: string;
        created_at: string;
        status: string;
        error_message: string | null;
        content: string | null;
      }[]) {
        if (!row.agent_id) continue;
        const when = new Date(row.created_at);
        when.setHours(0, 0, 0, 0);
        const dayIndex = Math.floor(
          (when.getTime() - weekStart.getTime()) / 86_400_000,
        );
        if (dayIndex < 0 || dayIndex > 6) continue;
        if (row.status === 'completed') {
          const bucket = weekly[row.agent_id] ?? [0, 0, 0, 0, 0, 0, 0];
          bucket[dayIndex] += 1;
          weekly[row.agent_id] = bucket;
        } else if (row.status === 'error') {
          const bucket = weeklyErrors[row.agent_id] ?? [0, 0, 0, 0, 0, 0, 0];
          bucket[dayIndex] += 1;
          weeklyErrors[row.agent_id] = bucket;
          const { category } = classifyError(row.error_message, row.content);
          categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
        }
      }
      setPerAgentWeekly(weekly);
      setPerAgentWeeklyErrors(weeklyErrors);
      setErrorCategories(categoryCounts);
    }

    // 월간 반응 리포트 — 이번 달 메시지 집계 (리액션·완료·에러·평균시간·가장 활발한 PC).
    {
      const monthStartR = new Date();
      monthStartR.setDate(1);
      monthStartR.setHours(0, 0, 0, 0);
      const [reactRes, perfRes] = await Promise.all([
        supabase
          .from('messages')
          .select('id, agent_id, conversation_id, content, created_at, reaction')
          .not('reaction', 'is', null)
          .gte('created_at', monthStartR.toISOString())
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('messages')
          .select('agent_id, status, created_at, updated_at')
          .eq('role', 'assistant')
          .gte('created_at', monthStartR.toISOString())
          .limit(20_000),
      ]);
      const reactionRows = (reactRes.data ?? []) as Array<{
        id: string;
        agent_id: string;
        conversation_id: string;
        content: string;
        created_at: string;
        reaction: 'up' | 'down' | 'curious' | null;
      }>;
      const perfRows = (perfRes.data ?? []) as Array<{
        agent_id: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>;

      const ups = reactionRows.filter((r) => r.reaction === 'up');
      const downs = reactionRows.filter((r) => r.reaction === 'down');
      const topUp = ups.slice(0, 3).map((r) => ({
        id: r.id,
        agent_id: r.agent_id,
        conversation_id: r.conversation_id,
        content: r.content,
        created_at: r.created_at,
        agent_name: agentMap.get(r.agent_id) ?? '알 수 없음',
      }));

      let totalCompleted = 0;
      let totalError = 0;
      let durSum = 0;
      let durN = 0;
      const perAgentCount = new Map<string, number>();
      for (const r of perfRows) {
        if (r.status === 'completed') {
          totalCompleted += 1;
          const dur =
            new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
          if (dur > 0 && dur < 10 * 60 * 1000) {
            // 10분 넘는 건 타임아웃/비정상으로 간주하고 평균에서 제외.
            durSum += dur;
            durN += 1;
          }
        } else if (r.status === 'error') {
          totalError += 1;
        }
        perAgentCount.set(r.agent_id, (perAgentCount.get(r.agent_id) ?? 0) + 1);
      }
      let mostActive: { id: string; name: string; count: number } | null = null;
      for (const [id, count] of perAgentCount) {
        if (!mostActive || count > mostActive.count) {
          mostActive = { id, name: agentMap.get(id) ?? '알 수 없음', count };
        }
      }
      setMonthlyReport({
        totalUp: ups.length,
        totalDown: downs.length,
        totalCompleted,
        totalError,
        avgDurationSec: durN > 0 ? Math.round(durSum / durN / 1000) : null,
        mostActiveAgent: mostActive,
        topUp,
        monthLabel: `${monthStartR.getFullYear()}년 ${monthStartR.getMonth() + 1}월`,
      });
    }

    // 예약 스케줄 현황 — enabled 위주, 최근 실행 순.
    {
      const { data: schedData } = await supabase
        .from('schedules')
        .select('*')
        .eq('enabled', true)
        .order('next_run', { ascending: true, nullsFirst: false })
        .limit(10);
      if (schedData) {
        setSchedules(
          (schedData as Schedule[]).map((s) => ({
            ...s,
            agent_name: agentMap.get(s.agent_id) ?? '알 수 없음',
          })),
        );
      }
    }

    // BYOK 사용량 — 이번 달 BYOK 에이전트들의 완료된 응답만 집계.
    const byokIds = agentList.filter((a) => a.api_mode === 'byok').map((a) => a.id);
    if (byokIds.length > 0) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data: usageData } = await supabase
        .from('messages')
        .select('agent_id, content')
        .in('agent_id', byokIds)
        .eq('role', 'assistant')
        .eq('status', 'completed')
        .gte('created_at', monthStart.toISOString())
        .limit(5000);
      if (usageData) {
        const agg: Record<string, { calls: number; chars: number }> = {};
        for (const row of usageData as { agent_id: string; content: string | null }[]) {
          if (!row.agent_id) continue;
          const bucket = agg[row.agent_id] ?? { calls: 0, chars: 0 };
          bucket.calls += 1;
          bucket.chars += (row.content ?? '').length;
          agg[row.agent_id] = bucket;
        }
        setByokUsage(agg);
      }
    } else {
      setByokUsage({});
    }

    setLoading(false);
    setLastFetchedAt(Date.now());
  }, [supabase, logAgentId]);

  useEffect(() => {
    // 최초 마운트 시 + 탭 복귀 시 + 60초 주기 자동 refresh.
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <PullToRefresh onRefresh={handleRefresh} />
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-4">
          <LayoutDashboard className="h-5 w-5" />
          <h1 className="text-base font-semibold">현황</h1>
          <div className="ml-auto flex items-center gap-2">
            {lastFetchedAt > 0 && (
              <span
                className="hidden sm:inline text-[10px] text-muted-foreground"
                title={new Date(lastFetchedAt).toLocaleString('ko-KR')}
              >
                {timeAgo(new Date(lastFetchedAt).toISOString())} 갱신
              </span>
            )}
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

      {/* 사무실 뷰 — PC 별 캐릭터 + 현재 작업 */}
      <OfficeView agents={agents} />

      <main id="main-content" className="mx-auto max-w-5xl space-y-4 p-4">
        <OverallStatusCard
          total={agents.length}
          online={onlineCount}
          offline={offlineCount}
        />

        <TodayStatsCard stats={todayStats} />

        <ByokUsageCard agents={agents} usage={byokUsage} />

        <ErrorCategoriesCard
          categories={errorCategories}
          selected={selectedErrorCategory}
          onSelect={setSelectedErrorCategory}
        />

        {/* 예약 스케줄 현황 */}
        {schedules.length > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                다음 예약 실행
              </h2>
              <Link
                href="/settings?tab=schedule"
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                전체 보기
              </Link>
            </div>
            <div className="space-y-1.5">
              {schedules.slice(0, 5).map((s) => {
                const next = s.next_run ? new Date(s.next_run) : null;
                const overdue = next && next.getTime() < Date.now();
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border bg-background p-2"
                  >
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                      {s.agent_name}
                    </span>
                    <p className="flex-1 min-w-0 truncate text-xs">{s.prompt}</p>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-[10px]',
                        overdue ? 'text-rose-400' : 'text-muted-foreground',
                      )}
                      title={next ? next.toLocaleString('ko-KR') : ''}
                    >
                      {next
                        ? overdue
                          ? '대기 중'
                          : next.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                        : '—'}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const { error } = await supabase
                          .from('schedules')
                          .update({ enabled: false })
                          .eq('id', s.id);
                        if (!error) {
                          setSchedules((prev) => prev.filter((x) => x.id !== s.id));
                        }
                      }}
                      className="shrink-0 rounded text-muted-foreground hover:text-rose-400 px-1 py-0.5 text-[10px]"
                      title="이 예약 일시중지"
                      aria-label="예약 일시중지"
                    >
                      일시중지
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 이번 달 리포트 — 완료/에러/평균시간/가장 활발한 PC/반응 */}
        {monthlyReport && (monthlyReport.totalCompleted + monthlyReport.totalError) > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {monthlyReport.monthLabel} 월간 리포트
              </h2>
              <span className="text-xs text-muted-foreground">
                👍 {monthlyReport.totalUp} · 👎 {monthlyReport.totalDown}
              </span>
            </div>

            {/* 월간 KPI — 2x2 그리드 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg border bg-background p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">완료</p>
                <p className="text-lg font-bold text-emerald-400">
                  {monthlyReport.totalCompleted.toLocaleString('ko-KR')}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">에러</p>
                <p className={cn(
                  'text-lg font-bold',
                  monthlyReport.totalError > 0 ? 'text-rose-400' : 'text-muted-foreground',
                )}>
                  {monthlyReport.totalError.toLocaleString('ko-KR')}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">평균 응답</p>
                <p className="text-lg font-bold">
                  {monthlyReport.avgDurationSec !== null
                    ? monthlyReport.avgDurationSec < 60
                      ? `${monthlyReport.avgDurationSec}초`
                      : `${Math.round(monthlyReport.avgDurationSec / 6) / 10}분`
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">가장 활발한 PC</p>
                <p className="text-sm font-bold truncate" title={monthlyReport.mostActiveAgent?.name}>
                  {monthlyReport.mostActiveAgent?.name ?? '—'}
                </p>
                {monthlyReport.mostActiveAgent && (
                  <p className="text-[10px] text-muted-foreground">
                    {monthlyReport.mostActiveAgent.count.toLocaleString('ko-KR')} 건
                  </p>
                )}
              </div>
            </div>
            {monthlyReport.topUp.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  이번 달 가장 마음에 든 응답 Top 3
                </p>
                {monthlyReport.topUp.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/chat?agent=${r.agent_id}&conversation=${r.conversation_id}&message=${r.id}`}
                    className="block rounded-lg border bg-background p-3 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
                        {i + 1}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                        {r.agent_name}
                      </span>
                      <span className="ml-auto">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs">{r.content.slice(0, 200)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                아직 이번 달 👍 반응이 없습니다.
              </p>
            )}
          </section>
        )}

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
                      <Sparkline values={perAgentWeekly[agent.id] ?? [0, 0, 0, 0, 0, 0, 0]} />
                      {(perAgentWeeklyErrors[agent.id]?.reduce((a, b) => a + b, 0) ?? 0) > 0 && (
                        <Sparkline
                          values={perAgentWeeklyErrors[agent.id] ?? [0, 0, 0, 0, 0, 0, 0]}
                          tone="danger"
                          labelPrefix="최근 7일 에러"
                        />
                      )}
                      {(() => {
                        const w = perAgentWeekly[agent.id] ?? [0, 0, 0, 0, 0, 0, 0];
                        const we = perAgentWeeklyErrors[agent.id] ?? [0, 0, 0, 0, 0, 0, 0];
                        const totalW = w.reduce((a, b) => a + b, 0);
                        const totalE = we.reduce((a, b) => a + b, 0);
                        const denom = totalW + totalE;
                        if (denom < 3 || totalE === 0) return null;
                        const pct = Math.round((totalE / denom) * 100);
                        return (
                          <span
                            className="text-[10px] font-semibold text-rose-400"
                            title={`최근 7일 에러율 ${totalE}/${denom}`}
                          >
                            {pct}% 에러
                          </span>
                        );
                      })()}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
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
                      {(() => {
                        const today = perAgentToday[agent.id];
                        if (!today || (today.completed === 0 && today.error === 0)) return null;
                        return (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="text-[11px] text-emerald-400">
                              ✓ {today.completed}
                            </span>
                            {today.error > 0 && (
                              <span className="text-[11px] text-red-400">
                                ✗ {today.error}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">오늘</span>
                          </>
                        );
                      })()}
                      {agent.api_mode === 'byok' && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span
                            className="rounded-sm border border-violet-500/40 bg-violet-500/10 px-1 py-[1px] text-[9px] font-semibold text-violet-400 uppercase tracking-wider"
                            title="Anthropic API 키로 동작 (BYOK)"
                          >
                            API
                          </span>
                        </>
                      )}
                      {isVersionOutdated(agent.agent_version) && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span
                            className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-1 py-[1px] text-[9px] font-semibold text-amber-400 uppercase tracking-wider"
                            title={`현재 v${agent.agent_version} · 권장 v${RECOMMENDED_AGENT_VERSION}`}
                          >
                            업데이트
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
                  {recentMessages.map((msg) => {
                    const href = `/chat?agent=${msg.agent_id}&conversation=${msg.conversation_id}&message=${msg.id}`;
                    return (
                      <Link
                        key={msg.id}
                        href={href}
                        className="block space-y-1 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 hover:border-primary/40"
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
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            )
          ) : (() => {
            const filtered = selectedErrorCategory
              ? errorMessages.filter(
                  (m) =>
                    classifyError(m.error_message, m.content).category ===
                    selectedErrorCategory,
                )
              : errorMessages;
            if (filtered.length === 0) {
              return (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {selectedErrorCategory
                    ? '이 카테고리 에러가 없습니다'
                    : '에러가 없습니다'}
                </p>
              );
            }
            return (
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {filtered.map((msg) => {
                  const href = `/chat?agent=${msg.agent_id}&conversation=${msg.conversation_id}&message=${msg.id}`;
                  return (
                    <Link
                      key={msg.id}
                      href={href}
                      className="block space-y-1 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 transition-colors hover:bg-red-500/10 hover:border-red-500/40"
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
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
            );
          })()}
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
