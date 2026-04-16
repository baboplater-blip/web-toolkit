'use client';

import { useState } from 'react';
import { ChevronDown, Monitor, RotateCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
  const selected = agents.find((a) => a.id === selectedId) ?? null;

  const handleRestart = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    await supabase
      .from('agents')
      .update({ restart_requested: true })
      .eq('id', agentId);
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
                        'flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors',
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
                        <p className="truncate text-sm font-medium">
                          {agent.name}
                        </p>
                        {sysInfo && (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {sysInfo}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[11px] font-medium',
                          status.text,
                        )}
                      >
                        {status.label}
                      </span>
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
