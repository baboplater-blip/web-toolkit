'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, FileText, Pencil, Loader2, Wand2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import type { Conversation, Message } from '@/lib/supabase/types';

interface SummaryCardProps {
  conversation: Conversation;
  messages: Message[];
  /** 대화 요약 저장/삭제 */
  onSave: (summary: string | null) => Promise<boolean>;
  /** 요약 생성을 위한 "요약 프롬프트" user 메시지 전송 */
  onSend: (content: string) => Promise<boolean | undefined>;
}

/** 최근 N 개 메시지를 요약 프롬프트용으로 마크다운 직렬화. 길이 상한 적용. */
function serializeMessagesForSummary(messages: Message[], limit = 30): string {
  const recent = messages.slice(-limit);
  const lines: string[] = [];
  for (const m of recent) {
    if (m.status === 'streaming' || m.status === 'error' || m.status === 'cancelled') continue;
    const role =
      m.role === 'user' ? '사용자' : m.role === 'assistant' ? 'Claude' : '시스템';
    const body = m.content.length > 600 ? m.content.slice(0, 600) + '…' : m.content;
    lines.push(`**${role}:** ${body}`);
  }
  const joined = lines.join('\n\n');
  return joined.length > 8000 ? joined.slice(-8000) : joined;
}

function formatAge(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

/**
 * 대화 상단 요약 카드.
 * - 요약이 있으면 접힘/펼침, 편집, 재생성 가능
 * - 요약이 없고 대화가 길면(>=20) "자동 생성" 버튼 노출
 * - 자동 생성: 요약용 user 메시지 전송 → 응답 감지 → summary 저장 + 메시지 쌍 삭제
 */
export function SummaryCard({ conversation, messages, onSave, onSend }: SummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  /** 생성 요청 후 감시할 user 메시지 id (이 뒤에 오는 첫 assistant 가 요약 결과) */
  const watchUserIdRef = useRef<string | null>(null);

  // 감시 중이면 messages 에서 해당 user 뒤의 completed assistant 찾아 요약 저장.
  useEffect(() => {
    if (!generating) return;
    // 120초 안에 응답이 오지 않으면 타임아웃으로 종료.
    const timeoutHandle = setTimeout(() => {
      if (watchUserIdRef.current) {
        toast('요약 생성이 너무 오래 걸려 중단했습니다', { variant: 'warning' });
        watchUserIdRef.current = null;
        setGenerating(false);
      }
    }, 120_000);
    return () => clearTimeout(timeoutHandle);
  }, [generating]);

  useEffect(() => {
    const watchId = watchUserIdRef.current;
    if (!watchId || !generating) return;
    const userIdx = messages.findIndex((m) => m.id === watchId);
    if (userIdx < 0) return;
    for (let i = userIdx + 1; i < messages.length; i++) {
      const m = messages[i];
      if (m.role !== 'assistant') continue;
      if (m.status === 'completed') {
        // 요약 수령 — 저장 후 메시지 쌍 삭제.
        const summary = m.content.trim();
        (async () => {
          const ok = await onSave(summary);
          if (ok) {
            const supabase = createClient();
            await supabase.from('messages').delete().in('id', [watchId, m.id]);
            toast('대화 요약이 생성되었습니다', { variant: 'success' });
          }
          watchUserIdRef.current = null;
          setGenerating(false);
        })();
        return;
      }
      if (m.status === 'error' || m.status === 'cancelled') {
        toast('요약 생성 실패', { variant: 'error' });
        watchUserIdRef.current = null;
        // async 로 밀어 effect body 에서 직접 setState 를 호출하지 않는다.
        Promise.resolve().then(() => setGenerating(false));
        return;
      }
    }
  }, [messages, generating, onSave]);

  const hasSummary = Boolean(conversation.summary && conversation.summary.trim());
  const isLong = messages.length >= 20;

  // 둘 다 없으면 카드 자체를 렌더하지 않는다.
  if (!hasSummary && !isLong) return null;

  const handleGenerate = async () => {
    if (generating) return;
    const serialized = serializeMessagesForSummary(messages);
    if (!serialized) {
      toast('요약할 메시지가 없습니다', { variant: 'warning' });
      return;
    }
    const prompt =
      '다음 대화를 한국어로 3~5개 불릿 포인트로 요약해주세요. 핵심 결정·진행 상태·미해결 사항 위주로 간결하게:\n\n' +
      serialized;
    setGenerating(true);
    // sendMessage 직후엔 해당 user 메시지 id 를 모른다. 전송 전 타임스탬프로 이후 들어온 user 메시지를 찾아낸다.
    const before = messages.length;
    const ok = await onSend(prompt);
    if (!ok) {
      setGenerating(false);
      return;
    }
    // 다음 tick 에 messages 가 업데이트되면 before 이후의 user 메시지가 감시 대상.
    // 최대 5초간 관찰 (INSERT 지연 대비).
    const started = Date.now();
    const interval = setInterval(() => {
      const maybeNewUser = messages.slice(before).find((m) => m.role === 'user');
      if (maybeNewUser) {
        watchUserIdRef.current = maybeNewUser.id;
        clearInterval(interval);
        return;
      }
      if (Date.now() - started > 5000) {
        clearInterval(interval);
      }
    }, 200);
  };

  const startEdit = () => {
    setDraft(conversation.summary ?? '');
    setEditing(true);
    setExpanded(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft('');
  };

  const saveEdit = async () => {
    const ok = await onSave(draft);
    if (ok) {
      setEditing(false);
      setDraft('');
      toast('요약이 저장되었습니다', { variant: 'success' });
    }
  };

  return (
    <div className="border-b bg-muted/30">
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center gap-1 text-left min-w-0"
            disabled={!hasSummary}
          >
            {hasSummary ? (
              expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              대화 요약
            </span>
            {hasSummary && conversation.summary_updated_at && (
              <span className="text-[10px] text-muted-foreground ml-1">
                · {formatAge(conversation.summary_updated_at)}
              </span>
            )}
            {!hasSummary && isLong && (
              <span className="text-[10px] text-muted-foreground ml-1">
                · 메시지 {messages.length}건 — 요약이 있으면 한눈에 파악하기 쉬워집니다
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {hasSummary && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
                title="편집"
                aria-label="요약 편집"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {!editing && (
              <Button
                size="sm"
                variant={hasSummary ? 'ghost' : 'outline'}
                className="h-6 text-[10px] px-2"
                onClick={handleGenerate}
                disabled={generating}
                title="최근 대화로 요약 자동 생성"
              >
                {generating ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-2.5 w-2.5 mr-1" />
                )}
                {hasSummary ? '재생성' : '자동 생성'}
              </Button>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-2 space-y-1.5">
            <Textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="이 대화의 핵심을 요약해 적어두세요 (마크다운 가능, 4000자 이내)"
              className="min-h-[100px] text-xs"
            />
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEdit}>
                <X className="h-3 w-3 mr-1" />
                취소
              </Button>
              {draft.trim() && draft.trim() !== (conversation.summary ?? '') && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={saveEdit}
                >
                  <Save className="h-3 w-3 mr-1" />
                  저장
                </Button>
              )}
              {!draft.trim() && conversation.summary && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={saveEdit}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
        )}

        {!editing && hasSummary && expanded && (
          <div className={cn('mt-2 text-xs leading-relaxed')}>
            <MarkdownRenderer content={conversation.summary ?? ''} />
          </div>
        )}
        {!editing && hasSummary && !expanded && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 pl-5">
            {conversation.summary}
          </p>
        )}
      </div>
    </div>
  );
}
