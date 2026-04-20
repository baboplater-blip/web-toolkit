'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings2,
  Monitor,
  CalendarClock,
  Webhook,
  FileCode,
  LogOut,
  RotateCw,
  ExternalLink,
  ChevronRight,
  UserCircle,
  HelpCircle,
  Link2,
  Inbox,
  Activity,
  FileDown,
  Trash2,
  Timer,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { markIntentionalSignOut } from '@/components/SessionRecovery';
import { clearAllOfflineSnapshots } from '@/lib/offline-cache';
import { clearOutbox } from '@/lib/outbox';
import { Button } from '@/components/ui/button';
import { AddPCDialog } from '@/components/sidebar/AddPCDialog';
import { ScheduleManager } from '@/components/sidebar/ScheduleManager';
import { WebhookSetting } from '@/components/sidebar/WebhookSetting';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AccountTab } from '@/components/settings/AccountTab';
import { UsageGuide } from '@/components/settings/UsageGuide';
import { PushToggle } from '@/components/settings/PushToggle';
import { SharedLinksTab } from '@/components/settings/SharedLinksTab';
import { OutboxTab } from '@/components/settings/OutboxTab';
import { DiagnosticsTab } from '@/components/settings/DiagnosticsTab';
import { useAgents } from '@/lib/hooks/useAgents';
import { cn } from '@/lib/utils';
import type { Agent } from '@/lib/supabase/types';

type TabKey = 'pcs' | 'schedule' | 'webhook' | 'harness' | 'share' | 'outbox' | 'diagnostics' | 'account' | 'guide';

const TABS: { key: TabKey; label: string; icon: typeof Monitor }[] = [
  { key: 'pcs', label: 'PC', icon: Monitor },
  { key: 'schedule', label: '예약', icon: CalendarClock },
  { key: 'webhook', label: '웹훅', icon: Webhook },
  { key: 'harness', label: '하네스', icon: FileCode },
  { key: 'share', label: '공유', icon: Link2 },
  { key: 'outbox', label: '오프라인 큐', icon: Inbox },
  { key: 'diagnostics', label: '진단', icon: Activity },
  { key: 'account', label: '계정', icon: UserCircle },
  { key: 'guide', label: '가이드', icon: HelpCircle },
];

const STATUS_DOT = {
  online: 'bg-emerald-500',
  busy: 'bg-amber-500 animate-pulse',
  offline: 'bg-zinc-500',
} as const;

const STATUS_LABEL = {
  online: '온라인',
  busy: '작업 중',
  offline: '오프라인',
} as const;

function PCManagementTab({ agents }: { agents: Agent[] }) {
  const supabase = createClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [logOptionsOpen, setLogOptionsOpen] = useState<string | null>(null);
  const [timeoutEditingId, setTimeoutEditingId] = useState<string | null>(null);
  const [timeoutDraft, setTimeoutDraft] = useState<string>('');
  const [timeoutSaving, setTimeoutSaving] = useState(false);
  const [logDays, setLogDays] = useState<number>(7);
  const [logLevels, setLogLevels] = useState<Set<'info' | 'warn' | 'error'>>(
    new Set(['info', 'warn', 'error']),
  );
  const [logKeyword, setLogKeyword] = useState<string>('');

  const handleRestart = async (agentId: string) => {
    await supabase
      .from('agents')
      .update({ restart_requested: true })
      .eq('id', agentId);
  };

  const handleSaveTimeout = async (agent: Agent) => {
    const raw = timeoutDraft.trim();
    const parsed = raw === '' ? null : parseInt(raw, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 1 || parsed > 720)) {
      alert('1 ~ 720 분 사이 숫자로 입력해주세요 (비워두면 기본값 30분 사용).');
      return;
    }
    setTimeoutSaving(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({ task_timeout_minutes: parsed })
        .eq('id', agent.id);
      if (error) {
        alert(`저장 실패: ${error.message}`);
        return;
      }
      setTimeoutEditingId(null);
    } finally {
      setTimeoutSaving(false);
    }
  };

  const handleDelete = async (agent: Agent) => {
    const confirmText = `정말로 "${agent.name}" 을(를) 삭제할까요?\n\n⚠️ 이 PC 의 모든 대화·메시지·하네스·예약·로그가 함께 삭제됩니다. 되돌릴 수 없습니다.`;
    if (!confirm(confirmText)) return;
    const { error } = await supabase.from('agents').delete().eq('id', agent.id);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    // useAgents 는 Realtime 으로 자동 갱신되지만, Realtime 채널이 늦는 경우를 대비해 즉시 페이지 리로드.
    window.location.reload();
  };

  const handleDownloadLogs = async (agent: Agent) => {
    setDownloadingId(agent.id);
    try {
      const sinceIso = new Date(Date.now() - logDays * 24 * 60 * 60 * 1000).toISOString();
      const levels = Array.from(logLevels);
      let q = supabase
        .from('agent_logs')
        .select('created_at, level, message, conversation_id, message_id')
        .eq('agent_id', agent.id)
        .gte('created_at', sinceIso);
      if (levels.length > 0 && levels.length < 3) {
        q = q.in('level', levels);
      }
      const kw = logKeyword.trim();
      if (kw) {
        const escaped = kw.replace(/[%_]/g, (m) => '\\' + m);
        q = q.ilike('message', `%${escaped}%`);
      }
      const { data, error } = await q
        .order('created_at', { ascending: true })
        .limit(20_000);
      if (error) {
        alert(`로그 조회 실패: ${error.message}`);
        return;
      }
      const rows = (data ?? []) as Array<{
        created_at: string;
        level: string;
        message: string;
        conversation_id: string | null;
        message_id: string | null;
      }>;
      if (rows.length === 0) {
        alert('조건에 맞는 로그가 없습니다.');
        return;
      }
      const header = 'ts,level,conversation_id,message_id,message\n';
      const body = rows
        .map(
          (r) =>
            `${r.created_at},${r.level},${r.conversation_id ?? ''},${r.message_id ?? ''},"${(
              r.message ?? ''
            ).replace(/"/g, '""')}"`,
        )
        .join('\n');
      const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `agent-logs-${agent.name}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLogOptionsOpen(null);
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleLogLevel = (lvl: 'info' | 'warn' | 'error') => {
    setLogLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      if (next.size === 0) return prev; // 최소 한 개는 유지
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-3">
        <AddPCDialog />
      </div>

      {agents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          등록된 PC가 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    STATUS_DOT[agent.status],
                  )}
                  aria-label={STATUS_LABEL[agent.status]}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {STATUS_LABEL[agent.status]}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  onClick={() =>
                    setLogOptionsOpen((prev) => (prev === agent.id ? null : agent.id))
                  }
                  title="로그 다운로드 옵션"
                  aria-label="로그 다운로드 옵션"
                  aria-expanded={logOptionsOpen === agent.id}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  onClick={() => {
                    if (timeoutEditingId === agent.id) {
                      setTimeoutEditingId(null);
                    } else {
                      setTimeoutEditingId(agent.id);
                      setTimeoutDraft(
                        agent.task_timeout_minutes
                          ? String(agent.task_timeout_minutes)
                          : '',
                      );
                    }
                  }}
                  title="작업 타임아웃 설정"
                  aria-label="작업 타임아웃 설정"
                >
                  <Timer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  onClick={() => handleRestart(agent.id)}
                  title="에이전트 재시작"
                  aria-label="에이전트 재시작"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => handleDelete(agent)}
                  title="PC 삭제"
                  aria-label="PC 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {timeoutEditingId === agent.id && (
                <div className="mt-3 space-y-2 rounded-lg border bg-background p-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    이 PC 의 기본 작업 타임아웃 (분). 비워두면 기본값 <b>30분</b> 사용.
                    긴 집필·분석 작업은 60~240분 권장. 최대 720분(12시간).
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={timeoutDraft}
                      onChange={(e) => setTimeoutDraft(e.target.value)}
                      placeholder="예: 60"
                      className="h-8 w-24 rounded border bg-background px-2 text-xs"
                    />
                    <span className="text-[11px] text-muted-foreground">분</span>
                    <div className="flex gap-1 ml-auto">
                      {[30, 60, 120, 240].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTimeoutDraft(String(p))}
                          className="text-[10px] px-1.5 py-0.5 rounded border bg-background hover:bg-muted"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleSaveTimeout(agent)}
                    disabled={timeoutSaving}
                  >
                    {timeoutSaving ? (
                      <RotateCw className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    저장
                  </Button>
                </div>
              )}

              {logOptionsOpen === agent.id && (
                <div className="mt-3 space-y-2 rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground w-12 shrink-0">기간</label>
                    <div className="flex gap-1">
                      {[1, 7, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setLogDays(d)}
                          className={cn(
                            'text-[11px] px-2 py-1 rounded border',
                            logDays === d
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted',
                          )}
                        >
                          {d}일
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground w-12 shrink-0">레벨</label>
                    <div className="flex gap-1">
                      {(['info', 'warn', 'error'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => toggleLogLevel(lvl)}
                          className={cn(
                            'text-[11px] px-2 py-1 rounded border',
                            logLevels.has(lvl)
                              ? lvl === 'error'
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : lvl === 'warn'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                              : 'bg-background text-muted-foreground',
                          )}
                        >
                          {lvl.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground w-12 shrink-0">키워드</label>
                    <input
                      type="text"
                      value={logKeyword}
                      onChange={(e) => setLogKeyword(e.target.value)}
                      placeholder="메시지 부분일치 (선택)"
                      className="flex-1 h-7 text-[11px] rounded border bg-background px-2"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleDownloadLogs(agent)}
                    disabled={downloadingId === agent.id}
                  >
                    {downloadingId === agent.id ? (
                      <RotateCw className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <FileDown className="h-3.5 w-3.5 mr-1" />
                    )}
                    CSV 다운로드
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentPicker({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (agents.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        먼저 PC 관리 탭에서 PC를 등록하세요
      </p>
    );
  }
  return (
    <div className="mb-3 rounded-xl border bg-card p-3">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        PC 선택
      </label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      >
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({STATUS_LABEL[a.status]})
          </option>
        ))}
      </select>
    </div>
  );
}

function HarnessTab() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">하네스 품질 분석</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            각 PC의 CLAUDE.md 파일 품질을 점수화하고 개선 명령을 전송합니다.
          </p>
        </div>
        <Link href="/harnesses" className="block">
          <Button variant="outline" className="w-full justify-between">
            하네스 분석 페이지 열기
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const initialTab = (() => {
    if (typeof window === 'undefined') return 'pcs' as TabKey;
    const p = new URLSearchParams(window.location.search).get('tab');
    const valid: TabKey[] = ['pcs', 'schedule', 'webhook', 'harness', 'share', 'outbox', 'diagnostics', 'account', 'guide'];
    return (valid as string[]).includes(p ?? '') ? (p as TabKey) : ('pcs' as TabKey);
  })();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents } = useAgents();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (selectedAgentId) return;
    if (agents.length > 0) {
      const online =
        agents.find((a) => a.status === 'online' || a.status === 'busy') ??
        agents[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAgentId(online.id);
    }
  }, [agents, selectedAgentId]);

  const handleLogout = async () => {
    markIntentionalSignOut();
    // 다른 계정으로 로그인할 수 있으니 오프라인 스냅샷·전송큐 먼저 정리.
    await Promise.all([
      clearAllOfflineSnapshots().catch(() => {}),
      clearOutbox().catch(() => {}),
    ]);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <Settings2 className="h-5 w-5" />
          <h1 className="text-base font-semibold">설정</h1>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl space-y-4 p-4">
        {/* 탭 — 가로 스크롤러. 탭 수가 늘어도 안정적으로 대응. */}
        <div className="overflow-x-auto -mx-4 px-4 pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <div className="inline-flex gap-1 rounded-lg bg-muted p-1 min-w-full">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'flex h-11 shrink-0 min-w-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-md px-2 text-[11px] font-medium transition-colors',
                  tab === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {tab === 'pcs' && <PCManagementTab agents={agents} />}

        {tab === 'schedule' && (
          <>
            <AgentPicker
              agents={agents}
              selectedId={selectedAgentId}
              onSelect={setSelectedAgentId}
            />
            {selectedAgentId && (
              <div className="rounded-xl border bg-card p-1.5">
                <ScheduleManager agentId={selectedAgentId} />
              </div>
            )}
          </>
        )}

        {tab === 'webhook' && (
          <>
            <AgentPicker
              agents={agents}
              selectedId={selectedAgentId}
              onSelect={setSelectedAgentId}
            />
            {selectedAgentId && (
              <div className="rounded-xl border bg-card p-1.5">
                <WebhookSetting agentId={selectedAgentId} />
              </div>
            )}
          </>
        )}

        {tab === 'harness' && <HarnessTab />}

        {tab === 'share' && <SharedLinksTab />}

        {tab === 'outbox' && <OutboxTab />}

        {tab === 'diagnostics' && <DiagnosticsTab />}

        {tab === 'account' && <AccountTab />}

        {tab === 'guide' && <UsageGuide />}

        {/* 앱 설정 */}
        <section className="space-y-2 pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            앱 설정
          </h2>
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">테마</p>
                <p className="text-[11px] text-muted-foreground">
                  인터페이스 색상
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="border-t">
              <PushToggle />
            </div>
            <div className="border-t">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
