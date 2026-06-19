'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * 각 줄별로 공백 기준 단어를 나눠 순서를 뒤집고 단일 공백으로 다시 잇는다.
 * 줄바꿈(\n)은 그대로 보존한다.
 */
function reverseWords(input: string): string {
  return input
    .split('\n')
    .map((line) =>
      line
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .reverse()
        .join(' '),
    )
    .join('\n');
}

export default function ReverseWordsPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => (input ? reverseWords(input) : ''), [input]);

  function reset() {
    setInput('');
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

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reverse-words.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="단어 순서 뒤집기" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          각 줄의 단어 순서를 역순으로 정렬합니다. 줄바꿈은 그대로 유지됩니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여기에 입력하세요"
            aria-label="입력"
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="결과"
            aria-label="결과"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
