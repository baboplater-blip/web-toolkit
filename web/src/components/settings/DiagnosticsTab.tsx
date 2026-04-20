'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Activity,
  Radio,
  Bell,
  HardDrive,
  Inbox,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Sun,
  Trash,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
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
import { usePushSubscription, type PushHealth } from '@/lib/hooks/usePushSubscription';
import { clearOutbox, listOutbox, OUTBOX_MAX_ATTEMPTS } from '@/lib/outbox';
import { clearAllOfflineSnapshots } from '@/lib/offline-cache';

/**
 * 운영 진단 탭 — Realtime 채널 · Push 구독 · Service Worker · Outbox 상태를 한 화면에서 점검·복구.
 *
 * 각 섹션은 점검 결과와 "지금 다시 시도" 버튼을 제공한다.
 */

const RT_SUBSCRIBE = (fn: () => void) => subscribeRealtimeStatus(fn);
const RT_OVERALL = (): OverallState => getOverallStatus();
const RT_OVERALL_IDLE: OverallState = 'idle';
const RT_OVERALL_SERVER = (): OverallState => RT_OVERALL_IDLE;
const RT_ENTRIES = (): ChannelEntry[] => getChannelEntries();
const RT_EMPTY_ENTRIES: ChannelEntry[] = [];
const RT_ENTRIES_SERVER = (): ChannelEntry[] => RT_EMPTY_ENTRIES;

function stateLabel(state: ChannelState): string {
  if (state === 'subscribed') return '정상';
  if (state === 'reconnecting') return '재연결';
  return '종료';
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

export function DiagnosticsTab() {
  const overall = useSyncExternalStore(RT_SUBSCRIBE, RT_OVERALL, RT_OVERALL_SERVER);
  const entries = useSyncExternalStore(RT_SUBSCRIBE, RT_ENTRIES, RT_ENTRIES_SERVER);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const push = usePushSubscription();
  const [pushChecking, setPushChecking] = useState(false);
  const [pushHealth, setPushHealth] = useState<PushHealth | null>(null);

  const [swVersion, setSwVersion] = useState<string | null>(null);
  const [swUpdating, setSwUpdating] = useState(false);

  const [outboxSize, setOutboxSize] = useState<{ pending: number; failed: number }>({
    pending: 0,
    failed: 0,
  });

  const [pushTesting, setPushTesting] = useState(false);
  const [dailyOptIn, setDailyOptIn] = useState<boolean | null>(null);
  const [dailySaving, setDailySaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [watchdogRunning, setWatchdogRunning] = useState(false);
  const [timeoutStats, setTimeoutStats] = useState<{
    timeouts: number;
    total: number;
    avgDurationSec: number | null;
  } | null>(null);

  // Service Worker 버전 — SW fetch '/api/sw-version' 가 없으므로 registered scriptURL 기반 버전 태그를 읽는다.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        setSwVersion('미등록');
        return;
      }
      try {
        // sw.js 안의 SW_VERSION 상수 읽기 (스크립트 본문에서 찾음).
        const res = await fetch(reg.active?.scriptURL ?? '/sw.js', { cache: 'no-store' });
        const text = await res.text();
        const m = text.match(/SW_VERSION\s*=\s*['"]([^'"]+)['"]/);
        setSwVersion(m?.[1] ?? 'unknown');
      } catch {
        setSwVersion('조회 실패');
      }
    })();
  }, []);

  // 최근 7일 타임아웃 통계
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: allMsgs } = await supabase
          .from('messages')
          .select('status, error_message, created_at, updated_at, role')
          .eq('role', 'assistant')
          .gte('created_at', since)
          .limit(5000);
        const rows = (allMsgs as Array<{
          status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        }> | null) ?? [];
        const total = rows.length;
        const timeouts = rows.filter(
          (r) =>
            r.status === 'error' &&
            r.error_message &&
            /타임아웃|timeout|time[- ]?out/i.test(r.error_message),
        ).length;
        const completed = rows.filter((r) => r.status === 'completed');
        const avgDurationSec = completed.length
          ? Math.round(
              completed.reduce((sum, r) => {
                return (
                  sum +
                  (new Date(r.updated_at).getTime() -
                    new Date(r.created_at).getTime()) /
                    1000
                );
              }, 0) / completed.length,
            )
          : null;
        setTimeoutStats({ timeouts, total, avgDurationSec });
      } catch {}
    })();
  }, []);

  // Outbox 카운트 + 일간 요약 구독 상태
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (!uid) return;
        const items = await listOutbox(uid);
        setOutboxSize({
          pending: items.filter((i) => !i.failed).length,
          failed: items.filter((i) => i.failed).length,
        });
        const { data: subRows } = await supabase
          .from('push_subscriptions')
          .select('notify_daily_summary')
          .limit(10);
        if (subRows && subRows.length > 0) {
          setDailyOptIn(
            (subRows as Array<{ notify_daily_summary: boolean }>).some(
              (r) => r.notify_daily_summary,
            ),
          );
        } else {
          setDailyOptIn(null);
        }
      } catch {}
    })();
  }, []);

  const runPushTest = async () => {
    setPushTesting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast('로그인이 필요합니다', { variant: 'warning' });
        return;
      }
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = (await res.json()) as {
        sent?: number;
        failed?: number;
        expired?: number;
        error?: string;
        reason?: string;
      };
      if (!res.ok) {
        toast(`테스트 푸시 실패: ${body.error ?? res.status}`, { variant: 'error' });
        return;
      }
      if (body.reason === 'no_subscriptions') {
        toast('구독된 기기가 없습니다. 먼저 알림을 활성화해주세요.', {
          variant: 'warning',
        });
        return;
      }
      toast(
        `테스트 푸시 전송: ${body.sent ?? 0}건 성공${
          body.failed ? ` · ${body.failed}건 실패` : ''
        }${body.expired ? ` · ${body.expired}건 만료 정리` : ''}`,
        { variant: 'success', duration: 6000 },
      );
    } finally {
      setPushTesting(false);
    }
  };

  const toggleDailyOptIn = async () => {
    if (dailyOptIn === null) return;
    const next = !dailyOptIn;
    setDailySaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ notify_daily_summary: next })
        .neq('endpoint', '');
      if (error) {
        toast(`저장 실패: ${error.message}`, { variant: 'error' });
        return;
      }
      setDailyOptIn(next);
      toast(next ? '일간 요약 알림이 켜졌습니다' : '일간 요약 알림이 꺼졌습니다', {
        variant: 'success',
      });
    } finally {
      setDailySaving(false);
    }
  };

  const runWatchdog = async () => {
    setWatchdogRunning(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast('로그인이 필요합니다', { variant: 'warning' });
        return;
      }
      const res = await fetch('/api/cron/agent-watchdog', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = (await res.json()) as {
        agents_marked_offline?: number;
        user_messages_timed_out?: number;
        assistant_messages_timed_out?: number;
        orphaned_user_messages?: number;
        agents_restart_requested?: number;
        error?: string;
      };
      if (!res.ok) {
        toast(`좀비 점검 실패: ${body.error ?? res.status}`, { variant: 'error' });
        return;
      }
      const total =
        (body.agents_marked_offline ?? 0) +
        (body.user_messages_timed_out ?? 0) +
        (body.assistant_messages_timed_out ?? 0) +
        (body.agents_restart_requested ?? 0);
      if (total === 0 && (body.orphaned_user_messages ?? 0) === 0) {
        toast('멈춘 항목이 없습니다. 정상 상태입니다.', { variant: 'success' });
      } else {
        const parts: string[] = [];
        if (body.agents_marked_offline)
          parts.push(`PC ${body.agents_marked_offline}대 오프라인 표시`);
        if (body.user_messages_timed_out)
          parts.push(`멈춘 메시지 ${body.user_messages_timed_out}건 마감`);
        if (body.assistant_messages_timed_out)
          parts.push(`응답 ${body.assistant_messages_timed_out}건 중단 처리`);
        if (body.agents_restart_requested)
          parts.push(`응답 안오는 PC ${body.agents_restart_requested}대 재기동 요청`);
        else if (body.orphaned_user_messages)
          parts.push(`응답 대기 ${body.orphaned_user_messages}건 (PC 재기동 이미 진행중)`);
        toast(parts.join(' · '), {
          variant: body.agents_restart_requested ? 'warning' : 'success',
          duration: 8000,
        });
      }
    } finally {
      setWatchdogRunning(false);
    }
  };

  const handleClearLocalCache = async () => {
    if (!confirm('대화 캐시와 오프라인 큐를 모두 삭제할까요? (계정 정보는 유지됩니다)')) return;
    setClearing(true);
    try {
      await Promise.all([clearAllOfflineSnapshots(), clearOutbox()]);
      toast('로컬 캐시를 정리했습니다', { variant: 'success' });
    } finally {
      setClearing(false);
    }
  };

  const summary = useMemo(() => {
    const rtOk = overall === 'connected';
    const pushOk =
      push.supported && push.subscribed && pushHealth
        ? pushHealth.endpointMatches
        : push.subscribed;
    const outOk = outboxSize.failed === 0;
    return { rtOk, pushOk, outOk };
  }, [overall, push.supported, push.subscribed, pushHealth, outboxSize.failed]);

  const runPushCheck = async () => {
    setPushChecking(true);
    try {
      const h = await push.checkSubscription();
      setPushHealth(h);
      if (h?.healed) {
        toast('Push 구독 상태를 복구했습니다', { variant: 'success' });
      } else if (h) {
        toast('Push 구독 상태 정상', { variant: 'info' });
      }
    } catch (e) {
      toast(`점검 실패: ${e instanceof Error ? e.message : String(e)}`, {
        variant: 'error',
      });
    } finally {
      setPushChecking(false);
    }
  };

  const forceSWUpdate = async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    setSwUpdating(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        toast('서비스워커가 등록되어 있지 않습니다', { variant: 'warning' });
        return;
      }
      await reg.update();
      toast('서비스워커 업데이트 체크를 시작했습니다. 새 버전이 있다면 곧 적용됩니다.', {
        variant: 'info',
        duration: 5000,
      });
    } finally {
      setSwUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <section className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">시스템 점검 요약</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { ok: summary.rtOk, label: '실시간', icon: Radio },
            { ok: summary.pushOk, label: '푸시', icon: Bell },
            { ok: summary.outOk, label: '오프라인 큐', icon: Inbox },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={cn(
                  'rounded-lg border p-2 flex flex-col items-center gap-1',
                  s.ok
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/5 border-amber-500/30 text-amber-400',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{s.label}</span>
                <span className="text-[10px]">{s.ok ? '정상' : '주의'}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Realtime 채널 */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Realtime 채널</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={busyAll || entries.length === 0}
            onClick={async () => {
              setBusyAll(true);
              try {
                reconnectAll();
                await new Promise((r) => setTimeout(r, 600));
              } finally {
                setBusyAll(false);
              }
            }}
            className="h-7 gap-1 text-xs"
          >
            {busyAll ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            전체 재연결
          </Button>
        </div>
        {entries.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            이 탭에서는 활성 채널이 없습니다 — 채팅 탭을 열면 나타납니다.
          </p>
        ) : (
          <div className="space-y-1.5">
            {entries.map((e) => (
              <div
                key={e.key}
                className="flex items-center gap-3 rounded-lg border bg-background p-2.5"
              >
                <StateDot state={e.state} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{e.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {stateLabel(e.state)} · <span className="font-mono">{e.key}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyKey === e.key}
                  onClick={async () => {
                    setBusyKey(e.key);
                    try {
                      reconnectChannel(e.key);
                      await new Promise((r) => setTimeout(r, 400));
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                  className="shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                  title="이 채널만 재연결"
                >
                  {busyKey === e.key ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    '재연결'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Push 구독 */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Web Push 구독</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={pushChecking}
            onClick={runPushCheck}
            className="h-7 gap-1 text-xs"
          >
            {pushChecking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            점검·복구
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border bg-background p-2">
            <p className="text-[10px] text-muted-foreground">브라우저</p>
            <p className="font-medium">
              {push.supported ? (push.subscribed ? '구독됨' : '미구독') : '지원 안 함'}
            </p>
          </div>
          <div className="rounded-md border bg-background p-2">
            <p className="text-[10px] text-muted-foreground">서버(DB)</p>
            <p className="font-medium">
              {pushHealth ? `${pushHealth.dbRowCount}건 등록` : '—'}
            </p>
          </div>
        </div>
        {pushHealth && (
          <p
            className={cn(
              'flex items-start gap-1.5 text-xs',
              pushHealth.endpointMatches ? 'text-emerald-400' : 'text-amber-400',
            )}
          >
            {pushHealth.endpointMatches ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <span>
              {pushHealth.endpointMatches
                ? '브라우저와 서버의 endpoint 가 일치합니다.'
                : pushHealth.healed
                ? '불일치를 감지해 방금 복구했습니다. 다시 점검해주세요.'
                : '브라우저와 서버의 구독 상태가 다릅니다. 점검 버튼으로 복구하세요.'}
            </span>
          </p>
        )}

        {/* 테스트 푸시 발송 */}
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 gap-1.5 text-xs"
          onClick={runPushTest}
          disabled={pushTesting || !push.subscribed}
        >
          {pushTesting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          지금 테스트 푸시 보내기
        </Button>

        {/* 일간 요약 알림 opt-in */}
        {dailyOptIn !== null && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-background p-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sun className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium">매일 저녁 하루 요약</p>
                <p className="text-[10px] text-muted-foreground">
                  KST 19:00 에 오늘 완료·에러·👍 수를 푸시로 알림
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDailyOptIn}
              disabled={dailySaving}
              role="switch"
              aria-checked={dailyOptIn}
              className={cn(
                'shrink-0 relative h-5 w-9 rounded-full transition-colors',
                dailyOptIn ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform',
                  dailyOptIn ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        )}
      </section>

      {/* Service Worker */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Service Worker</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={swUpdating}
            onClick={forceSWUpdate}
            className="h-7 gap-1 text-xs"
          >
            {swUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            업데이트 확인
          </Button>
        </div>
        <div className="rounded-md border bg-background p-2 text-xs">
          <p className="text-[10px] text-muted-foreground">버전</p>
          <p className="font-mono">{swVersion ?? '조회 중...'}</p>
        </div>
      </section>

      {/* Outbox 요약 */}
      <section className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">오프라인 전송 큐</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border bg-background p-2">
            <p className="text-[10px] text-muted-foreground">대기</p>
            <p className="font-medium">{outboxSize.pending}건</p>
          </div>
          <div className="rounded-md border bg-background p-2">
            <p className="text-[10px] text-muted-foreground">
              실패 (재시도 {OUTBOX_MAX_ATTEMPTS}회 초과)
            </p>
            <p className={cn('font-medium', outboxSize.failed > 0 && 'text-rose-400')}>
              {outboxSize.failed}건
            </p>
          </div>
        </div>
        {outboxSize.failed > 0 && (
          <p className="text-[11px] text-muted-foreground">
            &ldquo;오프라인 큐&rdquo; 탭에서 실패한 메시지를 확인·재시도할 수 있습니다.
          </p>
        )}
      </section>

      {/* 타임아웃 통계 (최근 7일) */}
      {timeoutStats && (
        <section className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">타임아웃 통계 (최근 7일)</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border bg-background p-2">
              <p className="text-[10px] text-muted-foreground">총 응답</p>
              <p className="font-medium">{timeoutStats.total}건</p>
            </div>
            <div className="rounded-md border bg-background p-2">
              <p className="text-[10px] text-muted-foreground">타임아웃</p>
              <p
                className={cn(
                  'font-medium',
                  timeoutStats.timeouts > 0 ? 'text-amber-300' : '',
                )}
              >
                {timeoutStats.timeouts}건
                {timeoutStats.total > 0 && (
                  <span className="ml-1 text-[9px] text-muted-foreground">
                    ({Math.round((timeoutStats.timeouts / timeoutStats.total) * 100)}%)
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-md border bg-background p-2">
              <p className="text-[10px] text-muted-foreground">평균 실행</p>
              <p className="font-medium">
                {timeoutStats.avgDurationSec === null
                  ? '-'
                  : timeoutStats.avgDurationSec < 60
                  ? `${timeoutStats.avgDurationSec}초`
                  : `${Math.round(timeoutStats.avgDurationSec / 60)}분`}
              </p>
            </div>
          </div>
          {timeoutStats.timeouts > 0 && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              타임아웃이 잦으면 설정 → PC 탭에서 해당 PC 의 기본 타임아웃을 60~120 분으로
              늘리거나, 메시지 전송 시 <b className="text-amber-300">긴 작업 모드</b>(시계 아이콘)를 켜서
              ×2 연장 부여하세요.
            </p>
          )}
        </section>
      )}

      {/* 좀비 작업 정리 워치독 — 응답이 멈췄을 때 수동 복구 */}
      <section className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">응답 멈춤 복구</h3>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          멈춘 작업을 정리하고, 응답을 주지 않는 PC 에이전트는 자동으로 재기동을 요청합니다.
          90 초 넘게 답이 없는 대화는 &ldquo;고아&rdquo; 로 감지해 해당 PC 재기동 → catchup 으로
          자동 복구됩니다. 서버에서도 매일 1 회 돌지만 지금 즉시 돌리고 싶을 때 사용하세요.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 gap-1.5 text-xs"
          onClick={runWatchdog}
          disabled={watchdogRunning}
        >
          {watchdogRunning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ShieldCheck className="h-3 w-3" />
          )}
          지금 좀비 점검 · 복구
        </Button>
      </section>

      {/* 로컬 캐시 초기화 — 문제 해결용 */}
      <section className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Trash className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">로컬 캐시 초기화</h3>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          IndexedDB 에 저장된 대화 스냅샷과 오프라인 큐를 모두 삭제합니다. 이상 동작이 의심될 때
          사용하세요. 계정·대화 원본은 서버에 안전하게 유지됩니다.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 gap-1.5 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
          onClick={handleClearLocalCache}
          disabled={clearing}
        >
          {clearing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash className="h-3 w-3" />
          )}
          로컬 캐시 비우기
        </Button>
      </section>
    </div>
  );
}
