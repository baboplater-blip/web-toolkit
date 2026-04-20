'use client';

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAgents } from '@/lib/hooks/useAgents';
import { useConversations } from '@/lib/hooks/useConversations';
import { useHarnesses } from '@/lib/hooks/useHarnesses';
import { useMessages } from '@/lib/hooks/useMessages';
import { useNotification } from '@/lib/hooks/useNotification';
import { useOutbox } from '@/lib/hooks/useOutbox';
import { useActiveTaskCount } from '@/lib/hooks/useActiveTasks';
import { enqueue as enqueueOutbox } from '@/lib/outbox';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PCPicker } from '@/components/chat/PCPicker';
import { ConversationPicker } from '@/components/chat/ConversationPicker';
import { ConversationOptionsMenu } from '@/components/chat/ConversationOptionsMenu';
import { SummaryCard } from '@/components/chat/SummaryCard';
import { HarnessSelector } from '@/components/sidebar/HarnessSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateMenu } from '@/components/chat/TemplateMenu';
import { Square, Search, X, MessageSquarePlus, SlidersHorizontal, Download, Pin, ChevronUp, ChevronDown, WifiOff, Clock } from 'lucide-react';
import { formatOfflineDuration } from '@/lib/format-time';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { exportConversation } from '@/lib/export-conversation';
import { refineTitle } from '@/lib/refine-title';
import { safeUuidParam } from '@/lib/validators';
import {
  CLAUDE_CONTEXT_LIMIT,
  contextUsageLevel,
  estimateConversationTokens,
} from '@/lib/context-size';
import { cn } from '@/lib/utils';

interface FilterGroupProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}
function FilterGroup<T extends string>({ label, value, onChange, options }: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex rounded-md border bg-muted/40 p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'px-2 h-6 rounded text-[11px] transition-colors',
              value === o.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  // URL 파라미터는 UUID 형식만 수용 — 외부 유입 주입을 원천 차단.
  const presetAgentId = safeUuidParam(searchParams?.get('agent'));
  const presetConversationId = safeUuidParam(searchParams?.get('conversation'));
  const presetMessageId = safeUuidParam(searchParams?.get('message'));
  const [targetMessageId, setTargetMessageId] = useState<string | null>(presetMessageId);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(presetAgentId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    presetConversationId,
  );
  const [selectedHarnessId, setSelectedHarnessId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // 입력란 임시 저장 — 대화 단위로 sessionStorage 에 50자 이상일 때만 저장/복원.
  // 새로고침·실수 navigate 방지. 전송 성공 시에는 MessageInput 이 빈 문자열로 초기화.
  const inputDraftKey = selectedConversationId
    ? `acp:chat-draft:${selectedConversationId}`
    : null;
  useEffect(() => {
    if (!inputDraftKey) return;
    try {
      const saved = sessionStorage.getItem(inputDraftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && saved.length >= 50) setInputValue(saved);
    } catch {}
    // 의존성은 대화 변경 시에만 복원.
  }, [inputDraftKey]);
  useEffect(() => {
    if (!inputDraftKey) return;
    try {
      if (inputValue.length >= 50) {
        sessionStorage.setItem(inputDraftKey, inputValue);
      } else {
        sessionStorage.removeItem(inputDraftKey);
      }
    } catch {}
  }, [inputDraftKey, inputValue]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'assistant' | 'system'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'error' | 'cancelled'>(
    'all',
  );
  const [filterDate, setFilterDate] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [filterReaction, setFilterReaction] = useState<'all' | 'up' | 'down' | 'curious' | 'any'>(
    'all',
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { agents, loading: agentsLoading } = useAgents();
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );
  const isAgentOffline = selectedAgent?.status === 'offline';
  const { harnesses } = useHarnesses(selectedAgentId);
  const selectedHarness = useMemo(
    () => harnesses.find((h) => h.id === selectedHarnessId) ?? null,
    [harnesses, selectedHarnessId],
  );
  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
    renameConversation,
    archiveConversation,
    togglePinConversation,
    unarchiveConversation,
    listArchived,
    deleteConversation,
    forkConversation,
    updateConversationTags,
    updateConversationSummary,
  } = useConversations(selectedAgentId);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const activeTaskCount = useActiveTaskCount();

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );
  const {
    messages,
    loading: messagesLoading,
    loadingOlder,
    hasMore,
    loadOlder,
    sendMessage,
    clearMessages,
    cancelRunning,
    isRunning,
    togglePin,
    setReaction,
    forceStop,
    isFromCache,
  } = useMessages(selectedAgentId, selectedConversationId, selectedConversation);

  useNotification(messages);

  const outbox = useOutbox();

  // MessageList 빈 상태의 예시 프롬프트 클릭 시 입력창에 주입.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string' && detail.trim()) {
        setInputValue(detail);
      }
    };
    window.addEventListener('acp:prefill-input', handler);
    return () => window.removeEventListener('acp:prefill-input', handler);
  }, []);

  // 대화 제목 수동 재정제 — 첫 user 메시지 조회 후 refineTitle 적용.
  const handleRefineTitle = useCallback(
    async (conversationId: string): Promise<boolean> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
        .limit(1);
      if (error || !data || data.length === 0) {
        toast('첫 메시지를 찾지 못해 재정제할 수 없습니다', { variant: 'warning' });
        return false;
      }
      const refined = refineTitle(data[0].content as string);
      if (!refined) {
        toast('재정제 결과가 비어 있어 변경을 건너뜁니다', { variant: 'info' });
        return false;
      }
      const ok = await renameConversation(conversationId, refined);
      if (ok) toast(`제목이 "${refined}" 로 갱신되었습니다`, { variant: 'success' });
      return ok;
    },
    [renameConversation],
  );

  // 30일 이상 무활동 대화 일괄 아카이브 — 반환은 이동된 개수.
  const handleBulkArchive = useCallback(async (): Promise<number> => {
    if (!selectedAgentId) return 0;
    const supabase = createClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const { data: old } = await supabase
      .from('conversations')
      .select('id')
      .eq('agent_id', selectedAgentId)
      .eq('archived', false)
      .lt('last_message_at', cutoff.toISOString());
    if (!old || old.length === 0) return 0;
    const ids = (old as { id: string }[]).map((r) => r.id);
    const { error } = await supabase
      .from('conversations')
      .update({ archived: true })
      .in('id', ids);
    if (error) {
      toast(`일괄 보관 실패: ${error.message}`, { variant: 'error' });
      return 0;
    }
    toast(`${ids.length}개 대화를 보관했습니다`, { variant: 'success', duration: 5000 });
    return ids.length;
  }, [selectedAgentId]);

  // 첫 교환 완료 후 대화 제목을 정제본으로 교체. 한 대화당 한 번만.
  const autoTitledRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedConversationId || !selectedConversation) return;
    if (autoTitledRef.current.has(selectedConversationId)) return;

    const firstUser = messages.find((m) => m.role === 'user');
    const firstAssistant = messages.find(
      (m) => m.role === 'assistant' && m.status === 'completed',
    );
    if (!firstUser || !firstAssistant) return;

    const refined = refineTitle(firstUser.content);
    if (!refined || refined === selectedConversation.title) {
      autoTitledRef.current.add(selectedConversationId);
      return;
    }
    // "새 대화" 기본 제목이거나 원본 메시지 절단본일 때만 교체 (사용자 수동 편집은 존중).
    const isGeneric =
      selectedConversation.title === '새 대화' ||
      firstUser.content.slice(0, 40).trim() === selectedConversation.title.trim();
    if (!isGeneric) {
      autoTitledRef.current.add(selectedConversationId);
      return;
    }
    autoTitledRef.current.add(selectedConversationId);
    renameConversation(selectedConversationId, refined);
  }, [selectedConversationId, selectedConversation, messages, renameConversation]);

  /**
   * 현재 대화에서 아직 응답을 받지 못한 user 메시지 수.
   * 에이전트 오프라인 시 "대기 중 N건" 표시에 사용.
   * user 다음에 assistant 가 보이면 응답됨. user 이후 assistant 없이 끝 또는 다시 user 면 orphan.
   */
  const orphanUserCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role !== 'user') continue;
      let hasResponse = false;
      for (let j = i + 1; j < messages.length; j++) {
        if (messages[j].role === 'assistant') {
          hasResponse = true;
          break;
        }
      }
      if (!hasResponse) count++;
    }
    return count;
  }, [messages]);

  // 에이전트 자동 선택 — URL param 또는 목록 첫 온라인 PC.
  useEffect(() => {
    if (selectedAgentId) return;
    if (presetAgentId && agents.some((a) => a.id === presetAgentId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAgentId(presetAgentId);
      return;
    }
    if (agents.length > 0) {
      const online = agents.find(
        (a) => a.status === 'online' || a.status === 'busy',
      );
      setSelectedAgentId((online ?? agents[0]).id);
    }
  }, [agents, presetAgentId, selectedAgentId]);

  // 에이전트·대화 선택 동기화: 에이전트 변경 시 선택 해제, 목록 로드 시 자동 선택.
  // setState in effect 경고는 파생 상태 계산 목적이라 의도적으로 허용한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedConversationId(null);
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    if (selectedConversationId) {
      if (conversations.length > 0 && !conversations.some((c) => c.id === selectedConversationId)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedConversationId(null);
      }
      return;
    }
    if (conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedAgentId, selectedConversationId]);

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const hasFilter =
      filterRole !== 'all' ||
      filterStatus !== 'all' ||
      filterDate !== 'all' ||
      filterReaction !== 'all';
    if (!hasQuery && !hasFilter) return messages;

    // useMemo 는 pure 해야 하지만 메시지 본인의 created_at 과 비교할 cutoff 는 "이 렌더 시점"
    // 의 현재 시간이면 충분하다. 규칙 위반 경고만 진정시키기 위해 지역 helper 로 분리.
    const getCutoff = () => {
      const nowTs = new Date().getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      if (filterDate === 'today') {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t.getTime();
      }
      if (filterDate === '7d') return nowTs - 7 * dayMs;
      if (filterDate === '30d') return nowTs - 30 * dayMs;
      return 0;
    };
    const cutoff = getCutoff();

    return messages.filter((m) => {
      if (filterRole !== 'all' && m.role !== filterRole) return false;
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (cutoff > 0 && new Date(m.created_at).getTime() < cutoff) return false;
      if (filterReaction !== 'all') {
        if (filterReaction === 'any' && !m.reaction) return false;
        if (
          filterReaction !== 'any' &&
          m.reaction !== filterReaction
        ) {
          return false;
        }
      }
      if (hasQuery && !m.content.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [messages, searchQuery, filterRole, filterStatus, filterDate, filterReaction]);

  const activeFilterCount =
    (filterRole !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterDate !== 'all' ? 1 : 0) +
    (filterReaction !== 'all' ? 1 : 0);

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    // 이 PC 의 마지막 하네스 선택 복원 (localStorage). 없으면 null.
    let restored: string | null = null;
    try {
      restored = localStorage.getItem(`acp:last-harness:${id}`);
    } catch {}
    setSelectedHarnessId(restored);
    setSearchOpen(false);
    setSearchQuery('');
  };

  // 하네스 변경 시 현재 PC 용으로 기억.
  useEffect(() => {
    if (!selectedAgentId) return;
    try {
      if (selectedHarnessId) {
        localStorage.setItem(`acp:last-harness:${selectedAgentId}`, selectedHarnessId);
      } else {
        localStorage.removeItem(`acp:last-harness:${selectedAgentId}`);
      }
    } catch {}
  }, [selectedAgentId, selectedHarnessId]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleSend = useCallback(
    async (content: string, opts?: { timeoutExtended?: boolean }) => {
      const isNetOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      // 네트워크 오프라인 — Supabase 에 도달할 수 없으므로 outbox 에 적재 후 복귀 시 flush.
      if (isNetOffline) {
        if (!selectedAgentId) return false;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast('로그인 필요', { variant: 'warning' });
          return false;
        }
        await enqueueOutbox({
          userId: user.id,
          agentId: selectedAgentId,
          conversationId: selectedConversationId,
          harnessId: selectedHarnessId,
          content,
        });
        await outbox.refresh();
        toast('오프라인 — 보낸 메시지는 복귀 시 자동 전송됩니다', {
          variant: 'info',
          duration: 5000,
        });
        return true;
      }

      let convId = selectedConversationId;
      if (!convId) {
        const created = await createConversation();
        if (!created) return false;
        convId = created.id;
        setSelectedConversationId(created.id);
      }
      const ok = await sendMessage(content, selectedHarnessId, convId, opts);
      if (ok && isAgentOffline) {
        toast('PC 오프라인 — 복귀 시 자동 실행됩니다', {
          variant: 'info',
          duration: 5000,
        });
      }
      return ok;
    },
    [
      createConversation,
      selectedConversationId,
      selectedAgentId,
      selectedHarnessId,
      sendMessage,
      isAgentOffline,
      outbox,
    ],
  );

  const handleRetry = useCallback(
    (content: string, opts?: { timeoutExtended?: boolean }) => {
      handleSend(content, opts);
    },
    [handleSend],
  );

  /**
   * user 메시지 편집 — 해당 메시지 직전까지 포크 후 수정된 내용을 새 대화에 전송.
   * 원본 대화는 유지되어 나중에 다시 돌아볼 수 있다.
   */
  const handleEdit = useCallback(
    async (messageId: string, newContent: string) => {
      if (!selectedConversationId) return;
      const forked = await forkConversation(selectedConversationId, {
        untilMessageId: messageId,
        suffix: '(편집 분기)',
      });
      if (!forked) return;
      setSelectedConversationId(forked.id);
      // 새 대화가 로드된 뒤 전송. useMessages 가 conversationId 변경을 반영하기까지 한 tick.
      setTimeout(() => {
        sendMessage(newContent, selectedHarnessId, forked.id);
      }, 50);
      toast(`"${forked.title}" 로 분기하며 재전송됩니다`, {
        variant: 'success',
        duration: 6000,
      });
    },
    [selectedConversationId, forkConversation, sendMessage, selectedHarnessId],
  );

  /**
   * 특정 메시지 지점에서 분기만 수행 — 사용자가 직접 다음 입력을 결정.
   * 편집과 달리 "여기까지" 복제하고 빈 입력창으로 둔다.
   */
  const handleBranch = useCallback(
    async (messageId: string) => {
      if (!selectedConversationId) return;
      const forked = await forkConversation(selectedConversationId, {
        untilMessageId: messageId,
        suffix: '(여기서 분기)',
      });
      if (!forked) return;
      setSelectedConversationId(forked.id);
      toast(`"${forked.title}" 로 분기했습니다`, {
        variant: 'success',
        duration: 6000,
      });
    },
    [selectedConversationId, forkConversation],
  );

  const handleNewConversation = useCallback(async () => {
    const created = await createConversation();
    if (created) {
      setSelectedConversationId(created.id);
      setInputValue('');
    }
  }, [createConversation]);

  /**
   * 메시지 인용 — 입력창에 `> `로 시작하는 blockquote 로 프리필한다.
   * 긴 응답은 앞의 500자만 가져와서 빈 줄 한 줄과 함께 새 프롬프트 공간 남김.
   */
  const handleQuote = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const clipped = trimmed.length > 500 ? trimmed.slice(0, 500) + '…' : trimmed;
      const quoted = clipped
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      setInputValue((prev) => {
        const base = prev.trim();
        if (!base) return `${quoted}\n\n`;
        return `${base}\n\n${quoted}\n\n`;
      });
    },
    [],
  );

  const handleToggleSearch = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  /**
   * 검색 결과 간 이동. Enter/Shift+Enter 와 버튼 모두에서 재사용.
   * 필터가 바뀌어 기존 인덱스가 범위를 벗어나면 0 으로 안전 복귀.
   */
  const jumpSearchResult = useCallback(
    (dir: 'prev' | 'next') => {
      const count = filteredMessages.length;
      if (count === 0) return;
      setSearchIndex((prev) => {
        const safePrev = prev >= count ? 0 : prev;
        const next =
          dir === 'next' ? (safePrev + 1) % count : (safePrev - 1 + count) % count;
        const target = filteredMessages[next];
        if (target) {
          setTargetMessageId(null);
          setTimeout(() => setTargetMessageId(target.id), 10);
        }
        return next;
      });
    },
    [filteredMessages],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        jumpSearchResult(e.shiftKey ? 'prev' : 'next');
      }
    },
    [jumpSearchResult],
  );

  // 검색 결과 크기 변화 시 표시용 clamp. 상태는 필터가 바뀌어도 굳이 리셋하지 않고
  // jumpSearchResult 가 안전하게 wrap 한다.
  const displaySearchIndex = Math.min(searchIndex, Math.max(0, filteredMessages.length - 1));

  // 전역 키보드 단축키.
  // - Cmd/Ctrl+K: 현재 대화 내 메시지 검색 토글
  // - Cmd/Ctrl+Shift+N: 새 대화
  // - ?: 단축키 안내 토스트
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (selectedConversationId) handleToggleSearch();
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (selectedAgentId) handleNewConversation();
        return;
      }
      // Cmd/Ctrl+B: 현재 대화 상단 고정 토글
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'b') {
        if (!selectedConversationId) return;
        e.preventDefault();
        togglePinConversation(selectedConversationId);
        return;
      }
      // Cmd/Ctrl+Shift+B: 현재 대화 보관
      if (mod && e.shiftKey && e.key.toLowerCase() === 'b') {
        if (!selectedConversationId) return;
        e.preventDefault();
        if (confirm('이 대화를 보관함으로 옮길까요?')) {
          archiveConversation(selectedConversationId).then((ok) => {
            if (ok) setSelectedConversationId(null);
          });
        }
        return;
      }
      if (!isTyping && e.key === '?') {
        e.preventDefault();
        toast(
          '단축키: Ctrl/⌘+K 검색 · Ctrl/⌘+Shift+N 새 대화 · Ctrl/⌘+B 고정 · Ctrl/⌘+Shift+B 보관 · Esc 닫기',
          { variant: 'info', duration: 6000 },
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedAgentId,
    selectedConversationId,
    handleToggleSearch,
    handleNewConversation,
    togglePinConversation,
    archiveConversation,
  ]);

  const handleCreateShareLink = useCallback(async () => {
    if (!selectedConversationId) return;
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast('로그인이 필요합니다', { variant: 'warning' });
      return;
    }
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversation_id: selectedConversationId }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast(`공유 링크 생성 실패: ${body.error ?? res.status}`, { variant: 'error' });
        return;
      }
      const url: string = body.share_url;
      try {
        await navigator.clipboard.writeText(url);
        toast('공유 링크를 클립보드에 복사했습니다', { variant: 'success', duration: 6000 });
      } catch {
        toast(`공유 링크: ${url}`, { variant: 'info', duration: 12000 });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast(`공유 링크 생성 실패: ${msg}`, { variant: 'error' });
    }
  }, [selectedConversationId]);

  const handleRevokeShareLinks = useCallback(async () => {
    if (!selectedConversationId) return;
    if (!confirm('이 대화의 모든 공유 링크를 비활성화할까요?')) return;
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/share/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversation_id: selectedConversationId }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast(`해제 실패: ${body.error ?? res.status}`, { variant: 'error' });
        return;
      }
      toast(`${body.revoked ?? 0}개의 공유 링크가 비활성화되었습니다`, { variant: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast(`해제 실패: ${msg}`, { variant: 'error' });
    }
  }, [selectedConversationId]);

  return (
    <div
      id="main-content"
      className="flex h-[calc(100dvh-3.5rem)] flex-col bg-background md:h-dvh"
    >
      {/* 헤더 */}
      <header className="flex items-center gap-1 border-b px-3 h-[52px] shrink-0">
        <div className="min-w-0 flex-1 flex items-center gap-1">
          <PCPicker
            agents={agents}
            selectedId={selectedAgentId}
            onSelect={handleSelectAgent}
            loading={agentsLoading}
          />
          {selectedAgentId && (
            <ConversationPicker
              conversations={conversations}
              selectedId={selectedConversationId}
              loading={conversationsLoading}
              onSelect={handleSelectConversation}
              onNew={createConversation}
              onRename={renameConversation}
              onRefineTitle={handleRefineTitle}
              onTogglePin={togglePinConversation}
              onArchive={archiveConversation}
              onBulkArchive={handleBulkArchive}
              onUnarchive={unarchiveConversation}
              onDelete={deleteConversation}
              loadArchived={listArchived}
              onUpdateTags={updateConversationTags}
              tagFilter={tagFilter}
              onTagFilterChange={setTagFilter}
              agentId={selectedAgentId}
              onGlobalSearchResult={(convId, messageId) => {
                setSelectedConversationId(convId);
                if (messageId) {
                  setTargetMessageId(null);
                  setTimeout(() => setTargetMessageId(messageId), 100);
                }
              }}
            />
          )}
        </div>

        {selectedAgentId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground"
            onClick={handleNewConversation}
            aria-label="새 대화 시작"
            title="새 대화 시작"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        )}
        {selectedAgentId && isRunning && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9 text-xs px-3"
            onClick={cancelRunning}
          >
            <Square className="h-3.5 w-3.5 mr-1" />
            중지
          </Button>
        )}
        {selectedConversationId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground"
            onClick={handleToggleSearch}
            aria-label="메시지 검색"
            title="메시지 검색"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
        )}
        {selectedConversationId && messages.length > 0 && (
          <ConversationOptionsMenu
            conversationId={selectedConversationId}
            conversations={conversations}
            messages={messages}
            isRunning={isRunning}
            onCreateShareLink={handleCreateShareLink}
            onRevokeShareLinks={handleRevokeShareLinks}
            onFork={forkConversation}
            onSelectConversation={setSelectedConversationId}
            onClearMessages={clearMessages}
          />
        )}
      </header>

      {/* 검색 바 */}
      <div
        className={cn(
          'overflow-hidden border-b bg-background transition-[max-height] duration-200',
          searchOpen ? (filterOpen ? 'max-h-40' : 'max-h-12') : 'max-h-0',
        )}
      >
        <div className="flex h-12 items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="이 대화에서 검색..."
            className="h-9 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          {(searchQuery || activeFilterCount > 0) && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {filteredMessages.length > 0
                ? `${displaySearchIndex + 1} / ${filteredMessages.length}`
                : '0건'}
            </span>
          )}
          {filteredMessages.length > 0 && (searchQuery || activeFilterCount > 0) && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => jumpSearchResult('prev')}
                title="이전 결과 (Shift+Enter)"
                aria-label="이전 결과"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => jumpSearchResult('next')}
                title="다음 결과 (Enter)"
                aria-label="다음 결과"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant={filterOpen || activeFilterCount > 0 ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setFilterOpen((v) => !v)}
            title="필터"
            aria-label="필터"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="ml-0.5 text-[10px] font-semibold">{activeFilterCount}</span>
            )}
          </Button>
        </div>
        {filterOpen && (
          <div className="flex flex-wrap items-center gap-2 px-3 pb-2 text-[11px]">
            <FilterGroup
              label="역할"
              value={filterRole}
              onChange={(v) => setFilterRole(v as typeof filterRole)}
              options={[
                { value: 'all', label: '전체' },
                { value: 'user', label: '요청' },
                { value: 'assistant', label: '응답' },
                { value: 'system', label: '시스템' },
              ]}
            />
            <FilterGroup
              label="상태"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as typeof filterStatus)}
              options={[
                { value: 'all', label: '전체' },
                { value: 'completed', label: '완료' },
                { value: 'error', label: '오류' },
                { value: 'cancelled', label: '취소' },
              ]}
            />
            <FilterGroup
              label="기간"
              value={filterDate}
              onChange={(v) => setFilterDate(v as typeof filterDate)}
              options={[
                { value: 'all', label: '전체' },
                { value: 'today', label: '오늘' },
                { value: '7d', label: '7일' },
                { value: '30d', label: '30일' },
              ]}
            />
            <FilterGroup
              label="반응"
              value={filterReaction}
              onChange={(v) => setFilterReaction(v as typeof filterReaction)}
              options={[
                { value: 'all', label: '전체' },
                { value: 'any', label: '표시된 것만' },
                { value: 'up', label: '👍' },
                { value: 'down', label: '👎' },
                { value: 'curious', label: '💡' },
              ]}
            />
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2 ml-auto"
                onClick={() => {
                  setFilterRole('all');
                  setFilterStatus('all');
                  setFilterDate('all');
                  setFilterReaction('all');
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 컨텍스트 크기 경고 — 70% 이상이면 요약/분기 권장 */}
      {selectedConversationId && messages.length > 20 && (() => {
        const tokens = estimateConversationTokens(messages);
        const level = contextUsageLevel(tokens);
        if (level === 'ok') return null;
        const pct = Math.round((tokens / CLAUDE_CONTEXT_LIMIT) * 100);
        const cls =
          level === 'danger'
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
        return (
          <div
            className={cn('border-b px-3 py-1.5 text-[11px] flex items-center gap-2', cls)}
          >
            <span>
              컨텍스트 ~{tokens.toLocaleString('ko-KR')} 토큰 ({pct}%)
              {level === 'danger' ? ' — 응답 품질이 떨어질 수 있습니다' : ''}
            </span>
            <span className="opacity-60">— 요약하거나 새 대화로 분기 권장</span>
          </div>
        );
      })()}

      {/* 메시지 볼륨 경고 — 1000개 이상이면 아카이브 권장 */}
      {selectedConversationId && messages.length >= 1000 && (
        <div className="border-b bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400 flex items-center gap-2">
          <span>⚠️ 이 대화는 {messages.length.toLocaleString()}개 메시지가 쌓였습니다.</span>
          <button
            type="button"
            className="underline hover:text-amber-300"
            onClick={async () => {
              if (!confirm('이 대화를 보관하고 새 대화를 시작할까요?')) return;
              const ok = await archiveConversation(selectedConversationId);
              if (ok) {
                setSelectedConversationId(null);
                const created = await createConversation();
                if (created) setSelectedConversationId(created.id);
              }
            }}
          >
            보관 후 새 대화 시작
          </button>
        </div>
      )}

      {/* 오프라인 배너 — 선택된 PC 가 오프라인일 때 노출. 전송은 허용하고 복귀 시 자동 실행됨을 안내. */}
      {selectedAgentId && isAgentOffline && (
        <div className="border-b border-amber-500/30 bg-amber-500/5 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="font-medium">{selectedAgent?.name ?? 'PC'}</span> 오프라인 —
              보낸 명령은 복귀 시 자동 실행됩니다.
              {(() => {
                const dur = formatOfflineDuration(selectedAgent?.last_heartbeat);
                return dur ? <span className="ml-1 opacity-70">({dur})</span> : null;
              })()}
            </span>
            {orphanUserCount > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium">
                <Clock className="h-3 w-3" />
                대기 {orphanUserCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 진행 중 작업 배너 — 다른 대화/PC 에서 진행 중인 작업 수 표시. 현황 탭으로 이동 링크. */}
      {activeTaskCount > 0 && (
        <div className="border-b border-sky-500/30 bg-sky-500/5 px-4 py-1.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-[11px] text-sky-300 hover:text-sky-200"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            <span className="flex-1">
              전체 작업 <b>{activeTaskCount}</b>개 진행 중 · 클릭하면 현황 탭
            </span>
          </Link>
        </div>
      )}

      {/* 오프라인 캐시 배지 — 네트워크가 아직 응답 안 했거나 실패해서 IDB 스냅샷을 보여주고 있을 때 */}
      {isFromCache && (
        <div className="border-b border-sky-500/30 bg-sky-500/5 px-4 py-1.5">
          <p className="text-[11px] text-sky-400 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            오프라인 캐시에서 표시 중 — 연결되면 자동으로 최신 데이터로 갱신됩니다
          </p>
        </div>
      )}

      {/* 대화 요약 카드 — 긴 대화에서만 노출. 자동 생성 또는 수동 편집. */}
      {selectedConversationId && (() => {
        const conv = conversations.find((c) => c.id === selectedConversationId);
        if (!conv) return null;
        return (
          <SummaryCard
            conversation={conv}
            messages={messages}
            onSave={(summary) => updateConversationSummary(conv.id, summary)}
            onSend={handleSend}
          />
        );
      })()}

      {/* 핀된 메시지 띠 — 대화에 핀이 있을 때만 노출. 칩 클릭 시 해당 메시지로 스크롤. */}
      {(() => {
        const pinned = messages
          .filter((m) => m.pinned)
          .sort((a, b) => {
            const aT = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
            const bT = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
            return bT - aT;
          });
        if (pinned.length === 0) return null;
        return (
          <div className="border-b bg-amber-500/5 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Pin className="h-3 w-3 text-amber-500 fill-current" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                핀 ({pinned.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pinned.slice(0, 8).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    // 같은 id 에 대해 재클릭 시 재스크롤 되도록, 중간에 null 로 리셋.
                    setTargetMessageId(null);
                    setTimeout(() => setTargetMessageId(m.id), 10);
                  }}
                  className="text-[11px] px-2 py-1 rounded-full bg-background border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/60 max-w-[180px] truncate text-left"
                  title={m.content}
                >
                  <span className="text-muted-foreground mr-1">
                    {m.role === 'user' ? '나' : m.role === 'system' ? '시스템' : 'C'}:
                  </span>
                  {m.content.slice(0, 40)}
                </button>
              ))}
              {pinned.length > 8 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{pinned.length - 8}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* PC 없음 전용 빈 상태 — agents 전체가 비어있을 때 안내와 CTA */}
      {!agentsLoading && agents.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 rounded-2xl border bg-card p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl">🖥️</span>
            </div>
            <div>
              <p className="text-sm font-semibold">등록된 PC 가 없습니다</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                원격에서 Claude Code 를 실행하려면 먼저 PC 를 등록해야 합니다.
                설정에서 PowerShell 명령어를 받아 대상 PC 에 실행하세요.
              </p>
            </div>
            <Link
              href="/settings?tab=pcs"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              PC 추가하기 →
            </Link>
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      {agents.length > 0 && (
        <MessageList
          messages={filteredMessages}
          loading={messagesLoading}
          onRetry={handleRetry}
          hasMore={!searchQuery.trim() && activeFilterCount === 0 && hasMore}
          loadingOlder={loadingOlder}
          onLoadOlder={loadOlder}
          targetMessageId={targetMessageId}
          onTogglePin={togglePin}
          onQuote={handleQuote}
          onEdit={handleEdit}
          onBranch={handleBranch}
          onForceStop={forceStop}
          onSetReaction={setReaction}
        />
      )}

      {/* 빠른 승인 숏컷 — 최근 assistant 응답이 completed 이고 입력란이 비어있을 때만 노출. */}
      {(() => {
        const last = messages[messages.length - 1];
        const showShortcuts =
          selectedAgentId &&
          !isRunning &&
          !inputValue.trim() &&
          last &&
          last.role === 'assistant' &&
          last.status === 'completed';
        if (!showShortcuts) return null;
        const shortcuts = [
          { label: '진행', value: '진행' },
          { label: '계속', value: '계속 진행' },
          { label: '다음 단계', value: '다음 단계로 진행' },
          { label: '적용', value: '적용해주세요' },
          { label: '요약', value: '지금까지 한 작업을 간단히 요약해줘' },
        ];
        return (
          <div className="border-t bg-background shrink-0 px-3 py-1.5 flex flex-wrap gap-1">
            {shortcuts.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  handleSend(s.value);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                title={s.value}
              >
                {s.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* 입력 영역 — iOS 키보드 대응 padding-bottom 은 visualViewport 기반으로 동적 주입됨 */}
      <div
        className="border-t bg-background shrink-0"
        style={{ paddingBottom: 'var(--kb-inset-bottom, 0px)' }}
      >
        {selectedAgentId && (
          <div className="mx-auto max-w-3xl">
            <HarnessSelector
              agentId={selectedAgentId}
              selectedId={selectedHarnessId}
              onSelect={setSelectedHarnessId}
            />
          </div>
        )}
        <div className="mx-auto max-w-3xl px-3">
          <TemplateMenu
            onSelect={setInputValue}
            agentId={selectedAgentId}
            currentInput={inputValue}
            harnessFeatures={selectedHarness?.features ?? null}
          />
        </div>
        <MessageInput
          onSend={handleSend}
          disabled={!selectedAgentId}
          value={inputValue}
          onValueChange={setInputValue}
          placeholder={
            selectedConversationId
              ? (messages.some((m) => m.role === 'user')
                  ? '이 대화에 이어서 입력... (컨텍스트 자동 유지)'
                  : '명령을 입력하세요... (Enter로 전송)')
              : '메시지를 보내면 새 대화가 시작됩니다'
          }
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-dvh bg-background" />}>
      <ChatPageInner />
    </Suspense>
  );
}
