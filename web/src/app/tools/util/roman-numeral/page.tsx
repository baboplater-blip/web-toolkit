'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import {
  arabicToRoman,
  romanToArabic,
  detectDirection,
  type ConversionResult,
} from '@/lib/tools/roman-numeral';

export default function RomanNumeralPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<ConversionResult | null>(() => {
    if (!input.trim()) return null;
    const direction = detectDirection(input);
    return direction === 'toRoman' ? arabicToRoman(input) : romanToArabic(input);
  }, [input]);

  const direction = input.trim() ? detectDirection(input) : 'toRoman';

  async function copy() {
    if (!result?.ok) return;
    try {
      await navigator.clipboard.writeText(result.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="로마숫자 변환"
        widthClass="max-w-xl"
        onReset={input ? () => setInput('') : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          아라비아 숫자와 로마숫자(I·V·X·L·C·D·M)를 서로 변환합니다. (1~3999)
        </p>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">입력 (숫자 또는 로마숫자)</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 2024 또는 MMXXIV"
            aria-label="변환할 값"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
          {direction === 'toRoman' ? '아라비아 → 로마숫자' : '로마숫자 → 아라비아'} (자동 감지)
        </p>
      </div>

      {result && !result.ok && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {result.error}
        </p>
      )}

      {result?.ok && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">결과</p>
            <p className="truncate text-2xl font-bold tabular-nums tracking-wide">
              {result.value}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="ml-1">
              {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
            </span>
          </Button>
        </div>
      )}
      </main>
    </div>
  );
}
