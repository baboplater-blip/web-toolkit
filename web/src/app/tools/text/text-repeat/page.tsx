'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type SeparatorKind = 'none' | 'newline' | 'comma' | 'custom';

const SEPARATOR_OPTIONS: ReadonlyArray<{ value: SeparatorKind; label: string }> = [
  { value: 'none', label: '없음' },
  { value: 'newline', label: '줄바꿈' },
  { value: 'comma', label: '쉼표' },
  { value: 'custom', label: '직접 입력' },
];

/** 출력 폭주 방지 가드: 결과 길이 상한(약 5MB)과 반복 횟수 상한. */
const MAX_OUTPUT_CHARS = 5_000_000;
const MAX_COUNT = 100_000;

function resolveSeparator(kind: SeparatorKind, custom: string): string {
  switch (kind) {
    case 'newline':
      return '\n';
    case 'comma':
      return ', ';
    case 'custom':
      return custom;
    case 'none':
    default:
      return '';
  }
}

interface RepeatResult {
  text: string;
  error: string | null;
}

function buildRepeat(input: string, count: number, separator: string): RepeatResult {
  if (!input || count <= 0) return { text: '', error: null };
  if (count > MAX_COUNT) {
    return { text: '', error: `반복 횟수는 최대 ${MAX_COUNT.toLocaleString('ko-KR')}회까지 가능합니다.` };
  }

  // 실제로 이어붙이기 전에 최종 길이를 추정해 메모리 폭주를 미리 차단한다.
  const projectedLength = input.length * count + separator.length * (count - 1);
  if (projectedLength > MAX_OUTPUT_CHARS) {
    return {
      text: '',
      error: `결과가 너무 큽니다(약 ${Math.round(projectedLength / 1_000_000)}MB). 반복 횟수나 입력 길이를 줄여 주세요.`,
    };
  }

  return { text: Array.from({ length: count }, () => input).join(separator), error: null };
}

export default function TextRepeatPage() {
  const [input, setInput] = useState('');
  const [count, setCount] = useState(3);
  const [sepKind, setSepKind] = useState<SeparatorKind>('newline');
  const [customSep, setCustomSep] = useState('');
  const [copied, setCopied] = useState(false);

  const { text: output, error } = useMemo(() => {
    const separator = resolveSeparator(sepKind, customSep);
    return buildRepeat(input, count, separator);
  }, [input, count, sepKind, customSep]);

  function reset() {
    setInput('');
    setCount(3);
    setSepKind('newline');
    setCustomSep('');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="텍스트 반복" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">입력한 텍스트를 지정한 횟수만큼 반복합니다.</p>

        <textarea
          className="min-h-32 w-full resize-y rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">반복 횟수</span>
            <Input
              type="number"
              min={1}
              max={MAX_COUNT}
              value={count}
              onChange={(e) => setCount(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <div className="space-y-1">
            <span className="text-sm font-medium">구분자</span>
            <div className="flex flex-wrap gap-2">
              {SEPARATOR_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={sepKind === opt.value ? 'default' : 'outline'}
                  onClick={() => setSepKind(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          {sepKind === 'custom' && (
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">구분자 직접 입력</span>
              <Input value={customSep} onChange={(e) => setCustomSep(e.target.value)} placeholder="예: ;" />
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <textarea
          className="min-h-40 w-full resize-y rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
