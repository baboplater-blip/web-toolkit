'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DEFAULT_WIDTH = 80;
const MIN_WIDTH = 1;
const MAX_WIDTH = 1000;

/**
 * 한 줄을 단어 단위로 폭(width)에 맞게 접는다.
 * forceBreak 가 true 면 폭보다 긴 단어를 폭 단위 조각으로 강제 분할한다.
 */
function wrapLine(line: string, width: number, forceBreak: boolean): string {
  const words = line.split(/\s+/).filter((word) => word.length > 0);
  const lines: string[] = [];
  let current = '';

  const flush = () => {
    if (current.length > 0) {
      lines.push(current);
      current = '';
    }
  };

  const appendWord = (word: string) => {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      flush();
      current = word;
    }
  };

  for (const word of words) {
    if (forceBreak && word.length > width) {
      flush();
      for (let i = 0; i < word.length; i += width) {
        const chunk = word.slice(i, i + width);
        if (chunk.length === width) {
          lines.push(chunk);
        } else {
          current = chunk; // 마지막 조각은 이어지는 단어와 합칠 수 있도록 유지
        }
      }
      continue;
    }
    appendWord(word);
  }

  flush();
  return lines.join('\n');
}

export default function WrapTextPage() {
  const [input, setInput] = useState('');
  const [widthText, setWidthText] = useState(String(DEFAULT_WIDTH));
  const [forceBreak, setForceBreak] = useState(false);
  const [copied, setCopied] = useState(false);

  const width = useMemo(() => {
    const parsed = Number.parseInt(widthText, 10);
    if (Number.isNaN(parsed)) return DEFAULT_WIDTH;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed));
  }, [widthText]);

  const output = useMemo(() => {
    if (!input) return '';
    return input
      .split('\n')
      .map((line) => wrapLine(line, width, forceBreak))
      .join('\n');
  }, [input, width, forceBreak]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setInput('');
    setWidthText(String(DEFAULT_WIDTH));
    setForceBreak(false);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="텍스트 줄바꿈 정리" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          지정한 글자 수에서 단어 단위로 줄을 접어 텍스트를 정렬합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">줄 폭 (글자 수)</span>
            <Input
              type="number"
              min={MIN_WIDTH}
              max={MAX_WIDTH}
              value={widthText}
              onChange={(e) => setWidthText(e.target.value)}
              aria-label="줄 폭"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceBreak}
              onChange={(e) => setForceBreak(e.target.checked)}
            />
            긴 단어 강제 분할
          </label>
        </div>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-40 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />

        <Button onClick={copy} disabled={!output}>
          {copied ? '복사됨' : '복사'}
        </Button>
      </main>
    </div>
  );
}
