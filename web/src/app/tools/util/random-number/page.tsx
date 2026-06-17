'use client';

import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MAX_COUNT = 1000;
const MAX_RANGE = 10_000_000;

/** crypto 기반 균등 정수 [0, bound) (rejection sampling). */
function randomBelow(bound: number): number {
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - ((maxUint32 + 1) % bound);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value > limit);
  return value % bound;
}

export default function RandomNumberPage() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('5');
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [result, setResult] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate(): void {
    const lo = Math.floor(Number(min));
    const hi = Math.floor(Number(max));
    const howMany = Math.floor(Number(count));

    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) {
      setError('범위가 올바르지 않습니다. (최소 ≤ 최대)');
      setResult(null);
      return;
    }
    const rangeSize = hi - lo + 1;
    if (rangeSize > MAX_RANGE) {
      setError('범위가 너무 넓습니다.');
      setResult(null);
      return;
    }
    if (!Number.isFinite(howMany) || howMany < 1 || howMany > MAX_COUNT) {
      setError(`개수는 1~${MAX_COUNT} 사이여야 합니다.`);
      setResult(null);
      return;
    }
    if (!allowDuplicates && howMany > rangeSize) {
      setError('중복을 허용하지 않으면 개수가 범위 크기보다 클 수 없습니다.');
      setResult(null);
      return;
    }

    const numbers: number[] = [];
    if (allowDuplicates) {
      for (let i = 0; i < howMany; i += 1) {
        numbers.push(lo + randomBelow(rangeSize));
      }
    } else {
      // 부분 Fisher-Yates 셔플로 무중복 추출(추출 순서 보존).
      const pool: number[] = [];
      for (let n = lo; n <= hi; n += 1) pool.push(n);
      for (let i = 0; i < howMany; i += 1) {
        const j = i + randomBelow(pool.length - i);
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
        numbers.push(pool[i]);
      }
    }

    setError(null);
    setResult(numbers);
    setCopied(false);
  }

  async function copy(separator: string): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.join(separator));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset(): void {
    setMin('1');
    setMax('100');
    setCount('5');
    setAllowDuplicates(true);
    setResult(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="난수 생성기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Shuffle className="h-5 w-5 text-primary" aria-hidden />
            난수 생성기
          </h1>
          <p className="text-sm text-muted-foreground">범위·개수·중복 옵션으로 난수를 생성합니다.</p>
        </header>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">최소</span>
              <Input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">최대</span>
              <Input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">개수</span>
            <Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowDuplicates}
              onChange={(e) => setAllowDuplicates(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">중복 허용</span>
          </label>
          <Button onClick={generate}>{result ? '다시 생성' : '생성'}</Button>
        </div>

        {error !== null && <p className="text-sm text-destructive">{error}</p>}

        {result !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="break-words font-mono text-sm tabular-nums">{result.join(', ')}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(', ')}>
                {copied ? '복사됨' : '쉼표로 복사'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => copy('\n')}>
                줄바꿈으로 복사
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
