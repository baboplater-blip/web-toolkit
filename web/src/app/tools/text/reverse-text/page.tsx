'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type ReverseMode = 'chars' | 'words' | 'lines';

const MODE_OPTIONS: ReadonlyArray<{ value: ReverseMode; label: string }> = [
  { value: 'chars', label: '글자' },
  { value: 'words', label: '단어' },
  { value: 'lines', label: '줄' },
];

/**
 * 입력 텍스트를 글자/단어/줄 단위로 뒤집는다.
 * 글자 역순은 서로게이트 쌍·이모지 보존을 위해 [...str] 로 분해한다.
 */
function reverseText(input: string, mode: ReverseMode): string {
  switch (mode) {
    case 'chars':
      return [...input].reverse().join('');
    case 'words':
      return input
        .split('\n')
        .map((line) => line.split(/(\s+)/).reverse().join(''))
        .join('\n');
    case 'lines':
      return input.split('\n').reverse().join('\n');
    default:
      return input;
  }
}

export default function ReverseTextPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ReverseMode>('chars');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => (input ? reverseText(input, mode) : ''), [input, mode]);

  function reset() {
    setInput('');
    setMode('chars');
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
      <ToolHeader title="텍스트 뒤집기" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">글자·단어·줄 순서를 뒤집습니다.</p>

        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={mode === opt.value ? 'default' : 'outline'}
              onClick={() => setMode(opt.value)}
            >
              {opt.label} 역순
            </Button>
          ))}
        </div>

        <textarea
          className="min-h-40 w-full resize-y rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

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
