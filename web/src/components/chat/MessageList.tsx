'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/lib/supabase/types';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onRetry?: (content: string) => void;
}

export function MessageList({ messages, loading, onRetry }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        메시지가 없습니다. 명령을 입력하세요.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4 space-y-3">
        {messages.map((message, index) => {
          // Feature 5: error/cancelled assistant 메시지의 경우 직전 user 메시지 content를 찾아 전달
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
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
