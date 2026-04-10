'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Monitor, Wifi, WifiOff, Loader2, RotateCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRef } from 'react';
import type { Agent } from '@/lib/supabase/types';

interface PCListProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

const statusConfig = {
  online: { label: '온라인', color: 'bg-green-500', icon: Wifi },
  offline: { label: '오프라인', color: 'bg-gray-400', icon: WifiOff },
  busy: { label: '작업 중', color: 'bg-yellow-500', icon: Loader2 },
} as const;

/** system_info JSON을 한 줄 요약 문자열로 변환 */
function formatSystemInfo(info: Record<string, unknown>): string {
  const parts: string[] = [];

  if (info.cpu) {
    // CPU 모델에서 핵심 부분만 추출 (예: "13th Gen Intel(R) Core(TM) i7-13700K" → "i7-13700K")
    const cpuStr = String(info.cpu);
    const match = cpuStr.match(/[iIrR][3579]-?\w+/);
    parts.push(match ? match[0] : cpuStr.substring(0, 20));
  }

  if (info.totalMemory) {
    parts.push(String(info.totalMemory));
  }

  if (info.cores) {
    parts.push(`${info.cores}코어`);
  }

  return parts.join(' \u00b7 ');
}

export function PCList({ agents, selectedId, onSelect, loading }: PCListProps) {
  const supabaseRef = useRef(createClient());

  const handleRestart = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    await supabaseRef.current
      .from('agents')
      .update({ restart_requested: true })
      .eq('id', agentId);
  };
  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
        로딩 중...
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        등록된 PC가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {agents.map((agent) => {
        const status = statusConfig[agent.status];
        const StatusIcon = status.icon;

        return (
          <button
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
              selectedId === agent.id
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            )}
          >
            <Monitor className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{agent.name}</p>
              {agent.system_info && Object.keys(agent.system_info).length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {formatSystemInfo(agent.system_info)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {agent.status === 'busy' ? (
                <StatusIcon className="h-3 w-3 animate-spin text-yellow-500" />
              ) : (
                <div className={cn('h-2 w-2 rounded-full', status.color)} />
              )}
              <span className="text-[10px] text-muted-foreground">
                {status.label}
              </span>
              <button
                onClick={(e) => handleRestart(e, agent.id)}
                className="ml-0.5 p-0.5 rounded hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                title="에이전트 재시작"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>
          </button>
        );
      })}
    </div>
  );
}
