'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAgents } from '@/lib/hooks/useAgents';
import { useMessages } from '@/lib/hooks/useMessages';
import { useNotification } from '@/lib/hooks/useNotification';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PCList } from '@/components/sidebar/PCList';
import { HarnessSelector } from '@/components/sidebar/HarnessSelector';
import { AgentLogs } from '@/components/sidebar/AgentLogs';
import { ScheduleManager } from '@/components/sidebar/ScheduleManager';
import { WebhookSetting } from '@/components/sidebar/WebhookSetting';
import { AddPCDialog } from '@/components/sidebar/AddPCDialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Trash2, Monitor, Square, Search, X, LayoutDashboard, FileCode } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedHarnessId, setSelectedHarnessId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [continueMode, setContinueMode] = useState(false);

  // 검색 상태
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { agents, loading: agentsLoading } = useAgents();
  const {
    messages, loading: messagesLoading, sendMessage,
    clearMessages, cancelRunning, isRunning,
  } = useMessages(selectedAgentId);

  // 브라우저 알림 (Feature 2)
  useNotification(messages);

  const router = useRouter();
  const supabase = createClient();

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // 검색 필터링된 메시지 (Feature 4)
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter((m) =>
      m.content.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    setSelectedHarnessId(null);
    setSidebarOpen(false);
    // 에이전트 변경 시 검색 초기화
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSend = async (content: string) => {
    return sendMessage(content, selectedHarnessId, continueMode);
  };

  const handleRetry = useCallback(
    (content: string) => {
      sendMessage(content, selectedHarnessId, continueMode);
    },
    [sendMessage, selectedHarnessId, continueMode]
  );

  const handleToggleContinue = useCallback(() => {
    setContinueMode((prev) => !prev);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleToggleSearch = useCallback(() => {
    setSearchOpen((prev) => {
      const nextOpen = !prev;
      if (!nextOpen) {
        setSearchQuery('');
      }
      return nextOpen;
    });
  }, []);

  // 검색 열릴 때 input에 포커스
  useEffect(() => {
    if (searchOpen) {
      // 약간의 딜레이 후 포커스 (렌더링 완료 대기)
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  // ESC 키로 검색 닫기
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    },
    []
  );

  // 사이드바 내용 (데스크탑과 모바일 공유)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3 font-semibold text-sm flex items-center gap-2">
        <Monitor className="h-4 w-4" />
        Agent Control Panel
      </div>
      <Separator />

      <div className="flex-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-4 pt-3 pb-1">
          PC 목록
        </p>
        <PCList
          agents={agents}
          selectedId={selectedAgentId}
          onSelect={handleSelectAgent}
          loading={agentsLoading}
        />
      </div>

      <HarnessSelector
        agentId={selectedAgentId}
        selectedId={selectedHarnessId}
        onSelect={setSelectedHarnessId}
      />

      <ScheduleManager agentId={selectedAgentId} />

      <AgentLogs agentId={selectedAgentId} />

      <WebhookSetting agentId={selectedAgentId} />

      <Separator />
      <div className="p-2 space-y-1">
        <AddPCDialog />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh bg-background">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex w-64 border-r flex-col">
        {sidebarContent}
      </aside>

      {/* 메인 채팅 영역 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <header className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0">
          {/* 모바일 메뉴 버튼 */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" />
              }
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>

          {/* 검색 바 또는 타이틀 */}
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="메시지 검색..."
                className="h-7 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleToggleSearch}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                {selectedAgent ? (
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-sm truncate">
                      {selectedAgent.name}
                    </h1>
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        selectedAgent.status === 'online'
                          ? 'bg-green-500'
                          : selectedAgent.status === 'busy'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                      }`}
                    />
                  </div>
                ) : (
                  <h1 className="text-sm text-muted-foreground">PC를 선택하세요</h1>
                )}
              </div>

              {selectedAgentId && isRunning && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={cancelRunning}
                >
                  <Square className="h-3 w-3 mr-1" />
                  중지
                </Button>
              )}
              {selectedAgentId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={handleToggleSearch}
                  title="메시지 검색"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              {selectedAgentId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={clearMessages}
                  title="채팅 이력 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Link href="/harnesses">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  title="하네스 분석"
                >
                  <FileCode className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  title="대시보드"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </header>

        {/* 메시지 목록 */}
        <MessageList messages={filteredMessages} loading={messagesLoading} onRetry={handleRetry} />

        {/* 메시지 입력 */}
        <MessageInput
          onSend={handleSend}
          disabled={!selectedAgentId}
          continueMode={continueMode}
          onToggleContinue={handleToggleContinue}
        />
      </main>
    </div>
  );
}
