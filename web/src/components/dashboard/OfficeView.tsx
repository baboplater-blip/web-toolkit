'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { Agent, Message } from '@/lib/supabase/types';
import Link from 'next/link';

/**
 * 현황 탭의 "사무실 뷰" — PC 별로 캐릭터 아바타와 현재 작업 정보를 보여준다.
 *
 * 상태별 캐릭터:
 *   - busy + streaming 메시지 있음 → 타자치는 캐릭터 👨‍💻 (shake)
 *   - online / 유휴       → 졸고 있는 캐릭터 😴 (bob)
 *   - offline            → 창이 꺼진 모니터 🌙 (어두움)
 *
 * 라이브 갱신: 경과 시간은 1초마다 재계산, 메시지 목록은 Realtime 으로 갱신.
 */

type StreamMessage = Pick<
  Message,
  'id' | 'agent_id' | 'content' | 'status' | 'role' | 'created_at' | 'updated_at' | 'conversation_id' | 'timeout_extended'
>;

type RecentOutcome = 'completed' | 'error' | 'cancelled';

interface AgentActivity {
  agent: Agent;
  streaming: StreamMessage | null;
  lastUserPrompt: string | null;
  queueDepth: number;
  recentOutcomes: RecentOutcome[];
}

function previewLines(text: string, n = 3): string[] {
  const clean = (text ?? '').trim();
  if (!clean) return [];
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const last = lines.slice(-n);
  return last.map((l) => (l.length > 120 ? l.slice(0, 120) + '…' : l));
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return '0초';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}분 ${rem}초`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}시간 ${mm}분`;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

interface OfficeViewProps {
  agents: Agent[];
}

export function OfficeView({ agents }: OfficeViewProps) {
  const [streaming, setStreaming] = useState<StreamMessage[]>([]);
  const [lastPrompts, setLastPrompts] = useState<Record<string, string>>({});
  const [recentOutcomes, setRecentOutcomes] = useState<Record<string, RecentOutcome[]>>({});
  const [queueDepths, setQueueDepths] = useState<Record<string, number>>({});
  const now = useNow(1000);

  useEffect(() => {
    if (agents.length === 0) return;
    const agentIds = agents.map((a) => a.id);
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      // 1) 진행 중 (streaming or processing) assistant 메시지
      const { data: stream } = await supabase
        .from('messages')
        .select(
          'id, agent_id, content, status, role, created_at, updated_at, conversation_id, timeout_extended',
        )
        .in('agent_id', agentIds)
        .in('status', ['streaming', 'processing'])
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(50);

      // 2) 각 PC 의 가장 최근 user 프롬프트 (최대 한 건씩)
      const { data: userMsgs } = await supabase
        .from('messages')
        .select('agent_id, content, created_at')
        .in('agent_id', agentIds)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(agentIds.length * 3);

      // 3) 최근 5개 작업 결과 (PC 별)
      const { data: recent } = await supabase
        .from('messages')
        .select('agent_id, status, created_at')
        .in('agent_id', agentIds)
        .eq('role', 'assistant')
        .in('status', ['completed', 'error', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(agentIds.length * 5);

      // 4) 큐 대기 수: role=user, status=completed 인 메시지 중 같은 대화에서 이후 assistant 응답이 없는 것
      //    dashboard 는 정확도보다 빠른 힌트가 더 중요하므로 agent 별 최근 10건만 기준으로 근사치 계산.
      const { data: recentUserForQueue } = await supabase
        .from('messages')
        .select('id, agent_id, conversation_id, status, created_at')
        .in('agent_id', agentIds)
        .eq('role', 'user')
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false })
        .limit(agentIds.length * 10);

      if (cancelled) return;

      setStreaming((stream as StreamMessage[]) ?? []);

      const firstByAgent: Record<string, string> = {};
      for (const m of (userMsgs as Array<{
        agent_id: string;
        content: string;
        created_at: string;
      }> | null) ?? []) {
        if (!firstByAgent[m.agent_id]) firstByAgent[m.agent_id] = m.content;
      }
      setLastPrompts(firstByAgent);

      const outcomes: Record<string, RecentOutcome[]> = {};
      for (const m of (recent as Array<{ agent_id: string; status: string }> | null) ?? []) {
        const arr = outcomes[m.agent_id] ?? [];
        if (arr.length < 5) {
          if (m.status === 'completed' || m.status === 'error' || m.status === 'cancelled') {
            arr.push(m.status);
          }
          outcomes[m.agent_id] = arr;
        }
      }
      setRecentOutcomes(outcomes);

      // 큐 근사치 — streaming 메시지 제외, 더 오래된 completed user 메시지 중
      // 자기보다 더 새로운 assistant 가 없는 것.
      const streamConvIds = new Set(
        ((stream as StreamMessage[]) ?? []).map((s) => s.conversation_id),
      );
      const queue: Record<string, number> = {};
      for (const m of (recentUserForQueue as Array<{
        agent_id: string;
        conversation_id: string;
        status: string;
      }> | null) ?? []) {
        if (streamConvIds.has(m.conversation_id)) continue;
        queue[m.agent_id] = (queue[m.agent_id] ?? 0) + 1;
      }
      setQueueDepths(queue);
    }

    loadAll();

    const ch = supabase
      .channel(`office-${agentIds.slice(0, 3).join('-')}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadAll();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [agents]);

  const activities = useMemo<AgentActivity[]>(() => {
    return agents.map((agent) => {
      const streamingForAgent =
        streaming.find((s) => s.agent_id === agent.id) ?? null;
      return {
        agent,
        streaming: streamingForAgent,
        lastUserPrompt: lastPrompts[agent.id] ?? null,
        queueDepth: queueDepths[agent.id] ?? 0,
        recentOutcomes: recentOutcomes[agent.id] ?? [],
      };
    });
  }, [agents, streaming, lastPrompts, queueDepths, recentOutcomes]);

  if (agents.length === 0) return null;

  return (
    <section className="px-4 pt-4">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          사무실 현황
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <OfficeCard key={a.agent.id} activity={a} nowMs={now} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfficeCard({ activity, nowMs }: { activity: AgentActivity; nowMs: number }) {
  const { agent, streaming, lastUserPrompt, queueDepth, recentOutcomes } = activity;
  const isOffline = agent.status === 'offline';
  const isBusy = !!streaming;

  const elapsed = streaming ? nowMs - new Date(streaming.created_at).getTime() : 0;
  const previews = streaming ? previewLines(streaming.content) : [];

  const bgClass = isOffline
    ? 'bg-zinc-900/40 border-zinc-700/40'
    : isBusy
    ? 'bg-sky-500/5 border-sky-500/30'
    : 'bg-emerald-500/5 border-emerald-500/20';

  return (
    <Link
      href={
        streaming?.conversation_id
          ? `/chat?pc=${agent.id}&conversation=${streaming.conversation_id}`
          : `/chat?pc=${agent.id}`
      }
      className={cn(
        'group relative overflow-hidden rounded-xl border p-3 transition hover:shadow-md hover:-translate-y-0.5',
        bgClass,
      )}
    >
      {/* 상단: 캐릭터 + 이름 + 상태 */}
      <div className="flex items-start gap-3">
        <Character state={isOffline ? 'offline' : isBusy ? 'typing' : 'sleeping'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{agent.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {isOffline
              ? '오프라인'
              : isBusy
              ? '작업 중'
              : queueDepth > 0
              ? `대기 중 ${queueDepth}건`
              : '유휴'}
          </p>
        </div>
        {queueDepth > 0 && (
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            {queueDepth} 대기
          </span>
        )}
      </div>

      {/* 진행 중 작업 */}
      {isBusy && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-background/60 p-2">
          <div className="flex items-center gap-1.5 text-[11px] text-sky-300">
            <Clock className="h-3 w-3" />
            <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
            {streaming?.timeout_extended && (
              <span className="ml-1 rounded bg-amber-500/20 px-1 text-[9px] font-semibold text-amber-300">
                연장
              </span>
            )}
          </div>
          {lastUserPrompt && (
            <p className="truncate text-[11px] text-muted-foreground">
              💬 {lastUserPrompt.slice(0, 80)}
              {lastUserPrompt.length > 80 ? '…' : ''}
            </p>
          )}
          {previews.length > 0 ? (
            <div className="space-y-0.5 rounded bg-muted/40 p-1.5 font-mono text-[10px] leading-relaxed text-foreground/80">
              {previews.map((line, i) => (
                <p key={i} className="truncate">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">응답 준비 중…</p>
          )}
          {/* 물결 진행 표시 */}
          <div className="relative h-1 overflow-hidden rounded-full bg-muted/50">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[office-wave_1.6s_linear_infinite] bg-sky-400/60" />
          </div>
        </div>
      )}

      {/* 유휴 시 최근 프롬프트 */}
      {!isBusy && !isOffline && lastUserPrompt && (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">
          최근: {lastUserPrompt.slice(0, 80)}
          {lastUserPrompt.length > 80 ? '…' : ''}
        </p>
      )}

      {/* 최근 5개 결과 */}
      {recentOutcomes.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground mr-1">최근 5:</span>
          {recentOutcomes.map((o, i) => (
            <span key={i} title={o}>
              {o === 'completed' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : o === 'error' ? (
                <XCircle className="h-3 w-3 text-rose-400" />
              ) : (
                <Loader2 className="h-3 w-3 text-zinc-500" />
              )}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function Character({ state }: { state: 'typing' | 'sleeping' | 'offline' }) {
  if (state === 'offline') {
    return (
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800/50 text-xl grayscale opacity-60">
        🌙
      </div>
    );
  }
  if (state === 'sleeping') {
    return (
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xl animate-[office-bob_2.4s_ease-in-out_infinite]">
        😴
      </div>
    );
  }
  // typing
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-xl animate-[office-shake_0.6s_ease-in-out_infinite]">
      🧑‍💻
      <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-sky-400 ring-2 ring-background" />
    </div>
  );
}
