'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

type SortOrder = 'asc' | 'desc';

interface ParseResult {
  numbers: number[];
  ignored: number;
}

// 줄바꿈·쉼표·공백·탭 등 어떤 구분자로 나뉘어도 토큰을 추출한다.
// 부호·소수·지수 표기를 허용하고, 숫자로 해석되지 않는 토큰은 무시한다.
function parseNumbers(text: string): ParseResult {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  const numbers: number[] = [];
  let ignored = 0;

  for (const token of tokens) {
    const value = Number(token);
    if (Number.isFinite(value)) {
      numbers.push(value);
    } else {
      ignored += 1;
    }
  }

  return { numbers, ignored };
}

interface Summary {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}

function summarize(numbers: number[]): Summary {
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return {
    count: numbers.length,
    sum,
    average: sum / numbers.length,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
  };
}

/** 부동소수 노이즈를 줄이기 위해 최대 6자리까지만 표시한다. */
function format(value: number): string {
  return Number(value.toFixed(6)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

export default function SortNumbersPage() {
  const [input, setInput] = useState('');
  const [order, setOrder] = useState<SortOrder>('asc');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseNumbers(input), [input]);

  const sorted = useMemo(() => {
    const arr = [...parsed.numbers];
    arr.sort((a, b) => (order === 'asc' ? a - b : b - a));
    return arr;
  }, [parsed.numbers, order]);

  const output = useMemo(() => sorted.join('\n'), [sorted]);

  const summary = useMemo(
    () => (parsed.numbers.length > 0 ? summarize(parsed.numbers) : null),
    [parsed.numbers],
  );

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
    setOrder('asc');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="숫자 정렬" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          줄바꿈·쉼표·공백으로 구분된 숫자를 정렬하고 합계·평균·최소·최대를 계산합니다.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => setOrder('asc')}
              className={`rounded-md px-3 py-1.5 text-sm ${order === 'asc' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              aria-pressed={order === 'asc'}
            >
              오름차순
            </button>
            <button
              type="button"
              onClick={() => setOrder('desc')}
              className={`rounded-md px-3 py-1.5 text-sm ${order === 'desc' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              aria-pressed={order === 'desc'}
            >
              내림차순
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'예) 3, 1, 2\n10\n7'}
            aria-label="입력"
          />
          <textarea
            className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="정렬 결과"
            aria-label="결과"
          />
        </div>

        {parsed.ignored > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            숫자로 해석할 수 없는 항목 {parsed.ignored.toLocaleString()}개는 무시했습니다.
          </p>
        )}

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="개수" value={summary.count.toLocaleString()} />
            <Stat label="합계" value={format(summary.sum)} />
            <Stat label="평균" value={format(summary.average)} />
            <Stat label="최소" value={format(summary.min)} />
            <Stat label="최대" value={format(summary.max)} />
          </div>
        )}

        <Button onClick={copy} disabled={!output}>
          {copied ? '복사됨' : '결과 복사'}
        </Button>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
