'use client';

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAgents } from '@/lib/hooks/useAgents';
import { useMessages } from '@/lib/hooks/useMessages';
import { useNotification } from '@/lib/hooks/useNotification';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PCPicker } from '@/components/chat/PCPicker';
import { HarnessSelector } from '@/components/sidebar/HarnessSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateMenu } from '@/components/chat/TemplateMenu';
import { Trash2, Square, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function ChatPageInner() {
  const searchParams = useSearchParams();
  const presetAgentId = searchParams?.get('agent') ?? null;

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(presetAgentId);
  const [selectedHarnessId, setSelectedHarnessId] = useState<string | null>(null);
  const [continueMode, setContinueMode] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { agents, loading: agentsLoading } = useAgents();
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    clearMessages,
    cancelRunning,
    isRunning,
  } = useMessages(selectedAgentId);

  useNotification(messages);

  // URL ?agent=id 또는 첫 로드 시 에이전트 기본 선택
  useEffect(() => {
    if (selectedAgentId) return;
    if (presetAgentId && agents.some((a) => a.id === presetAgentId)) {
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

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    setSelectedHarnessId(null);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSend = async (content: string) =>
    sendMessage(content, selectedHarnessId, continueMode);

  const handleRetry = useCallback(
    (content: string) => {
      sendMessage(content, selectedHarnessId, continueMode);
    },
    [sendMessage, selectedHarnessId, continueMode],
  );

  const handleToggleContinue = useCallback(() => {
    setContinueMode((prev) => !prev);
  }, []);

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

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchQuery('');
    }
  }, []);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col bg-background md:h-dvh">
      {/* 헤더 */}
      <header className="flex items-center gap-1 border-b px-3 h-[52px] shrink-0">
        <div className="flex-1 min-w-0">
          <PCPicker
            agents={agents}
            selectedId={selectedAgentId}
            onSelect={handleSelectAgent}
            loading={agentsLoading}
          />
        </div>

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
        {selectedAgentId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground"
            onClick={handleToggleSearch}
            aria-label="메시지 검색"
            title="메시지 검색"
          >
            {searchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        )}
        {selectedAgentId && !isRunning && messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground"
            onClick={clearMessages}
            aria-label="채팅 이력 삭제"
            title="채팅 이력 삭제"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </header>

      {/* 검색 바 (헤더 아래 슬라이드다운) */}
      <div
        className={cn(
          'overflow-hidden border-b bg-background transition-[height] duration-200',
          searchOpen ? 'h-12' : 'h-0',
        )}
      >
        <div className="flex h-12 items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="메시지 검색..."
            className="h-9 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          {searchQuery && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {filteredMessages.length}건
            </span>
          )}
        </div>
      </div>

      {/* 메시지 목록 */}
      <MessageList
        messages={filteredMessages}
        loading={messagesLoading}
        onRetry={handleRetry}
      />

      {/* 입력 영역 */}
      <div className="border-t bg-background shrink-0">
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
          />
        </div>
        <MessageInput
          onSend={handleSend}
          disabled={!selectedAgentId}
          continueMode={continueMode}
          onToggleContinue={handleToggleContinue}
          value={inputValue}
          onValueChange={setInputValue}
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
