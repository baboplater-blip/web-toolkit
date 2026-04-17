'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, MessageSquare, RefreshCw, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '@/lib/supabase/types';

/** 글자 수 기준 접기/펼치기 임계값 */
const COLLAPSE_THRESHOLD = 500;
const COLLAPSED_LENGTH = 300;

interface MessageBubbleProps {
  message: Message;
  /** error/cancelled 상태의 assistant 메시지에서 재시도 시 호출 */
  onRetry?: (content: string) => void;
  /** 재시도 시 사용할 직전 user 메시지 content */
  retryContent?: string;
}

/** 응답 소요시간을 사람이 읽기 쉬운 형태로 포맷 */
function formatDuration(createdAt: string, updatedAt: string): string | null {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  const diffMs = updated - created;

  // 차이가 없거나 음수이면 표시 안 함
  if (diffMs <= 0) return null;

  const totalSeconds = Math.round(diffMs / 1000);
  if (totalSeconds < 1) return null;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
  }
  return `${seconds}초`;
}

export function MessageBubble({ message, onRetry, retryContent }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const isCancelled = message.status === 'cancelled';
  const isCompleted = message.status === 'completed';
  const isContinue = isUser && message.content.startsWith('[CTX]');

  // Feature 3: 긴 응답 접기/펼치기
  const isLongContent = !isUser && message.content.length > COLLAPSE_THRESHOLD;
  const [contentExpanded, setContentExpanded] = useState(false);

  // 복사 버튼 상태
  const [copied, setCopied] = useState(false);
  const canCopy = !isUser && message.content.length > 0 && !isStreaming;

  // Feature 4: 응답 소요시간
  const duration =
    isAssistant && isCompleted
      ? formatDuration(message.created_at, message.updated_at)
      : null;

  // Feature 5: 재시도 가능 여부
  const canRetry = isAssistant && (isError || isCancelled) && onRetry && retryContent;

  // 표시할 content
  const displayContent = (() => {
    if (isUser) {
      return message.content.startsWith('[CTX]')
        ? message.content.slice(5)
        : message.content;
    }
    if (isLongContent && !contentExpanded) {
      return message.content.slice(0, COLLAPSED_LENGTH);
    }
    return message.content;
  })();

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
            {canCopy && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {}
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="응답 복사"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
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
            {isCancelled && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                취소됨
              </Badge>
            )}
          </div>
        )}

        <div className="break-words">
          {isUser ? (
            <span className="whitespace-pre-wrap">{displayContent}</span>
          ) : (
            <>
              <MarkdownRenderer content={displayContent} />
              {isLongContent && !contentExpanded && (
                <span className="text-muted-foreground">...</span>
              )}
            </>
          )}
        </div>

        {/* Feature 3: 더 보기/접기 버튼 */}
        {isLongContent && (
          <button
            onClick={() => setContentExpanded((prev) => !prev)}
            className="mt-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {contentExpanded
              ? '접기'
              : `더 보기 (총 ${message.content.length.toLocaleString()}자)`}
          </button>
        )}

        {isError && message.error_message && (
          <p className="mt-1.5 text-xs text-destructive">
            {message.error_message}
          </p>
        )}

        {/* Feature 5: 재시도 버튼 */}
        {canRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1.5 h-6 text-xs px-2 gap-1"
            onClick={() => onRetry(retryContent)}
          >
            <RefreshCw className="h-3 w-3" />
            재시도
          </Button>
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
          {/* Feature 4: 소요시간 */}
          {duration && (
            <span className="ml-1 opacity-70">({duration})</span>
          )}
        </div>
      </div>
    </div>
  );
}
