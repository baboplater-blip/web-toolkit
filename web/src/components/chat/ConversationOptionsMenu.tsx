'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { exportConversation, copyConversationToClipboard } from '@/lib/export-conversation';
import {
  MoreHorizontal,
  Timer,
  Share2,
  X,
  GitFork,
  Download,
  Trash2,
} from 'lucide-react';
import type { Conversation, Message } from '@/lib/supabase/types';

interface ConversationOptionsMenuProps {
  conversationId: string;
  conversations: Conversation[];
  messages: Message[];
  isRunning: boolean;
  onCreateShareLink: () => void;
  onRevokeShareLinks: () => void;
  onFork: (
    conversationId: string,
  ) => Promise<{ id: string; title: string } | null | undefined>;
  onSelectConversation: (id: string) => void;
  onClearMessages: () => Promise<void> | void;
}

/**
 * 채팅 헤더 우상단의 대화 옵션 드롭다운 메뉴.
 *
 * page.tsx 에서 분리 — 독립적인 "순수 UI + 콜백" 컴포넌트.
 * 호출부가 가지고 있어야 하는 건 대화 ID·대화 목록·메시지 목록·isRunning 정도.
 */
export function ConversationOptionsMenu({
  conversationId,
  conversations,
  messages,
  isRunning,
  onCreateShareLink,
  onRevokeShareLinks,
  onFork,
  onSelectConversation,
  onClearMessages,
}: ConversationOptionsMenuProps) {
  const handleSetTimeout = async () => {
    const supabase = createClient();
    const { data: conv } = await supabase
      .from('conversations')
      .select('timeout_override_minutes')
      .eq('id', conversationId)
      .maybeSingle();
    const current =
      (conv as { timeout_override_minutes: number | null } | null)
        ?.timeout_override_minutes ?? null;
    const input = prompt(
      '이 대화의 타임아웃 (분)\n\n비워두면 PC 기본값 사용.\n1~720 분 (최대 12시간).',
      current ? String(current) : '',
    );
    if (input === null) return;
    const raw = input.trim();
    const parsed = raw === '' ? null : parseInt(raw, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 1 || parsed > 720)) {
      toast('1~720 분 사이 숫자로 입력해주세요', { variant: 'warning' });
      return;
    }
    const { error } = await supabase
      .from('conversations')
      .update({ timeout_override_minutes: parsed })
      .eq('id', conversationId);
    if (error) {
      toast(`저장 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    toast(
      parsed === null
        ? '대화 타임아웃 해제 — PC 기본값 사용'
        : `대화 타임아웃 ${parsed}분 설정됨`,
      { variant: 'success' },
    );
  };

  const handleFork = async () => {
    const forked = await onFork(conversationId);
    if (forked) {
      onSelectConversation(forked.id);
      toast(`"${forked.title}" 로 복제했습니다`, {
        variant: 'success',
        duration: 6000,
      });
    }
  };

  const handleCopyMarkdown = async () => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const ok = await copyConversationToClipboard(conv, messages);
    toast(ok ? 'Markdown 을 클립보드에 복사했습니다' : '클립보드 복사 실패', {
      variant: ok ? 'success' : 'error',
    });
  };

  const handleExport = (format: 'markdown' | 'json') => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) exportConversation(conv, messages, format);
  };

  const handleClear = () => {
    if (confirm('이 대화의 메시지를 모두 삭제할까요?')) {
      onClearMessages();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground"
            aria-label="대화 옵션"
            title="대화 옵션"
          />
        }
      >
        <MoreHorizontal className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={handleSetTimeout}>
          <Timer className="h-4 w-4" />
          대화 타임아웃 설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateShareLink}>
          <Share2 className="h-4 w-4" />
          공유 링크 만들기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRevokeShareLinks}>
          <X className="h-4 w-4" />
          공유 링크 모두 해제
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleFork}>
          <GitFork className="h-4 w-4" />
          대화 포크 (복제)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyMarkdown}>
          <Download className="h-4 w-4" />
          Markdown 복사 (클립보드)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          <Download className="h-4 w-4" />
          Markdown 파일로 내보내기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <Download className="h-4 w-4" />
          JSON 으로 내보내기
        </DropdownMenuItem>
        {!isRunning && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
              메시지 삭제
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
