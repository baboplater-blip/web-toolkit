'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Clock, LayoutGrid, RefreshCw, WifiOff } from 'lucide-react';
import { TOOLS, type ToolMeta } from '@/lib/tools/registry';
import { getRecent } from '@/lib/tools/usage';

/**
 * 완전 오프라인 fallback. 도구 사이트는 모든 처리가 브라우저 안에서 수행되므로,
 * 한 번 로드된 도구 페이지는 오프라인에서도 사용 가능하다.
 */
export default function OfflinePage() {
  const [recentTools, setRecentTools] = useState<ToolMeta[]>([]);

  useEffect(() => {
    const map = new Map(TOOLS.map((t) => [t.id, t]));
    const list = getRecent()
      .map((e) => map.get(e.id))
      .filter((t): t is ToolMeta => !!t && t.status === 'ready')
      .slice(0, 6);
    setRecentTools(list);
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
          <WifiOff className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">오프라인 상태입니다</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            네트워크 연결이 끊어졌어요. 한 번 열어본 도구는 오프라인에서도 그대로
            사용할 수 있습니다.
          </p>
        </div>

        <a
          href="/tools"
          className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted text-left"
        >
          <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">도구 허브 열기</p>
            <p className="text-[11px] text-muted-foreground">
              캐시된 도구는 오프라인에서도 동작합니다.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>

        {recentTools.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3 w-3" />
              최근 사용한 도구
            </p>
            <ul className="space-y-1.5">
              {recentTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <li key={tool.id}>
                    <a
                      href={tool.href}
                      className="flex items-center gap-2.5 rounded-lg border bg-background p-2.5 transition-colors hover:bg-muted"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs font-medium truncate">{tool.title}</p>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </button>
      </div>
    </div>
  );
}
