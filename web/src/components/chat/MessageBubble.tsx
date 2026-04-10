'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '@/lib/supabase/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const isContinue = isUser && message.content.startsWith('[CTX]');

  return (
    <div
      className={cn('flex', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm', {
          'bg-primary text-primary-foreground': isUser,
          'bg-muted': !isUser && !isSystem,
          'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20':
            isSystem,
          'bg-destructive/10 border border-destructive/20': isError,
        })}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {isSystem ? '시스템' : 'Claude'}
            </span>
            {isStreaming && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                실행 중
              </Badge>
            )}
            {isError && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                오류
              </Badge>
            )}
          </div>
        )}

        <div className="break-words">
          {isUser ? (
            <span className="whitespace-pre-wrap">
              {message.content.startsWith('[CTX]')
                ? message.content.slice(5)
                : message.content}
            </span>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {isError && message.error_message && (
          <p className="mt-1.5 text-xs text-destructive">
            {message.error_message}
          </p>
        )}

        <div
          className={cn('text-[10px] mt-1 flex items-center gap-1', {
            'text-primary-foreground/60': isUser,
            'text-muted-foreground': !isUser,
          })}
        >
          {isContinue && (
            <span title="컨텍스트 유지">
              <MessageSquare className="h-2.5 w-2.5" />
            </span>
          )}
          {new Date(message.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
