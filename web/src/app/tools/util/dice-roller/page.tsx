'use client';

import { useState } from 'react';
import { Dices } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DICE_PRESETS = [4, 6, 8, 10, 12, 20, 100] as const;
const MAX_DICE = 100;

/**
 * crypto 기반 균등 정수 [0, bound) 생성 (rejection sampling 으로 모듈로 편향 제거).
 */
function randomBelow(bound: number): number {
  if (bound <= 0) throw new RangeError('bound must be positive');
  const maxUint32 = 0xffffffff;
  // bound 의 배수를 넘어가는 꼬리 구간은 버려 균등성 보장.
  const limit = maxUint32 - ((maxUint32 + 1) % bound);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value > limit);
  return value % bound;
}

/** 면수 sides 의 주사위 1개를 굴려 1~sides 반환. */
function rollDie(sides: number): number {
  return randomBelow(sides) + 1;
}

interface RollResult {
  sides: number;
  rolls: number[];
  modifier: number;
  total: number;
}

export default function DiceRollerPage() {
  const [sides, setSides] = useState(6);
  const [customSides, setCustomSides] = useState('');
  const [count, setCount] = useState('1');
  const [modifier, setModifier] = useState('0');
  const [result, setResult] = useState<RollResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resolveSides(): number | null {
    if (customSides.trim() !== '') {
      const custom = Math.floor(Number(customSides));
      if (!Number.isFinite(custom) || custom < 2) return null;
      return custom;
    }
    return sides;
  }

  function roll(): void {
    const resolvedSides = resolveSides();
    const diceCount = Math.floor(Number(count));
    const mod = Math.floor(Number(modifier || '0'));

    if (resolvedSides === null) {
      setError('주사위 면수는 2 이상의 정수여야 합니다.');
      setResult(null);
      return;
    }
    if (!Number.isFinite(diceCount) || diceCount < 1 || diceCount > MAX_DICE) {
      setError(`주사위 개수는 1~${MAX_DICE} 사이여야 합니다.`);
      setResult(null);
      return;
    }
    if (!Number.isFinite(mod)) {
      setError('수정치는 정수여야 합니다.');
      setResult(null);
      return;
    }

    const rolls: number[] = [];
    for (let i = 0; i < diceCount; i += 1) {
      rolls.push(rollDie(resolvedSides));
    }
    const sum = rolls.reduce((acc, n) => acc + n, 0) + mod;

    setError(null);
    setResult({ sides: resolvedSides, rolls, modifier: mod, total: sum });
    setCopied(false);
  }

  async function copyResult(): Promise<void> {
    if (!result) return;
    const modText = result.modifier === 0 ? '' : ` ${result.modifier > 0 ? '+' : '−'} ${Math.abs(result.modifier)}`;
    const text = `d${result.sides} × ${result.rolls.length}: [${result.rolls.join(', ')}]${modText} = ${result.total}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset(): void {
    setSides(6);
    setCustomSides('');
    setCount('1');
    setModifier('0');
    setResult(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="주사위 굴리기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Dices className="h-5 w-5 text-primary" aria-hidden />
            주사위 굴리기
          </h1>
          <p className="text-sm text-muted-foreground">원하는 면수·개수·수정치로 주사위를 굴립니다.</p>
        </header>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">면수</span>
            <div className="flex flex-wrap gap-2">
              {DICE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={customSides.trim() === '' && sides === preset ? 'default' : 'outline'}
                  onClick={() => {
                    setSides(preset);
                    setCustomSides('');
                  }}
                >
                  d{preset}
                </Button>
              ))}
            </div>
            <Input
              inputMode="numeric"
              value={customSides}
              onChange={(e) => setCustomSides(e.target.value)}
              placeholder="커스텀 면수 (예: 30)"
              aria-label="커스텀 면수"
            />
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">개수</span>
            <Input
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="예: 2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">수정치 (±)</span>
            <Input
              inputMode="numeric"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              placeholder="예: -1"
            />
          </label>

          <Button onClick={roll}>{result ? '다시 굴리기' : '굴리기'}</Button>
        </div>

        {error !== null && <p className="text-sm text-destructive">{error}</p>}

        {result !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {result.rolls.map((value, idx) => (
                <span
                  key={idx}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border bg-muted px-2 font-mono text-sm tabular-nums"
                >
                  {value}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  합계{result.modifier !== 0 ? ` (수정치 ${result.modifier > 0 ? '+' : ''}${result.modifier})` : ''}
                </p>
                <p className="text-2xl font-bold tabular-nums">{result.total}</p>
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
