'use client';

import { useState } from 'react';
import { ChevronDown, Monitor, RotateCw, Loader2, Wifi, WifiOff, Power, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { isVersionOutdated, RECOMMENDED_AGENT_VERSION } from '@/lib/agent-version';
import { formatOfflineDuration, formatIdleDuration } from '@/lib/format-time';
import type { Agent } from '@/lib/supabase/types';

interface PCPickerProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

const STATUS = {
  online: {
    label: '온라인',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    icon: Wifi,
  },
  busy: {
    label: '작업 중',
    dot: 'bg-amber-500 animate-pulse',
    text: 'text-amber-400',
    icon: Loader2,
  },
  offline: {
    label: '오프라인',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
    icon: WifiOff,
  },
} as const;

function formatSystemInfo(info: Record<string, unknown> | null | undefined): string {
  if (!info) return '';
  const parts: string[] = [];
  if (info.cpu) {
    const cpuStr = String(info.cpu);
    const match = cpuStr.match(/[iIrR][3579]-?\w+/);
    parts.push(match ? match[0] : cpuStr.substring(0, 20));
  }
  if (info.totalMemory) parts.push(String(info.totalMemory));
  if (info.cores) parts.push(`${info.cores}코어`);
  return parts.join(' \u00b7 ');
}

export function PCPicker({ agents, selectedId, onSelect, loading }: PCPickerProps) {
  const [open, setOpen] = useState(false);
  const [wakingId, setWakingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const supabase = createClient();
  const selected = agents.find((a) => a.id === selectedId) ?? null;

  const startRename = (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    setRenamingId(agent.id);
    setRenameDraft(agent.name);
  };

  const commitRename = async (agentId: string) => {
    const next = renameDraft.trim().slice(0, 40);
    if (!next) {
      setRenamingId(null);
      return;
    }
    const { error } = await supabase
      .from('agents')
      .update({ name: next })
      .eq('id', agentId);
    if (error) {
      toast(`이름 변경 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    setRenamingId(null);
    setRenameDraft('');
  };

  const handleRestart = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('agents')
      .update({ restart_requested: true })
      .eq('id', agentId);
    if (error) {
      toast(`재시작 요청 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    toast('재시작 요청을 보냈습니다', { variant: 'info', duration: 4000 });
  };

  const handleWake = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    setWakingId(agentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast('로그인이 필요합니다', { variant: 'warning' });
        return;
      }
      const res = await fetch('/api/agent/wake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ agent_id: agentId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        helper?: string;
        details?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast(data.details ?? data.error ?? '깨우기 실패', { variant: 'error', duration: 6000 });
        return;
      }
      toast(`"${data.helper}" 가 매직 패킷 전송 중...`, { variant: 'info', duration: 6000 });
    } finally {
      setWakingId(null);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const triggerLabel = selected ? selected.name : 'PC 선택';
  const triggerStatus = selected ? STATUS[selected.status] : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 -mx-2',
              'hover:bg-muted active:bg-muted/80 transition-colors',
              'max-w-full',
            )}
          />
        }
      >
        {triggerStatus ? (
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              triggerStatus.dot,
            )}
          />
        ) : (
          <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 truncate text-sm font-semibold">
          {triggerLabel}
        </span>
        {triggerStatus && (
          <span
            className={cn(
              'hidden shrink-0 text-[11px] font-medium sm:inline',
              triggerStatus.text,
            )}
          >
            {triggerStatus.label}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[75vh] p-0 flex flex-col">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base">PC 선택</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로딩 중...
            </div>
          ) : agents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              등록된 PC가 없습니다
            </div>
          ) : (
            <ul className="space-y-1">
              {agents.map((agent) => {
                const status = STATUS[agent.status];
                const isSelected = agent.id === selectedId;
                const sysInfo = formatSystemInfo(
                  agent.system_info as Record<string, unknown> | null,
                );

                return (
                  <li key={agent.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(agent.id)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors',
                        'min-h-[56px]',
                        isSelected
                          ? 'bg-primary/10'
                          : 'hover:bg-muted active:bg-muted/80',
                      )}
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 shrink-0 rounded-full',
                          status.dot,
                        )}
                        aria-label={status.label}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {renamingId === agent.id ? (
                            <input
                              autoFocus
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') commitRename(agent.id);
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              onBlur={() => commitRename(agent.id)}
                              className="truncate text-sm font-medium bg-background border rounded px-1 py-0.5 flex-1 min-w-0"
                            />
                          ) : (
                            <>
                              <p className="truncate text-sm font-medium">{agent.name}</p>
                              <button
                                type="button"
                                onClick={(e) => startRename(e, agent)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-opacity"
                                title="이름 변경"
                                aria-label="이름 변경"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          {agent.api_mode === 'byok' && (
                            <span
                              className="shrink-0 rounded-sm border border-violet-500/40 bg-violet-500/10 px-1 py-[1px] text-[9px] font-semibold text-violet-400 uppercase tracking-wider"
                              title="Anthropic API 키로 동작 (BYOK)"
                            >
                              API
                            </span>
                          )}
                          {isVersionOutdated(agent.agent_version) && (
                            <span
                              className="shrink-0 rounded-sm border border-amber-500/40 bg-amber-500/10 px-1 py-[1px] text-[9px] font-semibold text-amber-400 uppercase tracking-wider"
                              title={`현재 v${agent.agent_version} · 권장 v${RECOMMENDED_AGENT_VERSION} — 재설치 권장`}
                            >
                              업데이트
                            </span>
                          )}
                          {agent.status === 'online' && (() => {
                            const idle = formatIdleDuration(agent.last_activity_at);
                            return idle ? (
                              <span
                                className="shrink-0 rounded-sm border border-sky-500/40 bg-sky-500/10 px-1 py-[1px] text-[9px] font-semibold text-sky-400 uppercase tracking-wider"
                                title={`마지막 활동 이후 ${idle} — 명령을 보내지 않은 지 오래됐습니다`}
                              >
                                유휴
                              </span>
                            ) : null;
                          })()}
                          {agent.restart_requested && (
                            <span
                              className="shrink-0 rounded-sm border border-amber-500/40 bg-amber-500/10 px-1 py-[1px] text-[9px] font-semibold text-amber-400 uppercase tracking-wider animate-pulse"
                              title="재시작 요청이 전송되었고 에이전트가 아직 처리하지 않았습니다"
                            >
                              재시작중
                            </span>
                          )}
                        </div>
                        {sysInfo && (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {sysInfo}
                            {agent.agent_version && (
                              <span className="ml-1 opacity-60">· v{agent.agent_version}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-right text-[11px] font-medium',
                          status.text,
                        )}
                      >
                        <span>{status.label}</span>
                        {agent.status === 'offline' && (() => {
                          const dur = formatOfflineDuration(agent.last_heartbeat);
                          return dur ? (
                            <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                              {dur}
                            </span>
                          ) : null;
                        })()}
                      </span>
                      {agent.status === 'offline' && agent.mac_address && (
                        <button
                          type="button"
                          onClick={(e) => handleWake(e, agent.id)}
                          disabled={wakingId === agent.id}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
                          title="깨우기 (Wake-on-LAN)"
                          aria-label="깨우기"
                        >
                          {wakingId === agent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleRestart(e, agent.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="에이전트 재시작"
                        aria-label="에이전트 재시작"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
