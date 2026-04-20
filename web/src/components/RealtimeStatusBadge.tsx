'use client';

import { useState, useSyncExternalStore } from 'react';
import { Loader2, RefreshCw, Radio, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getChannelEntries,
  getOverallStatus,
  reconnectAll,
  reconnectChannel,
  subscribeRealtimeStatus,
  type ChannelEntry,
  type ChannelState,
  type OverallState,
} from '@/lib/realtime-status';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

/**
 * 화면 우상단에 Realtime 구독 상태를 뱃지로 표시한다.
 * `reconnecting` 일 때만 자동으로 표시되며, 클릭하면 채널별 진단 모달이 열린다.
 */

const SUBSCRIBE = (fn: () => void) => subscribeRealtimeStatus(fn);
const GET_OVERALL = (): OverallState => getOverallStatus();
const OVERALL_IDLE: OverallState = 'idle';
const GET_OVERALL_SERVER = (): OverallState => OVERALL_IDLE;

const GET_ENTRIES = (): ChannelEntry[] => getChannelEntries();
const EMPTY_ENTRIES: ChannelEntry[] = [];
const GET_ENTRIES_SERVER = (): ChannelEntry[] => EMPTY_ENTRIES;

function stateLabel(state: ChannelState): string {
  if (state === 'subscribed') return '정상';
  if (state === 'reconnecting') return '재연결 중';
  return '종료됨';
}

function StateDot({ state }: { state: ChannelState }) {
  const cls =
    state === 'subscribed'
      ? 'bg-emerald-500'
      : state === 'reconnecting'
      ? 'bg-amber-500 animate-pulse'
      : 'bg-zinc-500';
  return <span className={cn('h-2 w-2 shrink-0 rounded-full', cls)} />;
}

export function RealtimeStatusBadge() {
  const overall = useSyncExternalStore(SUBSCRIBE, GET_OVERALL, GET_OVERALL_SERVER);
  const entries = useSyncExternalStore(SUBSCRIBE, GET_ENTRIES, GET_ENTRIES_SERVER);
  const [open, setOpen] = useState(false);
  const [busyAll, setBusyAll] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const showBadge = overall === 'reconnecting';

  return (
    <>
      {showBadge && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'pt-safe fixed right-3 top-0 z-[80] pointer-events-auto',
            'flex items-center gap-1.5 rounded-full',
            'border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400',
            'shadow-sm backdrop-blur hover:bg-amber-500/25 transition-colors',
          )}
          aria-label="실시간 연결 상태 진단"
          title="탭하여 채널별 상태 확인"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>실시간 재연결 중</span>
        </button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] p-0 flex flex-col">
          <SheetHeader className="border-b px-4 py-3 flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4" />
              실시간 연결 진단
            </SheetTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* 요약 카드 */}
            <div
              className={cn(
                'rounded-xl border p-3 flex items-start gap-3',
                overall === 'connected'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : overall === 'reconnecting'
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-muted/50 border-border',
              )}
            >
              {overall === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : overall === 'reconnecting' ? (
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Radio className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {overall === 'connected'
                    ? '모든 채널 정상'
                    : overall === 'reconnecting'
                    ? '일부 채널이 재연결 중'
                    : '활성 채널 없음'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  총 {entries.length}개 채널 ·{' '}
                  {entries.filter((e) => e.state === 'subscribed').length}개 정상 ·{' '}
                  {entries.filter((e) => e.state === 'reconnecting').length}개 재연결 ·{' '}
                  {entries.filter((e) => e.state === 'closed').length}개 종료
                </p>
              </div>
            </div>

            {/* 채널 목록 */}
            <div className="space-y-1.5">
              {entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  구독 중인 채널이 없습니다.
                </p>
              ) : (
                entries.map((e) => {
                  const busy = busyKey === e.key || busyAll;
                  return (
                    <div
                      key={e.key}
                      className="flex items-center gap-3 rounded-lg border bg-background p-3"
                    >
                      <StateDot state={e.state} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {stateLabel(e.state)} · <span className="font-mono">{e.key}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusyKey(e.key);
                          try {
                            reconnectChannel(e.key);
                            await new Promise((r) => setTimeout(r, 400));
                          } finally {
                            setBusyKey(null);
                          }
                        }}
                        className="shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                        title="이 채널만 강제 재연결"
                      >
                        {busy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        재연결
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="border-t p-3">
              <button
                type="button"
                disabled={busyAll}
                onClick={async () => {
                  setBusyAll(true);
                  try {
                    reconnectAll();
                    await new Promise((r) => setTimeout(r, 600));
                  } finally {
                    setBusyAll(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {busyAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                모든 채널 강제 재연결
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground text-center leading-relaxed">
                백오프 대기를 건너뛰고 즉시 새 채널로 다시 구독합니다.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
