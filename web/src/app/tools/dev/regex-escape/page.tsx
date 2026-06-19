'use client';

import { useMemo, useState } from 'react';
import { Regex, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'escape' | 'unescape';

/** 정규식 메타문자 집합. 백슬래시를 붙이면 리터럴로 매칭된다. */
const META_CHARS = /[.*+?^${}()|[\]\\]/g;

/** 메타문자 앞에 백슬래시를 붙여 리터럴 매칭용으로 이스케이프. */
function escapeRegex(text: string): string {
  return text.replace(META_CHARS, '\\$&');
}

/**
 * escapeRegex 가 추가한 백슬래시를 제거(언이스케이프).
 * 백슬래시 + 메타문자 조합만 풀어 이미 이스케이프된 쌍을 정확히 되돌린다.
 */
function unescapeRegex(text: string): string {
  return text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
}

export default function RegexEscapePage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('escape');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (input === '') return '';
    return mode === 'escape' ? escapeRegex(input) : unescapeRegex(input);
  }, [input, mode]);

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

  function reset() {
    setInput('');
    setMode('escape');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="정규식 이스케이프" onReset={input ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Regex className="h-4 w-4 text-primary" aria-hidden />
          텍스트를 정규식에서 리터럴로 매칭되도록 특수문자를 이스케이프합니다.
        </p>

        <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
          <button
            type="button"
            onClick={() => setMode('escape')}
            className={`h-8 flex-1 rounded-lg text-sm font-medium transition-colors ${
              mode === 'escape' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
            aria-pressed={mode === 'escape'}
          >
            이스케이프
          </button>
          <button
            type="button"
            onClick={() => setMode('unescape')}
            className={`h-8 flex-1 rounded-lg text-sm font-medium transition-colors ${
              mode === 'unescape' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
            aria-pressed={mode === 'unescape'}
          >
            언이스케이프
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">입력</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={mode === 'escape' ? '예: a.b(c)*' : '예: a\\.b\\(c\\)\\*'}
              aria-label="입력"
              spellCheck={false}
            />
          </label>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">결과</span>
              <Button variant="outline" size="sm" onClick={copy} disabled={!output} aria-label="결과 복사">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
              value={output}
              readOnly
              placeholder="결과"
              aria-label="결과"
              spellCheck={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
