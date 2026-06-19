'use client';

import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 0 이상의 유한 실수만 반환, 그 외에는 null. */
function parsePositive(value: string): number | null {
  const trimmed = value.replace(/,/g, '').trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

type Basis = 'markup' | 'margin';

export default function MarkupCalcPage() {
  const [cost, setCost] = useState('');
  const [basis, setBasis] = useState<Basis>('markup');
  const [rate, setRate] = useState('');

  const result = useMemo(() => {
    const costValue = parsePositive(cost);
    const rateValue = parsePositive(rate);
    if (costValue === null || rateValue === null) return null;

    let price: number;
    if (basis === 'markup') {
      // 마크업% = 이익/원가×100 → 판매가 = 원가×(1+마크업/100)
      price = costValue * (1 + rateValue / 100);
    } else {
      // 마진% = 이익/판매가×100 → 판매가 = 원가/(1−마진/100)
      if (rateValue >= 100) return null; // 마진 100% 이상은 정의 불가
      price = costValue / (1 - rateValue / 100);
    }

    const profit = price - costValue;
    const markupPct = costValue > 0 ? (profit / costValue) * 100 : 0;
    const marginPct = price > 0 ? (profit / price) * 100 : 0;

    return { price, profit, markupPct, marginPct };
  }, [cost, basis, rate]);

  const reset = () => {
    setCost('');
    setBasis('markup');
    setRate('');
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard?.writeText(
      `판매가 ${formatNumber(result.price)} · 이익 ${formatNumber(result.profit)} · ` +
        `마크업 ${formatNumber(result.markupPct)}% · 마진 ${formatNumber(result.marginPct)}%`,
    );
  };

  const marginInvalid =
    basis === 'margin' && result === null && parsePositive(cost) !== null && (() => {
      const r = parsePositive(rate);
      return r !== null && r >= 100;
    })();

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="마진·마크업 계산기" onReset={reset} />

      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          원가와 마크업% 또는 마진% 중 하나로 판매가·이익·나머지 비율을 계산합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">원가</span>
            <Input
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="예: 10000"
            />
          </label>

          <div className="space-y-1">
            <span className="text-sm font-medium">입력 기준</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={basis === 'markup' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBasis('markup')}
              >
                마크업% 입력
              </Button>
              <Button
                type="button"
                variant={basis === 'margin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBasis('margin')}
              >
                마진% 입력
              </Button>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">
              {basis === 'markup' ? '마크업 (%)' : '마진 (%)'}
            </span>
            <Input
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={basis === 'markup' ? '예: 50' : '예: 33.3'}
            />
            {marginInvalid && (
              <span className="block text-[11px] text-destructive">
                마진은 100% 미만이어야 합니다.
              </span>
            )}
          </label>
        </div>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                결과
              </h2>
              <Button variant="outline" size="sm" onClick={copy}>
                복사
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">판매가</p>
                <p className="text-2xl font-bold tabular-nums">{formatNumber(result.price)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">이익</p>
                <p className="text-2xl font-bold tabular-nums">{formatNumber(result.profit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">마크업</p>
                <p className="text-xl font-bold tabular-nums">{formatNumber(result.markupPct)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">마진</p>
                <p className="text-xl font-bold tabular-nums">{formatNumber(result.marginPct)}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            마크업% = 이익 ÷ 원가 × 100, 마진% = 이익 ÷ 판매가 × 100. 같은 이익이라도 마크업이 마진보다
            큰 값으로 나타납니다.
          </p>
        </div>
      </main>
    </div>
  );
}
