'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'add' | 'remove';

/** "  12.  내용" 또는 "12) 내용" 처럼 앞에 붙은 번호 + 구분자를 제거하기 위한 패턴. */
const LEADING_NUMBER_PATTERN = /^\s*\d+[.):\]\s]+/;

/**
 * 각 줄 앞에 번호(0패딩·구분자 적용)를 붙인다.
 * @param input 원본 텍스트
 * @param start 시작 번호
 * @param pad   0패딩 최소 자릿수 (1 이하면 패딩 없음)
 * @param sep   번호와 본문 사이 구분자
 */
function addLineNumbers(input: string, start: number, pad: number, sep: string): string {
  const lines = input.split('\n');
  return lines
    .map((line, index) => {
      const num = String(start + index);
      const padded = pad > 1 ? num.padStart(pad, '0') : num;
      return `${padded}${sep}${line}`;
    })
    .join('\n');
}

function removeLineNumbers(input: string): string {
  return input
    .split('\n')
    .map((line) => line.replace(LEADING_NUMBER_PATTERN, ''))
    .join('\n');
}

export default function LineNumbersPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('add');
  const [start, setStart] = useState(1);
  const [pad, setPad] = useState(0);
  const [separator, setSeparator] = useState('. ');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'add' ? addLineNumbers(input, start, pad, separator) : removeLineNumbers(input);
  }, [input, mode, start, pad, separator]);

  function reset() {
    setInput('');
    setMode('add');
    setStart(1);
    setPad(0);
    setSeparator('. ');
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
      <ToolHeader title="줄 번호 매기기" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">각 줄 앞에 번호를 붙이거나 제거합니다.</p>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={mode === 'add' ? 'default' : 'outline'} onClick={() => setMode('add')}>
            번호 추가
          </Button>
          <Button size="sm" variant={mode === 'remove' ? 'default' : 'outline'} onClick={() => setMode('remove')}>
            번호 제거
          </Button>
        </div>

        {mode === 'add' && (
          <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">시작 번호</span>
              <Input
                type="number"
                value={start}
                onChange={(e) => setStart(Number(e.target.value) || 0)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">자릿수(0패딩)</span>
              <Input
                type="number"
                min={0}
                value={pad}
                onChange={(e) => setPad(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">구분자</span>
              <Input value={separator} onChange={(e) => setSeparator(e.target.value)} placeholder=". " />
            </label>
          </div>
        )}

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
