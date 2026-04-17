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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { AddPCDialog } from '@/components/sidebar/AddPCDialog';
import { ScheduleManager } from '@/components/sidebar/ScheduleManager';
import { WebhookSetting } from '@/components/sidebar/WebhookSetting';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AccountTab } from '@/components/settings/AccountTab';
import { UsageGuide } from '@/components/settings/UsageGuide';
import { useAgents } from '@/lib/hooks/useAgents';
import { cn } from '@/lib/utils';
import type { Agent } from '@/lib/supabase/types';

type TabKey = 'pcs' | 'schedule' | 'webhook' | 'harness' | 'account' | 'guide';

const TABS: { key: TabKey; label: string; icon: typeof Monitor }[] = [
  { key: 'pcs', label: 'PC', icon: Monitor },
  { key: 'schedule', label: '예약', icon: CalendarClock },
  { key: 'webhook', label: '웹훅', icon: Webhook },
  { key: 'harness', label: '하네스', icon: FileCode },
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

  const handleRestart = async (agentId: string) => {
    await supabase
      .from('agents')
      .update({ restart_requested: true })
      .eq('id', agentId);
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
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
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
                onClick={() => handleRestart(agent.id)}
                title="에이전트 재시작"
                aria-label="에이전트 재시작"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
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
  const [tab, setTab] = useState<TabKey>('pcs');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents } = useAgents();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (selectedAgentId) return;
    if (agents.length > 0) {
      const online =
        agents.find((a) => a.status === 'online' || a.status === 'busy') ??
        agents[0];
      setSelectedAgentId(online.id);
    }
  }, [agents, selectedAgentId]);

  const handleLogout = async () => {
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

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {/* 탭 */}
        <div className="grid grid-cols-6 gap-1 rounded-lg bg-muted p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex h-11 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium transition-colors',
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
