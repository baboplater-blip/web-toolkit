'use client';

import { useState } from 'react';
import { Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MAX_FLIPS = 1000;

type Side = 'heads' | 'tails';

/** crypto 기반 균등 비트(0 또는 1). 단일 비트라 모듈로 편향 없음. */
function randomBit(): 0 | 1 {
  const buffer = new Uint8Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] & 1) as 0 | 1;
}

interface FlipResult {
  flips: Side[];
  heads: number;
  tails: number;
}

export default function CoinFlipPage() {
  const [count, setCount] = useState('1');
  const [result, setResult] = useState<FlipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function flip(): void {
    const times = Math.floor(Number(count));
    if (!Number.isFinite(times) || times < 1 || times > MAX_FLIPS) {
      setError(`던질 횟수는 1~${MAX_FLIPS} 사이여야 합니다.`);
      setResult(null);
      return;
    }

    const flips: Side[] = [];
    let heads = 0;
    for (let i = 0; i < times; i += 1) {
      if (randomBit() === 0) {
        flips.push('heads');
        heads += 1;
      } else {
        flips.push('tails');
      }
    }

    setError(null);
    setResult({ flips, heads, tails: times - heads });
    setCopied(false);
  }

  async function copyResult(): Promise<void> {
    if (!result) return;
    const sequence = result.flips.map((s) => (s === 'heads' ? '앞' : '뒤')).join(' ');
    const text = `${sequence}\n앞면 ${result.heads} / 뒷면 ${result.tails}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset(): void {
    setCount('1');
    setResult(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="동전 던지기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Coins className="h-5 w-5 text-primary" aria-hidden />
            동전 던지기
          </h1>
          <p className="text-sm text-muted-foreground">앞면·뒷면을 무작위로 결정하고 통계를 보여줍니다.</p>
        </header>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">던질 횟수</span>
            <Input
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="예: 10"
            />
          </label>
          <Button onClick={flip}>{result ? '다시 던지기' : '던지기'}</Button>
        </div>

        {error !== null && <p className="text-sm text-destructive">{error}</p>}

        {result !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {result.flips.map((side, idx) => (
                <span
                  key={idx}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border bg-muted px-2 text-sm font-medium"
                  title={side === 'heads' ? '앞면' : '뒷면'}
                >
                  {side === 'heads' ? '앞' : '뒤'}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">앞면</p>
                  <p className="text-2xl font-bold tabular-nums">{result.heads}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">뒷면</p>
                  <p className="text-2xl font-bold tabular-nums">{result.tails}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={copyResult}>
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
