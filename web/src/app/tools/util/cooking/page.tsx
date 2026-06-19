'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type CookingUnit = 'cup' | 'tbsp' | 'tsp' | 'ml' | 'floz' | 'g';

interface UnitDef {
  id: CookingUnit;
  label: string;
  /** 1 단위당 부피(ml). g 는 물 기준 밀도(1 ml = 1 g)로 환산. */
  ml: number;
}

/*
 * 미국 표준 계량 기준:
 *   1 cup = 236.588 ml = 16 tbsp
 *   1 tbsp = 14.787 ml = 3 tsp
 *   1 tsp = 4.929 ml
 *   1 fl oz = 29.574 ml
 *   1 g(물 기준) = 1 ml
 */
const UNITS: UnitDef[] = [
  { id: 'cup', label: '컵 (cup)', ml: 236.588 },
  { id: 'tbsp', label: '큰술 (tbsp)', ml: 14.7868 },
  { id: 'tsp', label: '작은술 (tsp)', ml: 4.92892 },
  { id: 'ml', label: '밀리리터 (ml)', ml: 1 },
  { id: 'floz', label: '액량 온스 (fl oz)', ml: 29.5735 },
  { id: 'g', label: '그램 (g, 물 기준)', ml: 1 },
];

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

function findUnit(id: CookingUnit): UnitDef {
  return UNITS.find((u) => u.id === id) ?? UNITS[3];
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** 결과를 읽기 좋은 자릿수로 포맷(불필요한 0 제거). */
function formatResult(value: number): string {
  if (value === 0) return '0';
  const rounded = Math.round(value * 1000) / 1000;
  return rounded.toLocaleString('ko-KR', { maximumFractionDigits: 3 });
}

export default function CookingConverterPage() {
  const [amount, setAmount] = useState('');
  const [fromUnit, setFromUnit] = useState<CookingUnit>('cup');
  const [toUnit, setToUnit] = useState<CookingUnit>('ml');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<{ value: number } | null>(() => {
    const raw = parseAmount(amount);
    if (raw === null) return null;

    const from = findUnit(fromUnit);
    const to = findUnit(toUnit);
    const converted = (raw * from.ml) / to.ml;
    if (!Number.isFinite(converted)) return null;

    return { value: converted };
  }, [amount, fromUnit, toUnit]);

  // g 단위가 출력·입력 어느 한쪽에라도 쓰이면 밀도 가정 안내가 필요하다.
  const usesGram = fromUnit === 'g' || toUnit === 'g';

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        `${formatResult(result.value)} ${findUnit(toUnit).label}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setAmount('');
    setFromUnit('cup');
    setToUnit('ml');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="요리 계량 변환"
        widthClass="max-w-xl"
        onReset={amount ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          컵·큰술·작은술·ml·액량 온스·g 사이의 요리 계량 단위를 변환합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">양</span>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 1"
              aria-label="양"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">변환 전</span>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as CookingUnit)}
                className={selectClass}
                aria-label="변환 전 단위"
              >
                {UNITS.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">변환 후</span>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value as CookingUnit)}
                className={selectClass}
                aria-label="변환 후 단위"
              >
                {UNITS.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {result && (
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">변환 결과</p>
              <p className="truncate text-3xl font-bold tabular-nums">
                {formatResult(result.value)}
                <span className="ml-1 text-lg font-medium">
                  {findUnit(toUnit).label.replace(/\s*\(.*\)/, '')}
                </span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="ml-1">
                {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
              </span>
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          미국 표준 계량 기준입니다(1컵 = 236.6ml = 16큰술, 1큰술 = 3작은술 =
          14.79ml).
          {usesGram &&
            ' g 변환은 물과 같은 밀도(1ml = 1g)를 가정하므로 밀가루·설탕 등 재료에 따라 실제 무게는 달라집니다.'}
        </p>
      </main>
    </div>
  );
}
