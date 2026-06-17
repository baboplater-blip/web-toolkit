'use client';

import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MAX_SETS = 20;
const MAX_RANGE = 1000;

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

/**
 * [min, max] 범위에서 중복 없이 pick 개를 뽑아 오름차순 반환.
 * 부분 Fisher-Yates 셔플로 균등성·무중복 보장.
 */
function drawSet(min: number, max: number, pick: number): number[] {
  const pool: number[] = [];
  for (let n = min; n <= max; n += 1) pool.push(n);

  for (let i = 0; i < pick; i += 1) {
    const j = i + randomBelow(pool.length - i);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, pick).sort((a, b) => a - b);
}

export default function LotteryNumberPage() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('45');
  const [pick, setPick] = useState('6');
  const [sets, setSets] = useState('1');
  const [result, setResult] = useState<number[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate(): void {
    const lo = Math.floor(Number(min));
    const hi = Math.floor(Number(max));
    const pickCount = Math.floor(Number(pick));
    const setCount = Math.floor(Number(sets));

    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) {
      setError('범위가 올바르지 않습니다. (최소 ≤ 최대)');
      setResult(null);
      return;
    }
    const rangeSize = hi - lo + 1;
    if (rangeSize > MAX_RANGE) {
      setError(`범위가 너무 넓습니다. (최대 ${MAX_RANGE}개)`);
      setResult(null);
      return;
    }
    if (!Number.isFinite(pickCount) || pickCount < 1) {
      setError('뽑을 개수는 1 이상이어야 합니다.');
      setResult(null);
      return;
    }
    if (pickCount > rangeSize) {
      setError('뽑을 개수가 범위 크기보다 많습니다.');
      setResult(null);
      return;
    }
    if (!Number.isFinite(setCount) || setCount < 1 || setCount > MAX_SETS) {
      setError(`세트 수는 1~${MAX_SETS} 사이여야 합니다.`);
      setResult(null);
      return;
    }

    const generated: number[][] = [];
    for (let i = 0; i < setCount; i += 1) {
      generated.push(drawSet(lo, hi, pickCount));
    }
    setError(null);
    setResult(generated);
    setCopied(false);
  }

  async function copyResult(): Promise<void> {
    if (!result) return;
    const text = result.map((set) => set.join(', ')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset(): void {
    setMin('1');
    setMax('45');
    setPick('6');
    setSets('1');
    setResult(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="로또 번호 생성기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Ticket className="h-5 w-5 text-primary" aria-hidden />
            로또 번호 생성기
          </h1>
          <p className="text-sm text-muted-foreground">
            범위 내에서 중복 없는 무작위 번호 조합을 세트별로 생성합니다.
          </p>
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
            <label className="block space-y-1">
              <span className="text-sm font-medium">뽑을 개수</span>
              <Input inputMode="numeric" value={pick} onChange={(e) => setPick(e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">세트 수</span>
              <Input inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} />
            </label>
          </div>
          <Button onClick={generate}>{result ? '다시 생성' : '생성'}</Button>
        </div>

        {error !== null && <p className="text-sm text-destructive">{error}</p>}

        {result !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="space-y-2">
              {result.map((set, setIdx) => (
                <div key={setIdx} className="flex flex-wrap items-center gap-2">
                  {result.length > 1 && (
                    <span className="w-6 shrink-0 text-xs text-muted-foreground">{setIdx + 1}.</span>
                  )}
                  {set.map((value) => (
                    <span
                      key={value}
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border bg-muted px-2 font-mono text-sm font-semibold tabular-nums"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={copyResult}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
