'use client';

import { useState } from 'react';
import { useAgents } from '@/lib/hooks/useAgents';
import { useMessages } from '@/lib/hooks/useMessages';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PCList } from '@/components/sidebar/PCList';
import { HarnessSelector } from '@/components/sidebar/HarnessSelector';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Trash2, Monitor } from 'lucide-react';

export default function ChatPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedHarnessId, setSelectedHarnessId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { agents, loading: agentsLoading } = useAgents();
  const { messages, loading: messagesLoading, sendMessage, clearMessages } =
    useMessages(selectedAgentId);

  const router = useRouter();
  const supabase = createClient();

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    setSelectedHarnessId(null);
    setSidebarOpen(false);
  };

  const handleSend = async (content: string) => {
    return sendMessage(content, selectedHarnessId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

      <Separator />
      <div className="p-2">
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
        </header>

        {/* 메시지 목록 */}
        <MessageList messages={messages} loading={messagesLoading} />

        {/* 메시지 입력 */}
        <MessageInput onSend={handleSend} disabled={!selectedAgentId} />
      </main>
    </div>
  );
}
