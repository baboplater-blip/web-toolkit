'use client';

import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, MessageSquare, RefreshCw, Copy, Check, Pin, PinOff, Quote, Pencil, GitBranch, Square, X, ThumbsUp, ThumbsDown, Lightbulb, Link as LinkIcon, ClockAlert } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from './MarkdownRenderer';
import { haptic } from '@/lib/haptics';
import { summarizePreview } from '@/lib/summarize-preview';
import type { Message, MessageReaction } from '@/lib/supabase/types';

/** 글자 수 기준 접기/펼치기 임계값 */
const COLLAPSE_THRESHOLD = 500;
const COLLAPSED_LENGTH = 300;
/** 이 이상이면 본문 대신 요약 미리보기 + "전체 보기" 만 노출. */
const PREVIEW_ONLY_THRESHOLD = 2000;

/**
 * streaming 상태 뱃지 — 경과시간 1초마다 tick, updated_at 이 30초 넘게 정지하면
 * "응답 대기" 로 경고 전환 (keepalive 를 지원하는 1.2.0+ 에이전트 대상).
 * 60초 넘게 정지하면 옆에 "중단" 버튼을 노출해 사용자가 수동 종료할 수 있게 한다.
 */
function StreamingBadge({
  startedAt,
  updatedAt,
  onForceStop,
}: {
  startedAt: string;
  updatedAt: string;
  onForceStop?: () => void;
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsedSec = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const staleSec = Math.max(0, Math.floor((now - new Date(updatedAt).getTime()) / 1000));
  const isStale = staleSec > 30;
  const allowForceStop = onForceStop && staleSec > 60;
  return (
    <span className="inline-flex items-center gap-1">
      <Badge
        variant="secondary"
        className={cn(
          'text-[10px] px-1.5 py-0 h-4',
          isStale && 'bg-amber-500/20 text-amber-400',
        )}
      >
        <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
        {isStale ? `${staleSec}초째 응답 대기` : `${elapsedSec}초째 실행 중`}
      </Badge>
      {allowForceStop && (
        <button
          type="button"
          onClick={onForceStop}
          className="text-[10px] px-1.5 py-0 h-4 rounded border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 inline-flex items-center gap-0.5"
          title="중단 표시로 전환 (에이전트 응답이 더 이상 기대되지 않을 때)"
        >
          <Square className="h-2.5 w-2.5" />
          중단
        </button>
      )}
    </span>
  );
}

interface MessageBubbleProps {
  message: Message;
  /** error/cancelled 상태의 assistant 메시지에서 재시도 시 호출 */
  onRetry?: (content: string, opts?: { timeoutExtended?: boolean }) => void;
  /** 재시도 시 사용할 직전 user 메시지 content */
  retryContent?: string;
  /** true 일 때 짧은 시간 링 하이라이트 — 로그에서 이 메시지로 점프한 경우 */
  highlighted?: boolean;
  /** 메시지 핀 토글 — 정의되면 본문 옆에 핀 버튼 노출 */
  onTogglePin?: (messageId: string) => void;
  /** 메시지를 인용해 입력창에 프리필 — 정의되면 헤더에 Quote 버튼 노출 */
  onQuote?: (text: string) => void;
  /** user 메시지 편집 → 포크 후 새 내용 재전송 */
  onEdit?: (messageId: string, newContent: string) => void;
  /** 임의 메시지에서 "여기서 분기" — 해당 지점까지 포크만 하고 입력은 사용자가 */
  onBranch?: (messageId: string) => void;
  /** streaming 이 오래 정지된 메시지를 수동으로 cancelled 로 종결 */
  onForceStop?: (messageId: string) => void;
  /** assistant 메시지 반응(이모지) 토글 */
  onSetReaction?: (messageId: string, reaction: MessageReaction | null) => void;
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

function MessageBubbleImpl({
  message,
  onRetry,
  retryContent,
  highlighted,
  onTogglePin,
  onQuote,
  onEdit,
  onBranch,
  onForceStop,
  onSetReaction,
}: MessageBubbleProps) {
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
  const isPreviewOnly = !isUser && message.content.length > PREVIEW_ONLY_THRESHOLD;
  const [contentExpanded, setContentExpanded] = useState(false);
  const previewText = isPreviewOnly ? summarizePreview(message.content) : null;

  // 복사 버튼 상태
  const [copied, setCopied] = useState(false);
  const canCopy = !isUser && message.content.length > 0 && !isStreaming;

  // 편집 상태
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');

  // 편집 중 페이지 닫기/새로고침 시 경고 — 저장 안 된 변경 보호.
  useEffect(() => {
    if (!editing) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (editDraft.trim() && editDraft.trim() !== message.content) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editing, editDraft, message.content]);
  const canEdit = isUser && !!onEdit && !message.content.startsWith('[CTX]');
  const canBranch = !!onBranch && !isStreaming;

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
    if (isPreviewOnly && !contentExpanded) {
      // 요약만 텍스트로. Markdown 렌더 대신 plain 텍스트 반환은 호출부에서 처리.
      return '';
    }
    if (isLongContent && !contentExpanded) {
      return message.content.slice(0, COLLAPSED_LENGTH);
    }
    return message.content;
  })();

  return (
    <div
      data-message-id={message.id}
      className={cn(
        'group flex relative transition-[box-shadow,background-color] duration-500',
        {
          'justify-end': isUser,
          'justify-start': !isUser,
        },
        highlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg',
      )}
    >
      {onTogglePin && !isStreaming && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(message.id);
          }}
          className={cn(
            'absolute top-1 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-background border shadow-sm transition-opacity',
            isUser ? 'left-1' : 'right-1',
            message.pinned
              ? 'opacity-100 text-amber-500 border-amber-500/40'
              : 'opacity-0 group-hover:opacity-70 hover:opacity-100 text-muted-foreground',
          )}
          title={message.pinned ? '핀 해제' : '핀 — 대화 상단에 고정'}
          aria-label={message.pinned ? '핀 해제' : '핀'}
        >
          {message.pinned ? (
            <Pin className="h-3 w-3 fill-current" />
          ) : (
            <PinOff className="h-3 w-3" />
          )}
        </button>
      )}
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
            {onQuote && canCopy && (
              <button
                type="button"
                onClick={() => onQuote(message.content)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="인용해 답장"
                aria-label="인용해 답장"
              >
                <Quote className="h-3 w-3" />
              </button>
            )}
            {canCopy && (
              <button
                type="button"
                onClick={async () => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('agent', message.agent_id);
                  url.searchParams.set('conversation', message.conversation_id);
                  url.searchParams.set('message', message.id);
                  const link = url.toString();
                  try {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {}
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="이 메시지로 바로 이동하는 링크 복사"
                aria-label="메시지 링크 복사"
              >
                <LinkIcon className="h-3 w-3" />
              </button>
            )}
            {isStreaming && (
              <StreamingBadge
                startedAt={message.created_at}
                updatedAt={message.updated_at}
                onForceStop={onForceStop ? () => onForceStop(message.id) : undefined}
              />
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
          {isUser && editing ? (
            <div className="space-y-1.5">
              <Textarea
                autoFocus
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="min-h-[80px] text-sm bg-background text-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditing(false);
                    setEditDraft('');
                  }
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (editDraft.trim() && onEdit) {
                      onEdit(message.id, editDraft.trim());
                      setEditing(false);
                      setEditDraft('');
                    }
                  }
                }}
              />
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditDraft('');
                  }}
                  className="h-7 px-2 text-[11px] rounded hover:bg-background/30 inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  취소
                </button>
                <button
                  type="button"
                  disabled={!editDraft.trim() || editDraft.trim() === message.content}
                  onClick={() => {
                    if (!onEdit) return;
                    onEdit(message.id, editDraft.trim());
                    setEditing(false);
                    setEditDraft('');
                  }}
                  className="h-7 px-2 text-[11px] rounded bg-background text-foreground hover:bg-background/90 disabled:opacity-50 inline-flex items-center gap-1"
                  title="새 대화로 분기하며 수정된 내용으로 다시 보냄 (Ctrl/⌘+Enter)"
                >
                  <GitBranch className="h-3 w-3" />
                  분기하며 저장
                </button>
              </div>
            </div>
          ) : isUser ? (
            <span className="whitespace-pre-wrap">{displayContent}</span>
          ) : isPreviewOnly && !contentExpanded ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground italic">
              <span className="text-[11px] uppercase tracking-wider font-semibold shrink-0 not-italic text-zinc-500">
                요약
              </span>
              <span className="min-w-0">{previewText}</span>
            </div>
          ) : (
            <>
              <MarkdownRenderer content={displayContent} />
              {isLongContent && !contentExpanded && !isPreviewOnly && (
                <span className="text-muted-foreground">...</span>
              )}
            </>
          )}
        </div>

        {/* 반응(이모지) — assistant 완료/에러 완료된 메시지에만 */}
        {isAssistant && !isStreaming && onSetReaction && (
          <div className="mt-1.5 flex items-center gap-0.5">
            {(['up', 'down', 'curious'] as const).map((r) => {
              const Icon = r === 'up' ? ThumbsUp : r === 'down' ? ThumbsDown : Lightbulb;
              const active = message.reaction === r;
              const color =
                r === 'up'
                  ? 'text-emerald-400'
                  : r === 'down'
                  ? 'text-rose-400'
                  : 'text-amber-400';
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    haptic('tap');
                    onSetReaction(message.id, active ? null : r);
                  }}
                  className={cn(
                    'h-6 w-6 flex items-center justify-center rounded transition-opacity',
                    active ? `opacity-100 ${color}` : 'opacity-50 hover:opacity-100 text-muted-foreground',
                  )}
                  title={r === 'up' ? '좋음' : r === 'down' ? '나쁨' : '흥미로움'}
                  aria-label={r === 'up' ? '좋음' : r === 'down' ? '나쁨' : '흥미로움'}
                  aria-pressed={active}
                >
                  <Icon className={cn('h-3.5 w-3.5', active && 'fill-current')} />
                </button>
              );
            })}
          </div>
        )}

        {/* Feature 3: 더 보기/접기 버튼 */}
        {isLongContent && (
          <button
            onClick={() => setContentExpanded((prev) => !prev)}
            className="mt-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {contentExpanded
              ? '접기'
              : isPreviewOnly
              ? `전체 보기 (${message.content.length.toLocaleString()}자)`
              : `더 보기 (총 ${message.content.length.toLocaleString()}자)`}
          </button>
        )}

        {isError && message.error_message && (
          <div className="mt-1.5 text-xs text-destructive flex items-start gap-1.5">
            <p className="flex-1 break-words">{message.error_message}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message.error_message ?? '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {}
              }}
              className="shrink-0 opacity-70 hover:opacity-100"
              title="오류 메시지 복사"
              aria-label="오류 메시지 복사"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}

        {/* Feature 5: 재시도 버튼 — 타임아웃 에러면 "연장 재시도" 도 같이 노출 */}
        {canRetry && (() => {
          const isTimeoutError =
            isError &&
            !!message.error_message &&
            /타임아웃|timeout|time[- ]?out/i.test(message.error_message);
          return (
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => onRetry(retryContent)}
              >
                <RefreshCw className="h-3 w-3" />
                재시도
              </Button>
              {isTimeoutError && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2 gap-1 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
                  onClick={() => onRetry(retryContent, { timeoutExtended: true })}
                  title="타임아웃을 ×2 로 늘려서 재시도"
                >
                  <ClockAlert className="h-3 w-3" />
                  연장해서 재시도
                </Button>
              )}
            </div>
          );
        })()}

        {/* 편집 · 분기 — 버블 하단 액션 바. hover 에서만 보여 공간 낭비 방지. */}
        {!editing && (canEdit || canBranch) && !isStreaming && (
          <div className="mt-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditDraft(message.content);
                  setEditing(true);
                }}
                className={cn(
                  'h-6 text-[11px] px-2 rounded inline-flex items-center gap-1',
                  isUser
                    ? 'text-primary-foreground/80 hover:bg-primary-foreground/10'
                    : 'text-muted-foreground hover:bg-accent',
                )}
                title="편집 후 새 대화로 분기"
              >
                <Pencil className="h-3 w-3" />
                편집
              </button>
            )}
            {canBranch && (
              <button
                type="button"
                onClick={() => onBranch?.(message.id)}
                className={cn(
                  'h-6 text-[11px] px-2 rounded inline-flex items-center gap-1',
                  isUser
                    ? 'text-primary-foreground/80 hover:bg-primary-foreground/10'
                    : 'text-muted-foreground hover:bg-accent',
                )}
                title="이 지점에서 다른 방향으로 분기 (새 대화)"
              >
                <GitBranch className="h-3 w-3" />
                분기
              </button>
            )}
          </div>
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

/**
 * React.memo 비교자 — 대부분의 경우 message 객체 참조가 같으면 동일.
 * Realtime UPDATE 로 새 Message 객체가 만들어질 때만 재렌더. prop 함수는 부모에서
 * 안정화된 useCallback 을 쓰므로 참조 일치.
 */
export const MessageBubble = memo(MessageBubbleImpl, (prev, next) => {
  if (prev.message !== next.message) return false;
  if (prev.highlighted !== next.highlighted) return false;
  if (prev.retryContent !== next.retryContent) return false;
  if (prev.onRetry !== next.onRetry) return false;
  if (prev.onTogglePin !== next.onTogglePin) return false;
  if (prev.onQuote !== next.onQuote) return false;
  if (prev.onEdit !== next.onEdit) return false;
  if (prev.onBranch !== next.onBranch) return false;
  if (prev.onForceStop !== next.onForceStop) return false;
  if (prev.onSetReaction !== next.onSetReaction) return false;
  return true;
});
