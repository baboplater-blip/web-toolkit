'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Clock, ClockAlert } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { toast } from '@/components/ui/toast';

/** 프롬프트 히스토리 저장소 — 간단한 localStorage 링버퍼. */
const HISTORY_KEY = 'acp:prompt-history';
const HISTORY_LIMIT = 50;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function pushHistory(entry: string) {
  const trimmed = entry.trim();
  if (!trimmed || trimmed.length > 4000) return;
  try {
    const list = loadHistory().filter((v) => v !== trimmed);
    list.push(trimmed);
    const next = list.length > HISTORY_LIMIT ? list.slice(-HISTORY_LIMIT) : list;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}

interface SendOptions {
  timeoutExtended?: boolean;
}

interface MessageInputProps {
  onSend: (
    content: string,
    opts?: SendOptions,
  ) => Promise<boolean | undefined>;
  disabled?: boolean;
  /** 외부 제어 모드: 입력 값 */
  value?: string;
  /** 외부 제어 모드: 값 변경 콜백 */
  onValueChange?: (value: string) => void;
  /** placeholder 커스터마이즈 */
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled,
  value: controlledValue,
  onValueChange,
  placeholder,
}: MessageInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [sending, setSending] = useState(false);
  // 긴 작업 토글 — 마지막 선택을 localStorage 에 기억. SSR 안전을 위해 lazy initializer.
  const [longTask, setLongTask] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('acp:long-task-default') === '1';
    } catch {
      return false;
    }
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('acp:long-task-default', longTask ? '1' : '0');
    } catch {}
  }, [longTask]);

  /**
   * 프롬프트 히스토리 커서.
   * null = 드래프트(직접 타이핑 중), 0 = 최신 히스토리, 1 = 그 이전, ...
   * Ctrl/⌘+↑ 로 거슬러 올라가고, ↓ 로 돌아온다.
   */
  const historyCursorRef = useRef<number | null>(null);
  /** 히스토리 모드 진입 시점의 드래프트 — 최신 이후 한 번 더 ↓ 누르면 복귀. */
  const savedDraftRef = useRef<string>('');

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = useMemo(
    () =>
      isControlled
        ? (v: string) => onValueChange?.(v)
        : setInternalValue,
    [isControlled, onValueChange],
  );

  const handleSend = useCallback(async () => {
    if (!value.trim() || sending || disabled) return;

    setSending(true);
    haptic('tap');
    const success = await onSend(value, { timeoutExtended: longTask });
    if (success) {
      pushHistory(value);
      historyCursorRef.current = null;
      savedDraftRef.current = '';
      setValue('');
      textareaRef.current?.focus();
    }
    setSending(false);
  }, [value, sending, disabled, onSend, setValue, longTask]);

  /**
   * Ctrl/⌘+↑↓ 로 프롬프트 히스토리 순환.
   * - 텍스트 영역 안에서만 동작 (전역 훅 대신 여기에 두는 편이 의도가 명확).
   * - 커서 위치·선택 상관없이 mod 키가 눌려 있으면 히스토리 이동.
   */
  const navigateHistory = (dir: 'up' | 'down') => {
    const hist = loadHistory();
    if (hist.length === 0) return;
    const cursor = historyCursorRef.current;

    if (dir === 'up') {
      if (cursor === null) {
        // 드래프트 모드에서 처음 ↑ 누름 — 드래프트 보존 후 최신 히스토리로.
        savedDraftRef.current = value;
        historyCursorRef.current = 0;
        setValue(hist[hist.length - 1]);
        return;
      }
      const next = Math.min(cursor + 1, hist.length - 1);
      historyCursorRef.current = next;
      setValue(hist[hist.length - 1 - next]);
    } else {
      if (cursor === null) return; // 드래프트일 때 ↓ 는 무시.
      if (cursor === 0) {
        historyCursorRef.current = null;
        setValue(savedDraftRef.current);
        savedDraftRef.current = '';
        return;
      }
      const next = cursor - 1;
      historyCursorRef.current = next;
      setValue(hist[hist.length - 1 - next]);
    }
  };

  // 텍스트에이리어 내용 기반 자동 높이 — 여러 줄 입력도 한눈에 보이게.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    // reset to measure
    el.style.height = 'auto';
    const next = Math.min(Math.max(44, el.scrollHeight), 280);
    el.style.height = `${next}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
      return;
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
      return;
    }
    // 사용자가 히스토리 모드 중 직접 타이핑하면 커서 해제 (다음 ↑↓ 는 새 드래프트 기준).
    if (historyCursorRef.current !== null && e.key.length === 1 && !mod) {
      historyCursorRef.current = null;
      savedDraftRef.current = '';
    }
  };

  return (
    <div className="bg-background p-3">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            const pasted = e.clipboardData?.getData('text') ?? '';
            // 매우 큰 붙여넣기 감지 — 에이전트 20k 자 상한 근처.
            if (pasted.length > 10_000) {
              toast(
                `${pasted.length.toLocaleString('ko-KR')}자 붙여넣기 — 10,000 자를 넘습니다. 파일 전달·요약 후 첨부를 고려하세요.`,
                { variant: 'warning', duration: 6000 },
              );
            }
          }}
          placeholder={
            disabled
              ? 'PC를 선택하세요...'
              : (placeholder ?? '명령을 입력하세요... (Enter 전송 · Shift+Enter 줄바꿈 · Ctrl/⌘+↑↓ 이력)')
          }
          disabled={disabled || sending}
          className="min-h-[44px] max-h-[280px] resize-none text-sm leading-relaxed"
          rows={1}
        />
        <button
          type="button"
          onClick={() => setLongTask((v) => !v)}
          disabled={disabled}
          title={longTask ? '긴 작업 모드: 타임아웃 ×2' : '긴 작업 모드 (타임아웃 ×2) 활성화'}
          aria-pressed={longTask}
          aria-label="긴 작업 모드 토글"
          className={
            'shrink-0 h-[44px] w-[44px] rounded-md border flex items-center justify-center transition ' +
            (longTask
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              : 'border-border text-muted-foreground hover:bg-muted')
          }
        >
          {longTask ? (
            <ClockAlert className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </button>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() || sending || disabled}
          className="shrink-0 h-[44px] w-[44px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {longTask && (
        <div className="max-w-3xl mx-auto mt-1 text-right">
          <span className="text-[10px] text-amber-300">
            ⏱ 긴 작업 모드: 이 메시지에 타임아웃 ×2 부여
          </span>
        </div>
      )}
      {value.length >= 1000 && (
        <div className="max-w-3xl mx-auto mt-1 text-right">
          <span
            className={
              value.length >= 15000
                ? 'text-[10px] text-rose-400'
                : value.length >= 8000
                ? 'text-[10px] text-amber-400'
                : 'text-[10px] text-muted-foreground'
            }
          >
            {value.length.toLocaleString('ko-KR')}자
            {value.length >= 15000 && ' · 에이전트 측 상한 20,000자에 근접'}
          </span>
        </div>
      )}
    </div>
  );
}
