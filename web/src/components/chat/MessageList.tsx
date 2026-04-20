'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/button';
import type { Message } from '@/lib/supabase/types';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onRetry?: (content: string, opts?: { timeoutExtended?: boolean }) => void;
  /** 더 오래된 메시지가 남아있는가. true 일 때 상단에 "더 불러오기" 표시. */
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  /** URL 로 지목된 메시지 — 존재 시 해당 메시지로 스크롤 + 2.5초간 링 하이라이트 */
  targetMessageId?: string | null;
  onTogglePin?: (messageId: string) => void;
  onQuote?: (text: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onBranch?: (messageId: string) => void;
  onForceStop?: (messageId: string) => void;
  onSetReaction?: (messageId: string, reaction: 'up' | 'down' | 'curious' | null) => void;
}

export function MessageList({
  messages,
  loading,
  onRetry,
  hasMore,
  loadingOlder,
  onLoadOlder,
  targetMessageId,
  onTogglePin,
  onQuote,
  onEdit,
  onBranch,
  onForceStop,
  onSetReaction,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevFirstIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const scrolledTargetRef = useRef<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  // targetMessageId 로 스크롤 + 플래시. 같은 id 로는 한 번만 반응.
  useEffect(() => {
    if (!targetMessageId) return;
    if (scrolledTargetRef.current === targetMessageId) return;
    if (!messages.some((m) => m.id === targetMessageId)) return;

    const el = scrollRef.current?.querySelector(
      `[data-message-id="${targetMessageId}"]`,
    ) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(targetMessageId);
    scrolledTargetRef.current = targetMessageId;
    const t = setTimeout(() => setFlashId(null), 2500);
    return () => clearTimeout(t);
  }, [targetMessageId, messages]);

  // 초기 렌더 & 새 메시지 수신 시 — 하단 근처일 때만 자동 스크롤, 위에 있으면 "새 메시지" 알림.
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length === 0) {
      prevMessageCountRef.current = 0;
      setUnreadCount(0);
      return;
    }
    const first = messages[0];
    if (prevFirstIdRef.current && prevFirstIdRef.current !== first.id) {
      return;
    }
    const added = Math.max(0, messages.length - prevMessageCountRef.current);
    prevMessageCountRef.current = messages.length;
    const root =
      (scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null) ??
      scrollRef.current?.parentElement;
    const nearBottom = !root
      ? true
      : root.scrollHeight - root.scrollTop - root.clientHeight < 120;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    } else if (added > 0) {
      setUnreadCount((prev) => prev + added);
    }
  }, [messages]);

  // 과거 메시지 프리펜드 후 스크롤 위치 보정 (visible 영역 유지).
  useLayoutEffect(() => {
    if (messages.length === 0) {
      prevFirstIdRef.current = null;
      prevScrollHeightRef.current = 0;
      return;
    }
    const first = messages[0];
    const root = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null
      ?? scrollRef.current?.parentElement;
    if (!root) {
      prevFirstIdRef.current = first.id;
      return;
    }

    if (prevFirstIdRef.current && prevFirstIdRef.current !== first.id && prevScrollHeightRef.current > 0) {
      const delta = root.scrollHeight - prevScrollHeightRef.current;
      if (delta > 0) {
        // 과거 메시지 프리펜드 시 뷰포트 위치 보정 — DOM API 호출이라 ref 규칙에서 제외.
        // eslint-disable-next-line react-hooks/immutability
        root.scrollTop += delta;
      }
    }
    prevFirstIdRef.current = first.id;
    prevScrollHeightRef.current = root.scrollHeight;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    const examples = [
      '현재 브랜치 상태 확인하고 요약',
      '최근 변경사항에 테스트 추가해줘',
      '이 폴더의 README 초안을 써줘',
      'TODO 주석이 있는 파일을 찾아 목록화',
    ];
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xl">💬</span>
          </div>
          <div>
            <p className="text-sm font-medium">새 대화를 시작해보세요</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              아래 입력창에 명령을 입력하거나, 예시를 눌러 시작해도 됩니다.
            </p>
          </div>
          <div className="space-y-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  // 입력창에 prefill — 전송은 하지 않음. MessageInput 은 prop value 로 제어.
                  // 이 컴포넌트는 prefill 경로가 없으므로 window 이벤트로 던진다.
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('acp:prefill-input', { detail: ex }),
                    );
                  }
                }}
                className="block w-full rounded-md border bg-background px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 relative">
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUnreadCount(0);
          }}
          className="sticky bottom-3 z-10 mx-auto flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-[11px] font-medium text-primary shadow-sm hover:bg-primary/25 transition-colors"
          style={{ width: 'fit-content' }}
          aria-label={`${unreadCount}개 새 메시지로 이동`}
        >
          <span>↓ 새 메시지 {unreadCount}개</span>
        </button>
      )}
      <div ref={scrollRef} className="py-4 space-y-3">
        {hasMore && (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadOlder}
              disabled={loadingOlder}
              className="h-7 text-xs"
            >
              {loadingOlder ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              이전 메시지 더 불러오기
            </Button>
          </div>
        )}
        {messages.map((message, index) => {
          // error/cancelled assistant 메시지의 경우 직전 user 메시지 content 를 찾아 전달.
          let retryContent: string | undefined;
          if (
            message.role === 'assistant' &&
            (message.status === 'error' || message.status === 'cancelled') &&
            onRetry
          ) {
            for (let i = index - 1; i >= 0; i--) {
              if (messages[i].role === 'user') {
                retryContent = messages[i].content;
                break;
              }
            }
          }
          return (
            <MessageBubble
              key={message.id}
              message={message}
              onRetry={onRetry}
              retryContent={retryContent}
              highlighted={message.id === flashId}
              onTogglePin={onTogglePin}
              onQuote={onQuote}
              onEdit={onEdit}
              onBranch={onBranch}
              onForceStop={onForceStop}
              onSetReaction={onSetReaction}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
