'use client';

import { useState, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean | undefined>;
  disabled?: boolean;
  continueMode: boolean;
  onToggleContinue: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  continueMode,
  onToggleContinue,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    if (!value.trim() || sending || disabled) return;

    setSending(true);
    const success = await onSend(value);
    if (success) {
      setValue('');
      textareaRef.current?.focus();
    }
    setSending(false);
  }, [value, sending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        <Button
          variant={continueMode ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onToggleContinue}
          disabled={disabled}
          className={cn(
            'shrink-0 h-[44px] w-[44px] transition-colors',
            continueMode && 'ring-2 ring-primary/30'
          )}
          title={continueMode ? '컨텍스트 유지 ON' : '컨텍스트 유지 OFF'}
        >
          <MessageSquare className={cn('h-4 w-4', continueMode && 'text-primary')} />
        </Button>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'PC를 선택하세요...'
              : continueMode
                ? '컨텍스트 유지 중... (Enter로 전송)'
                : '명령을 입력하세요... (Enter로 전송)'
          }
          disabled={disabled || sending}
          className="min-h-[44px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() || sending || disabled}
          className="shrink-0 h-[44px] w-[44px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
