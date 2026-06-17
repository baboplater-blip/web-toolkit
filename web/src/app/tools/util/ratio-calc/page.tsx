'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Slot = 'a' | 'b' | 'c' | 'd';

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

function gcd(x: number, y: number): number {
  let a = Math.abs(x);
  let b = Math.abs(y);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function formatNumber(value: number): string {
  // 정수면 그대로, 아니면 소수 6자리에서 잘라 후행 0 제거.
  if (Number.isInteger(value)) return value.toLocaleString('ko-KR');
  return Number(value.toFixed(6)).toString();
}

interface SolveResult {
  values: Record<Slot, number>;
  missing: Slot;
  simplified: string | null;
}

const SLOT_ORDER: Slot[] = ['a', 'b', 'c', 'd'];
const SLOT_LABEL: Record<Slot, string> = { a: 'a', b: 'b', c: 'c', d: 'x' };

/** a:b = c:d 에서 정확히 한 칸이 비었을 때 교차곱(a·d = b·c)으로 풀이. */
function solveProportion(parsed: Record<Slot, number | null>): SolveResult | null {
  const missingSlots = SLOT_ORDER.filter((slot) => parsed[slot] === null);
  if (missingSlots.length !== 1) return null;

  const missing = missingSlots[0];
  const a = parsed.a;
  const b = parsed.b;
  const c = parsed.c;
  const d = parsed.d;

  let solved: number;
  // a·d = b·c
  if (missing === 'a') {
    if (d === 0) return null;
    solved = ((b as number) * (c as number)) / (d as number);
  } else if (missing === 'b') {
    if (c === 0) return null;
    solved = ((a as number) * (d as number)) / (c as number);
  } else if (missing === 'c') {
    if (b === 0) return null;
    solved = ((a as number) * (d as number)) / (b as number);
  } else {
    if (a === 0) return null;
    solved = ((b as number) * (c as number)) / (a as number);
  }

  if (!Number.isFinite(solved)) return null;

  const values: Record<Slot, number> = {
    a: (parsed.a ?? (missing === 'a' ? solved : 0)) as number,
    b: (parsed.b ?? (missing === 'b' ? solved : 0)) as number,
    c: (parsed.c ?? (missing === 'c' ? solved : 0)) as number,
    d: (parsed.d ?? (missing === 'd' ? solved : 0)) as number,
  };
  values[missing] = solved;

  // 입력 비 a:b 단순화 (둘 다 정수일 때만).
  let simplified: string | null = null;
  if (a !== null && b !== null && Number.isInteger(a) && Number.isInteger(b) && (a !== 0 || b !== 0)) {
    const divisor = gcd(a, b);
    if (divisor > 1) {
      simplified = `${a / divisor} : ${b / divisor}`;
    }
  }

  return { values, missing, simplified };
}

export default function RatioCalcPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [d, setD] = useState('');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo<Record<Slot, number | null>>(
    () => ({ a: parseNumber(a), b: parseNumber(b), c: parseNumber(c), d: parseNumber(d) }),
    [a, b, c, d],
  );

  const result = useMemo(() => solveProportion(parsed), [parsed]);

  const filledCount = SLOT_ORDER.filter((slot) => parsed[slot] !== null).length;

  function reset() {
    setA('');
    setB('');
    setC('');
    setD('');
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    const { values } = result;
    let text = `${formatNumber(values.a)} : ${formatNumber(values.b)} = ${formatNumber(values.c)} : ${formatNumber(values.d)}`;
    if (result.simplified) text += `\n단순화: ${result.simplified}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 사용 불가 — 무시
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="비율 계산기" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          a : b = c : x 에서 빈 칸 하나를 자동으로 풀고, 입력한 비를 기약분수로 단순화합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">네 칸 중 한 칸만 비워 두면 그 값을 계산합니다.</p>
          <div className="flex items-end gap-2">
            <label className="flex-1 space-y-1">
              <span className="text-sm font-medium">a</span>
              <Input inputMode="decimal" value={a} onChange={(event) => setA(event.target.value)} placeholder="예: 2" />
            </label>
            <span className="pb-2 text-lg font-semibold">:</span>
            <label className="flex-1 space-y-1">
              <span className="text-sm font-medium">b</span>
              <Input inputMode="decimal" value={b} onChange={(event) => setB(event.target.value)} placeholder="예: 3" />
            </label>
            <span className="pb-2 text-lg font-semibold">=</span>
            <label className="flex-1 space-y-1">
              <span className="text-sm font-medium">c</span>
              <Input inputMode="decimal" value={c} onChange={(event) => setC(event.target.value)} placeholder="예: 8" />
            </label>
            <span className="pb-2 text-lg font-semibold">:</span>
            <label className="flex-1 space-y-1">
              <span className="text-sm font-medium">x</span>
              <Input inputMode="decimal" value={d} onChange={(event) => setD(event.target.value)} placeholder="빈 칸" />
            </label>
          </div>
        </div>

        {filledCount === 4 && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
            한 칸을 비워 두어야 그 값을 계산할 수 있습니다.
          </p>
        )}
        {filledCount === 3 && !result && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            계산할 수 없습니다. 비어 있지 않은 칸에 0을 나누는 경우가 있는지 확인해 주세요.
          </p>
        )}
        {filledCount < 3 && filledCount > 0 && (
          <p className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
            세 칸을 채우면 나머지 한 칸이 자동으로 계산됩니다.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{SLOT_LABEL[result.missing]} 값</p>
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {formatNumber(result.values[result.missing])}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <p className="border-t pt-3 text-lg tabular-nums">
              {formatNumber(result.values.a)} : {formatNumber(result.values.b)} = {formatNumber(result.values.c)} :{' '}
              {formatNumber(result.values.d)}
            </p>
            {result.simplified && (
              <p className="text-sm text-muted-foreground">
                a : b 단순화 → <span className="font-medium text-foreground">{result.simplified}</span>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
