'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  MessageSquarePlus,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  Loader2,
  Link2,
  Tag as TagIcon,
  X,
  Search,
  Wand2,
  Boxes,
  Pin,
  PinOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/lib/supabase/types';

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => Promise<Conversation | null>;
  onRename: (id: string, title: string) => Promise<boolean>;
  /** 서버의 첫 user 메시지를 기반으로 제목을 자동 재생성 */
  onRefineTitle?: (id: string) => Promise<boolean>;
  /** 대화 상단 고정 토글 */
  onTogglePin?: (id: string) => Promise<boolean>;
  onArchive: (id: string) => Promise<boolean>;
  /** 오래된 대화 일괄 아카이브 — 30일 이상 무활동 */
  onBulkArchive?: () => Promise<number>;
  onDelete: (id: string) => Promise<boolean>;
  onUnarchive: (id: string) => Promise<boolean>;
  loadArchived: () => Promise<Conversation[]>;
  onUpdateTags: (id: string, tags: string[]) => Promise<boolean>;
  tagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
  /** 검색 결과 클릭 시 해당 대화/메시지로 이동 */
  onGlobalSearchResult?: (conversationId: string, messageId: string | null) => void;
  /** 이 picker 가 소속된 agent_id — 검색 범위 축소에 사용 */
  agentId?: string | null;
}

function relativeTime(iso: string): string {
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

export function ConversationPicker({
  conversations,
  selectedId,
  loading,
  onSelect,
  onNew,
  onRename,
  onRefineTitle,
  onTogglePin,
  onArchive,
  onBulkArchive,
  onDelete,
  onUnarchive,
  loadArchived,
  onUpdateTags,
  tagFilter,
  onTagFilterChange,
  onGlobalSearchResult,
  agentId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedList, setArchivedList] = useState<Conversation[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedQuery, setArchivedQuery] = useState('');
  const [tagEditId, setTagEditId] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const supabaseRef = useRef(createClient());

  // 전역 검색 — 현재 에이전트의 모든 대화에서 제목 + 메시지 본문 검색.
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<
    Array<{
      conversationId: string;
      conversationTitle: string;
      messageId: string | null;
      snippet: string;
      matchedAt: string;
      role: 'title' | 'user' | 'assistant' | 'system';
    }>
  >([]);
  const [searching, setSearching] = useState(false);

  // 300ms 디바운스로 Supabase 검색. 쿼리가 2자 이상일 때만 동작.
  useEffect(() => {
    const q = globalQuery.trim();
    if (q.length < 2 || !open || !agentId) {
      Promise.resolve().then(() => {
        setSearchResults([]);
        setSearching(false);
      });
      return;
    }
    Promise.resolve().then(() => setSearching(true));
    const handle = setTimeout(async () => {
      const supabase = supabaseRef.current;
      // 공백 기준 멀티 토큰 — 각 토큰을 AND 로 엮는다.
      const tokens = q.split(/\s+/).filter((t) => t.length > 0).slice(0, 6);
      const escapedTokens = tokens.map((t) => t.replace(/[%_]/g, (m) => '\\' + m));

      let titleQuery = supabase
        .from('conversations')
        .select('id, title, last_message_at')
        .eq('agent_id', agentId);
      for (const t of escapedTokens) titleQuery = titleQuery.ilike('title', `%${t}%`);
      let msgQuery = supabase
        .from('messages')
        .select('id, content, created_at, role, conversation_id, conversations!inner(title)')
        .eq('agent_id', agentId)
        .neq('role', 'system');
      for (const t of escapedTokens) msgQuery = msgQuery.ilike('content', `%${t}%`);

      const [titleRes, msgRes] = await Promise.all([
        titleQuery.order('last_message_at', { ascending: false }).limit(20),
        msgQuery.order('created_at', { ascending: false }).limit(40),
      ]);

      type TitleRow = { id: string; title: string; last_message_at: string };
      type MsgRow = {
        id: string;
        content: string;
        created_at: string;
        role: 'user' | 'assistant' | 'system';
        conversation_id: string;
        conversations: { title: string } | { title: string }[] | null;
      };

      const titleHits = ((titleRes.data as TitleRow[] | null) ?? []).map((r) => ({
        conversationId: r.id,
        conversationTitle: r.title,
        messageId: null as string | null,
        snippet: r.title,
        matchedAt: r.last_message_at,
        role: 'title' as const,
      }));

      const msgHits = ((msgRes.data as MsgRow[] | null) ?? []).map((r) => {
        const title = Array.isArray(r.conversations)
          ? r.conversations[0]?.title ?? ''
          : r.conversations?.title ?? '';
        const lower = r.content.toLowerCase();
        // 가장 먼저 나오는 토큰 위치를 기준으로 snippet 잘라내기.
        let firstIdx = -1;
        let firstLen = 0;
        for (const t of tokens) {
          const tLower = t.toLowerCase();
          const pos = lower.indexOf(tLower);
          if (pos >= 0 && (firstIdx < 0 || pos < firstIdx)) {
            firstIdx = pos;
            firstLen = tLower.length;
          }
        }
        const idx = firstIdx >= 0 ? firstIdx : 0;
        const needleLen = firstLen > 0 ? firstLen : q.length;
        const start = Math.max(0, idx - 40);
        const end = Math.min(r.content.length, idx + needleLen + 60);
        const snippet =
          (start > 0 ? '…' : '') +
          r.content.slice(start, end) +
          (end < r.content.length ? '…' : '');
        return {
          conversationId: r.conversation_id,
          conversationTitle: title,
          messageId: r.id as string | null,
          snippet,
          matchedAt: r.created_at,
          role: r.role,
        };
      });

      const all = [...titleHits, ...msgHits].sort(
        (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime(),
      );
      setSearchResults(all.slice(0, 30));
      setSearching(false);

      // 성공적으로 결과가 있으면 검색어를 히스토리에 기록 (최근 10개, 중복 제거).
      if (all.length > 0) {
        try {
          const key = 'acp:search-history';
          const raw = localStorage.getItem(key);
          const list: string[] = raw ? JSON.parse(raw) : [];
          const filtered = list.filter((v) => v !== q);
          filtered.unshift(q);
          const next = filtered.slice(0, 10);
          localStorage.setItem(key, JSON.stringify(next));
          setSearchHistory(next);
        } catch {}
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [globalQuery, open, agentId]);

  // 검색 모드 진입 시 히스토리 한 번 로드.
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('acp:search-history');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) setSearchHistory(list.filter((v) => typeof v === 'string'));
      }
    } catch {}
  }, [open]);

  const isSearching = globalQuery.trim().length >= 2;

  /** 모바일 스와이프: 좌로 스와이프해 보관 처리. 한 번에 한 행만 swipe 중. */
  const [swipe, setSwipe] = useState<{ id: string; delta: number } | null>(null);
  const swipeStartXRef = useRef<number>(0);
  const SWIPE_ARCHIVE_THRESHOLD = 90;

  const handleSwipeStart = (id: string, e: React.TouchEvent) => {
    swipeStartXRef.current = e.touches[0].clientX;
    setSwipe({ id, delta: 0 });
  };

  const handleSwipeMove = (id: string, e: React.TouchEvent) => {
    if (swipe?.id !== id) return;
    const delta = e.touches[0].clientX - swipeStartXRef.current;
    // 왼쪽으로만 허용. -160 까지 보여주고 그 이상은 고무줄.
    const clamped = Math.max(-160, Math.min(0, delta));
    setSwipe({ id, delta: clamped });
  };

  const handleSwipeEnd = async (id: string) => {
    const s = swipe;
    setSwipe(null);
    if (!s || s.id !== id) return;
    if (s.delta <= -SWIPE_ARCHIVE_THRESHOLD) {
      await onArchive(id);
    }
  };

  // 현재까지 사용된 태그의 전체 유니크 목록 (대화 목록에서 추출).
  const allTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags ?? [])),
  ).sort();

  // 활성 태그 필터가 적용되면 해당 태그를 포함한 대화만 노출.
  const visibleConversations = tagFilter
    ? conversations.filter((c) => (c.tags ?? []).includes(tagFilter))
    : conversations;

  // 현재 사용자의 활성 공유 토큰이 걸린 conversation_id 모음.
  useEffect(() => {
    if (!open || conversations.length === 0) return;
    (async () => {
      const { data } = await supabaseRef.current
        .from('conversation_share_tokens')
        .select('conversation_id, expires_at, revoked_at')
        .is('revoked_at', null);
      if (!data) return;
      const now = Date.now();
      const set = new Set<string>();
      for (const row of data) {
        const r = row as { conversation_id: string; expires_at: string | null };
        if (r.expires_at && new Date(r.expires_at).getTime() < now) continue;
        set.add(r.conversation_id);
      }
      setSharedIds(set);
    })();
  }, [open, conversations.length]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const label = selected ? selected.title : loading ? '불러오는 중…' : '대화 없음';

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const handleNew = async () => {
    const created = await onNew();
    if (created) {
      onSelect(created.id);
      setOpen(false);
    }
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameDraft(currentTitle);
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const ok = await onRename(renamingId, renameDraft);
    if (ok) {
      setRenamingId(null);
      setRenameDraft('');
    }
  };

  const openTagEditor = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    setTagEditId(id);
    setTagDraft((conv?.tags ?? []).join(', '));
  };

  const commitTags = async () => {
    if (!tagEditId) return;
    const parsed = tagDraft.split(/[,\n]/);
    const ok = await onUpdateTags(tagEditId, parsed);
    if (ok) {
      setTagEditId(null);
      setTagDraft('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex min-w-0 max-w-[180px] items-center gap-1.5 rounded-md px-2 py-1.5',
              'hover:bg-muted active:bg-muted/80 transition-colors text-xs text-muted-foreground',
            )}
            title="대화 전환"
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[75vh] p-0 flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">
            {archivedOpen ? '보관함' : '대화'}
          </SheetTitle>
          <div className="flex gap-1">
            {archivedOpen ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setArchivedOpen(false)}
                className="h-8 text-xs"
              >
                활성 대화로
              </Button>
            ) : (
              <>
                {onBulkArchive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (
                        !confirm(
                          '30일 이상 활동이 없는 대화를 모두 보관함으로 옮길까요?',
                        )
                      )
                        return;
                      const n = await onBulkArchive();
                      if (n === 0) alert('보관할 대화가 없습니다.');
                    }}
                    className="h-8 text-xs"
                    title="30일+ 무활동 대화 일괄 보관"
                  >
                    <Boxes className="h-3.5 w-3.5 mr-1" />오래된 보관
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setArchivedOpen(true);
                    setArchivedLoading(true);
                    setArchivedList(await loadArchived());
                    setArchivedLoading(false);
                  }}
                  className="h-8 text-xs"
                  title="보관함"
                >
                  <Archive className="h-3.5 w-3.5 mr-1" />보관함
                </Button>
                <Button size="sm" variant="outline" onClick={handleNew} className="h-8 text-xs">
                  <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />새 대화
                </Button>
              </>
            )}
          </div>
        </SheetHeader>

        {!archivedOpen && onGlobalSearchResult && (
          <div className="border-b px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-1.5 rounded border bg-background px-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="이 PC 의 모든 대화에서 검색... (2자 이상)"
                className="h-8 flex-1 bg-transparent text-xs outline-none"
              />
              {globalQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalQuery('')}
                  className="h-6 w-6 flex items-center justify-center text-muted-foreground"
                  aria-label="검색 지우기"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {!globalQuery && searchHistory.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {searchHistory.slice(0, 8).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setGlobalQuery(q)}
                    className="text-[10px] px-2 py-0.5 rounded-full border bg-background hover:bg-muted text-muted-foreground truncate max-w-[140px]"
                    title={q}
                  >
                    {q}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('acp:search-history');
                    } catch {}
                    setSearchHistory([]);
                  }}
                  className="text-[10px] px-2 py-0.5 text-muted-foreground hover:text-foreground underline"
                >
                  기록 지우기
                </button>
              </div>
            )}
          </div>
        )}

        {isSearching ? (
          <div className="flex-1 overflow-y-auto p-2">
            {searching ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                검색 중...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                &quot;{globalQuery}&quot; 결과 없음
              </div>
            ) : (
              <ul className="space-y-1">
                {(() => {
                  // 공백 기준으로 여러 키워드 분리. 각 토큰마다 다른 색.
                  const tokens = globalQuery
                    .trim()
                    .split(/\s+/)
                    .filter((t) => t.length > 0)
                    .slice(0, 6);
                  const escaped = tokens.map((t) =>
                    t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                  );
                  const pattern =
                    escaped.length > 0
                      ? new RegExp(`(${escaped.join('|')})`, 'gi')
                      : null;
                  // primary 계열 + 보조 팔레트 — WCAG AA 충족 범위 내 색 순환.
                  const palette = [
                    'bg-primary/30 text-foreground',
                    'bg-amber-500/30 text-amber-50',
                    'bg-emerald-500/30 text-emerald-50',
                    'bg-sky-500/30 text-sky-50',
                    'bg-fuchsia-500/30 text-fuchsia-50',
                    'bg-rose-500/30 text-rose-50',
                  ];
                  const indexOfToken = (part: string) => {
                    const lower = part.toLowerCase();
                    return tokens.findIndex((t) => t.toLowerCase() === lower);
                  };
                  const highlight = (text: string) => {
                    if (!pattern) return <span>{text}</span>;
                    return text.split(pattern).map((part, idx) => {
                      const tokenIdx = idx % 2 === 1 ? indexOfToken(part) : -1;
                      if (tokenIdx < 0) return <span key={idx}>{part}</span>;
                      const color = palette[tokenIdx % palette.length];
                      return (
                        <mark key={idx} className={`${color} rounded px-0.5`}>
                          {part}
                        </mark>
                      );
                    });
                  };

                  return searchResults.map((r, i) => (
                    <li key={`${r.conversationId}-${r.messageId ?? 'title'}-${i}`}>
                      <button
                        type="button"
                        onClick={() => {
                          onGlobalSearchResult?.(r.conversationId, r.messageId);
                          setGlobalQuery('');
                          setOpen(false);
                        }}
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-muted"
                      >
                        <div className="flex items-center gap-1.5">
                          {r.role === 'title' ? (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-[1px] rounded">
                              제목
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-[1px] rounded',
                                r.role === 'user'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-sky-400 bg-sky-500/10',
                              )}
                            >
                              {r.role === 'user' ? '요청' : '응답'}
                            </span>
                          )}
                          <span className="truncate text-xs font-medium">
                            {highlight(r.conversationTitle)}
                          </span>
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                            {relativeTime(r.matchedAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                          {highlight(r.snippet)}
                        </p>
                      </button>
                    </li>
                  ));
                })()}
              </ul>
            )}
          </div>
        ) : archivedOpen ? (
          <div className="flex-1 overflow-y-auto p-2">
            {archivedList.length > 0 && (
              <div className="px-2 pb-2 border-b mb-2">
                <input
                  value={archivedQuery}
                  onChange={(e) => setArchivedQuery(e.target.value)}
                  placeholder="보관함에서 제목·태그 검색..."
                  className="w-full rounded border bg-background px-2 py-1.5 text-xs"
                />
              </div>
            )}
            {archivedLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로딩 중...
              </div>
            ) : archivedList.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                보관된 대화가 없습니다.
              </div>
            ) : (() => {
              const q = archivedQuery.trim().toLowerCase();
              const filteredArchived = q
                ? archivedList.filter((c) => {
                    if (c.title.toLowerCase().includes(q)) return true;
                    return (c.tags ?? []).some((t) => t.toLowerCase().includes(q));
                  })
                : archivedList;
              if (filteredArchived.length === 0) {
                return (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    &quot;{archivedQuery}&quot; 에 해당하는 보관 대화가 없습니다.
                  </div>
                );
              }
              return (
              <ul className="space-y-1">
                {filteredArchived.map((conv) => (
                  <li key={conv.id}>
                    <div className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{conv.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {relativeTime(conv.last_message_at)} · 보관됨
                        </p>
                      </div>
                      <div className="flex shrink-0 opacity-60 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await onUnarchive(conv.id);
                            if (ok) {
                              setArchivedList((prev) => prev.filter((c) => c.id !== conv.id));
                            }
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
                          title="복구"
                          aria-label="복구"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`"${conv.title}" 대화를 영구 삭제할까요?`)) {
                              const ok = await onDelete(conv.id);
                              if (ok) {
                                setArchivedList((prev) => prev.filter((c) => c.id !== conv.id));
                              }
                            }
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded hover:bg-rose-500/20 text-rose-400"
                          title="영구 삭제"
                          aria-label="영구 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              );
            })()}
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto p-2">
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 px-2 pb-2 border-b mb-2">
              <button
                type="button"
                onClick={() => onTagFilterChange(null)}
                className={cn(
                  'text-[11px] px-2 py-1 rounded-full border transition-colors',
                  tagFilter === null
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground',
                )}
              >
                전체 ({conversations.length})
              </button>
              {allTags.map((t) => {
                const count = conversations.filter((c) => (c.tags ?? []).includes(t)).length;
                const active = tagFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTagFilterChange(active ? null : t)}
                    className={cn(
                      'text-[11px] px-2 py-1 rounded-full border transition-colors flex items-center gap-1',
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border',
                    )}
                  >
                    <TagIcon className="h-2.5 w-2.5" />
                    {t}
                    <span className="text-[10px] opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로딩 중...
            </div>
          ) : visibleConversations.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {tagFilter
                ? `"${tagFilter}" 태그의 대화가 없습니다.`
                : <>대화가 없습니다.<br />상단 &quot;새 대화&quot; 를 눌러 시작하세요.</>}
            </div>
          ) : (
            <ul className="space-y-1">
              {visibleConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const isRenaming = renamingId === conv.id;
                const isTagEditing = tagEditId === conv.id;
                const isSwiping = swipe?.id === conv.id;
                const swipeDelta = isSwiping ? swipe.delta : 0;
                const willArchive = swipeDelta <= -SWIPE_ARCHIVE_THRESHOLD;
                return (
                  <li key={conv.id} className="relative overflow-hidden rounded-lg">
                    {/* 스와이프 드러나는 배경 — 오른쪽에서 왼쪽으로 제목이 밀리면 나타난다 */}
                    {isSwiping && swipeDelta < 0 && (
                      <div
                        className={cn(
                          'absolute inset-y-0 right-0 flex items-center justify-end px-4 text-[11px] font-semibold rounded-lg transition-colors',
                          willArchive ? 'bg-amber-500/30 text-amber-100' : 'bg-amber-500/10 text-amber-400',
                        )}
                        style={{ width: Math.abs(swipeDelta) }}
                      >
                        {willArchive ? '✓ 놓으면 보관' : '← 보관'}
                      </div>
                    )}
                    <div
                      className={cn(
                        'group rounded-lg transition-colors relative bg-background',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted',
                      )}
                      style={{
                        transform: isSwiping ? `translateX(${swipeDelta}px)` : undefined,
                        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
                      }}
                      onTouchStart={(e) => handleSwipeStart(conv.id, e)}
                      onTouchMove={(e) => handleSwipeMove(conv.id, e)}
                      onTouchEnd={() => handleSwipeEnd(conv.id)}
                      onTouchCancel={() => setSwipe(null)}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => !isRenaming && !isTagEditing && handleSelect(conv.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          {isRenaming ? (
                            <input
                              autoFocus
                              className="w-full rounded border bg-background px-2 py-1 text-sm"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') {
                                  setRenamingId(null);
                                  setRenameDraft('');
                                }
                              }}
                              onBlur={commitRename}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                {conv.pinned && (
                                  <Pin
                                    className="h-3 w-3 shrink-0 fill-current text-amber-400"
                                    aria-label="고정됨"
                                  />
                                )}
                                <p className="truncate text-sm font-medium">{conv.title}</p>
                                {sharedIds.has(conv.id) && (
                                  <Link2
                                    className="h-3 w-3 shrink-0 text-primary"
                                    aria-label="공유 링크 활성"
                                  />
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {relativeTime(conv.last_message_at)}
                              </p>
                              {(conv.tags ?? []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(conv.tags ?? []).map((t) => (
                                    <span
                                      key={t}
                                      className="text-[10px] px-1.5 py-[1px] rounded-full bg-muted border text-muted-foreground"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </button>

                        {!isRenaming && !isTagEditing && (
                          <div className="flex shrink-0 opacity-60 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openTagEditor(conv.id)}
                              className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
                              title="태그 편집"
                              aria-label="태그 편집"
                            >
                              <TagIcon className="h-3.5 w-3.5" />
                            </button>
                            {onTogglePin && (
                              <button
                                type="button"
                                onClick={() => onTogglePin(conv.id)}
                                className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
                                title={conv.pinned ? '고정 해제' : '상단에 고정'}
                                aria-label={conv.pinned ? '고정 해제' : '고정'}
                              >
                                {conv.pinned ? (
                                  <PinOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Pin className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startRename(conv.id, conv.title)}
                              className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
                              title="이름 변경"
                              aria-label="이름 변경"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {onRefineTitle && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await onRefineTitle(conv.id);
                                  if (!ok) {
                                    // 실패 시 별도 토스트는 handler 가 담당.
                                  }
                                }}
                                className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
                                title="제목 다시 뽑기 — 첫 메시지 기반 자동 재생성"
                                aria-label="제목 다시 뽑기"
                              >
                                <Wand2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onArchive(conv.id)}
                              className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
                              title="보관"
                              aria-label="보관"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`"${conv.title}" 대화를 삭제할까요?`)) {
                                  onDelete(conv.id);
                                }
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded hover:bg-rose-500/20 text-rose-400"
                              title="삭제"
                              aria-label="삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isTagEditing && (
                        <div className="px-3 pb-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                              value={tagDraft}
                              onChange={(e) => setTagDraft(e.target.value)}
                              placeholder="태그를 쉼표로 구분 (예: 버그, 리팩토링)"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitTags();
                                if (e.key === 'Escape') {
                                  setTagEditId(null);
                                  setTagDraft('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={commitTags}
                              className="text-[11px] px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTagEditId(null);
                                setTagDraft('');
                              }}
                              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
                              aria-label="닫기"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          {(() => {
                            const currentTokens = new Set(
                              tagDraft
                                .split(/[,\n]/)
                                .map((t) => t.trim())
                                .filter(Boolean),
                            );
                            const suggestions = allTags.filter(
                              (t) => !currentTokens.has(t),
                            );
                            if (suggestions.length === 0) return null;
                            return (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                <span className="text-[10px] text-muted-foreground self-center">
                                  기존:
                                </span>
                                {suggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      const trimmed = tagDraft.trim();
                                      const next = trimmed
                                        ? trimmed.replace(/,\s*$/, '') + ', ' + s
                                        : s;
                                      setTagDraft(next);
                                    }}
                                    className="text-[10px] px-1.5 py-[1px] rounded-full bg-muted border hover:bg-primary/10 hover:border-primary/40"
                                  >
                                    + {s}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            최대 8개 · 각 최대 24자. 쉼표(,)로 구분해 입력하세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
