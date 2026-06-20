'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** 입력 상한(문자) — 초과분은 잘라내고 안내한다. */
const MAX_INPUT_LENGTH = 500_000;

/**
 * 각 줄 앞에 prefix, 뒤에 suffix 를 붙인다.
 * skipEmpty 가 true 면 (공백 제외) 빈 줄은 원본 그대로 둔다.
 */
function applyPrefixSuffix(
  input: string,
  prefix: string,
  suffix: string,
  skipEmpty: boolean,
): string {
  return input
    .split('\n')
    .map((line) => {
      if (skipEmpty && line.trim().length === 0) return line;
      return `${prefix}${line}${suffix}`;
    })
    .join('\n');
}

export default function PrefixSuffixLinesPage() {
  const [input, setInput] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);
  const overLimit = deferredInput.length > MAX_INPUT_LENGTH;

  const output = useMemo(() => {
    if (!deferredInput) return '';
    const source = overLimit ? deferredInput.slice(0, MAX_INPUT_LENGTH) : deferredInput;
    return applyPrefixSuffix(source, prefix, suffix, skipEmpty);
  }, [deferredInput, overLimit, prefix, suffix, skipEmpty]);

  function reset() {
    setInput('');
    setPrefix('');
    setSuffix('');
    setSkipEmpty(true);
  }

  async function copyResult() {
    if (!output) return;
    await navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const hasInput = input.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="줄 앞뒤 텍스트 추가" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          모든 줄 앞(접두)·뒤(접미)에 지정한 텍스트를 일괄로 붙입니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 텍스트를 입력하세요"
          aria-label="입력"
        />

        {overLimit && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            입력이 {MAX_INPUT_LENGTH.toLocaleString()}자를 초과해 앞부분만 처리합니다.
          </p>
        )}

        <div className="space-y-3 rounded-xl border bg-card p-3 text-sm">
          <label className="block space-y-1">
            <span className="font-medium">접두(prefix)</span>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="줄 앞에 붙일 텍스트"
              aria-label="접두 텍스트"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">접미(suffix)</span>
            <Input
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="줄 뒤에 붙일 텍스트"
              aria-label="접미 텍스트"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={skipEmpty}
              onChange={(e) => setSkipEmpty(e.target.checked)}
            />
            빈 줄은 건너뛰기
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">결과</p>
            <Button variant="outline" size="sm" onClick={copyResult} disabled={!output}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              결과 복사
            </Button>
          </div>

          {!hasInput ? (
            <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              편집할 텍스트를 입력하세요.
            </p>
          ) : (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-3 font-mono text-sm">
              {output}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}
