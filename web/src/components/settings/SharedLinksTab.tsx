'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Check, Copy, ExternalLink, Link2, Loader2, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface ShareRow {
  id: string;
  conversation_id: string;
  token: string;
  expires_at: string | null;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  conversation: { id: string; title: string; agent_id: string } | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function SharedLinksTab() {
  const [rows, setRows] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyId, setCopyId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  const origin = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseRef.current
      .from('conversation_share_tokens')
      .select(
        'id, conversation_id, token, expires_at, revoked_at, view_count, last_viewed_at, created_at, conversation:conversations(id, title, agent_id)',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast(`공유 링크를 불러오지 못했습니다: ${error.message}`, { variant: 'error' });
    }
    setRows((data as unknown as ShareRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCopy = async (row: ShareRow) => {
    const url = `${origin}/share/${row.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyId(row.id);
      setTimeout(() => setCopyId((id) => (id === row.id ? null : id)), 2000);
      toast('클립보드에 복사했습니다', { variant: 'success' });
    } catch {
      toast(`URL: ${url}`, { variant: 'info', duration: 12000 });
    }
  };

  const handleRevoke = async (row: ShareRow) => {
    if (!confirm('이 공유 링크를 비활성화할까요?')) return;
    const supabase = supabaseRef.current;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch('/api/share/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token: row.token }),
    });
    if (!res.ok) {
      toast('해제 실패', { variant: 'error' });
      return;
    }
    toast('공유 링크를 비활성화했습니다', { variant: 'success' });
    refresh();
  };

  const handleDelete = async (row: ShareRow) => {
    if (!confirm('이 공유 링크를 완전히 삭제할까요? (되돌릴 수 없음)')) return;
    const { error } = await supabaseRef.current
      .from('conversation_share_tokens')
      .delete()
      .eq('id', row.id);
    if (error) {
      toast(`삭제 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  // rows 가 바뀔 때마다 "이 렌더 시점" 을 한 번 고정 — 규칙-위반 경고 억제 + 한 프레임 일관성 유지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderedAt = useMemo(() => new Date().getTime(), [rows]);

  const activeCount = useMemo(() => {
    return rows.filter(
      (r) =>
        !r.revoked_at && (!r.expires_at || new Date(r.expires_at).getTime() > renderedAt),
    ).length;
  }, [rows, renderedAt]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> 불러오는 중…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4 space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          공유 링크
        </p>
        <p className="text-sm">
          활성 {activeCount}개 · 전체 {rows.length}개
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          채팅 화면의 `⋯` → &quot;공유 링크 만들기&quot; 로 새 링크를 발급할 수 있습니다.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          발급한 공유 링크가 없습니다
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            // Date.now 는 pure 규칙 위반이라 렌더 중 바로 호출하지 않고, activeCount 와 같은 식으로 처리
            const expiresTs = row.expires_at ? new Date(row.expires_at).getTime() : null;
            const expired = expiresTs !== null && expiresTs < renderedAt;
            const revoked = row.revoked_at !== null;
            const active = !expired && !revoked;
            return (
              <li
                key={row.id}
                className={`rounded-xl border bg-card p-3 ${active ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link2
                        className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <p className="truncate text-sm font-medium">
                        {row.conversation?.title ?? '(삭제된 대화)'}
                      </p>
                      {!active && (
                        <span className="shrink-0 rounded border border-muted-foreground/40 px-1 py-[1px] text-[9px] uppercase tracking-wider text-muted-foreground">
                          {revoked ? '회수됨' : '만료'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>조회 {row.view_count}회</span>
                      <span>마지막 조회 {relativeTime(row.last_viewed_at)}</span>
                      <span>생성 {new Date(row.created_at).toLocaleDateString('ko-KR')}</span>
                      {row.expires_at && (
                        <span>만료 {new Date(row.expires_at).toLocaleString('ko-KR')}</span>
                      )}
                    </div>
                  </div>
                  {active && row.conversation && (
                    <Link
                      href={`/share/${row.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground hover:bg-accent"
                      title="공유 페이지 열기"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <code className="flex-1 min-w-0 truncate rounded border bg-muted px-2 py-1 text-[11px] font-mono">
                    {origin}/share/{row.token}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopy(row)}
                    title="URL 복사"
                    aria-label="URL 복사"
                  >
                    {copyId === row.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {active ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleRevoke(row)}
                      title="공유 해제"
                      aria-label="공유 해제"
                    >
                      <X className="h-3.5 w-3.5 text-rose-400" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleDelete(row)}
                      title="기록 삭제"
                      aria-label="기록 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
