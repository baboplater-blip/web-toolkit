'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOutbox } from '@/lib/hooks/useOutbox';
import {
  removeOutboxItem,
  updateOutboxItem,
  OUTBOX_FAILED_TTL_DAYS,
  type OutboxItem,
} from '@/lib/outbox';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  RefreshCw,
  Trash2,
  SendHorizontal,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

/**
 * 설정 페이지의 "오프라인 큐" 탭.
 * - 대기 중(pending) / 영구 실패(failed) 두 그룹으로 노출.
 * - 액션: 개별 삭제, 실패 항목 재시도(=attempts 리셋 후 flush), 전체 flush.
 * - 대화 title 을 곁들여 "어디로 보낼지" 힌트 제공.
 */
export function OutboxTab() {
  const { items, pendingCount, failedCount, flushing, refresh, flush } = useOutbox();
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});
  const [convTitles, setConvTitles] = useState<Record<string, string>>({});

  // 화면에 노출할 agent 이름 · conversation 제목 조회. RLS 로 자기 소유만.
  useEffect(() => {
    (async () => {
      if (items.length === 0) return;
      const supabase = createClient();

      const agentIds = Array.from(new Set(items.map((i) => i.agentId)));
      const convIds = Array.from(
        new Set(
          items
            .map((i) => i.conversationId)
            .filter((v): v is string => !!v),
        ),
      );

      if (agentIds.length > 0) {
        const { data } = await supabase
          .from('agents')
          .select('id, name')
          .in('id', agentIds);
        if (data) {
          const map: Record<string, string> = {};
          for (const a of data as Array<{ id: string; name: string }>) {
            map[a.id] = a.name;
          }
          setAgentNames(map);
        }
      }
      if (convIds.length > 0) {
        const { data } = await supabase
          .from('conversations')
          .select('id, title')
          .in('id', convIds);
        if (data) {
          const map: Record<string, string> = {};
          for (const c of data as Array<{ id: string; title: string }>) {
            map[c.id] = c.title;
          }
          setConvTitles(map);
        }
      }
    })();
  }, [items]);

  const { pending, failed } = useMemo(() => {
    const p: OutboxItem[] = [];
    const f: OutboxItem[] = [];
    for (const it of items) (it.failed ? f : p).push(it);
    return { pending: p, failed: f };
  }, [items]);

  const onRetryFailed = async (item: OutboxItem) => {
    await updateOutboxItem({
      ...item,
      attempts: 0,
      failed: false,
      lastError: undefined,
    });
    await refresh();
    await flush();
  };

  const onDelete = async (item: OutboxItem) => {
    if (!confirm('이 대기 메시지를 삭제할까요?')) return;
    await removeOutboxItem(item.id);
    await refresh();
    toast('삭제됨', { variant: 'success' });
  };

  const onFlushAll = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast('오프라인 상태입니다 — 복귀 시 자동 전송됩니다', { variant: 'warning' });
      return;
    }
    await flush();
  };

  if (items.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-6 text-center">
        <Inbox className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">대기 중인 오프라인 메시지가 없습니다.</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          오프라인에서 보낸 메시지는 네트워크 복귀 시 자동으로 이곳을 거쳐 전송됩니다.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">오프라인 큐</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              대기 {pendingCount}건 · 실패 {failedCount}건
            </p>
          </div>
          <Button
            size="sm"
            onClick={onFlushAll}
            disabled={flushing || pendingCount === 0}
            className="h-8 text-xs"
          >
            {flushing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <SendHorizontal className="h-3 w-3 mr-1" />
            )}
            지금 전송
          </Button>
        </div>
      </section>

      {pending.length > 0 && (
        <section className="rounded-xl border bg-card p-3">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
            대기 중
          </h3>
          <ul className="divide-y">
            {pending.map((item) => (
              <li key={item.id} className="py-2 px-1 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs line-clamp-2">{item.content}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {agentNames[item.agentId] ?? item.agentId.slice(0, 8)}
                    {' · '}
                    {item.conversationId
                      ? convTitles[item.conversationId] ?? '대화'
                      : '새 대화'}
                    {' · '}
                    {formatAge(item.queuedAt)}
                    {item.attempts > 0 && ` · 시도 ${item.attempts}회`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-rose-500/15 text-rose-400 shrink-0"
                  title="삭제"
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {failed.length > 0 && (
        <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              반복 실패 — 확인 필요
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {OUTBOX_FAILED_TTL_DAYS}일 후 자동 삭제
            </span>
          </div>
          <ul className="divide-y divide-rose-500/20">
            {failed.map((item) => (
              <li key={item.id} className="py-2 px-1 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs line-clamp-2">{item.content}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {agentNames[item.agentId] ?? item.agentId.slice(0, 8)}
                    {' · '}
                    {item.conversationId
                      ? convTitles[item.conversationId] ?? '대화'
                      : '새 대화'}
                    {' · '}
                    {formatAge(item.queuedAt)}
                    {' · 시도 '}
                    {item.attempts}회
                  </p>
                  {item.lastError && (
                    <p className="mt-1 text-[10px] text-rose-400 break-all">
                      {item.lastError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRetryFailed(item)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-emerald-500/15 text-emerald-400 shrink-0"
                  title="다시 시도"
                  aria-label="재시도"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-rose-500/15 text-rose-400 shrink-0"
                  title="삭제"
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
