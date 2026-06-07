'use client';

import { useMemo, useState } from 'react';
import { Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Mode = 'forward' | 'reverse';

/** 입력 문자열을 음이 아닌 수로 파싱 (쉼표 허용). null = 무효. */
function parseNonNegative(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/** 천단위 콤마 + 소수 둘째 자리까지 (불필요한 0 제거). */
function fmtMoney(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function fmtPercent(value: number): string {
  return `${value
    .toFixed(2)
    .replace(/\.?0+$/, '')}%`;
}

export default function DiscountPage() {
  const [mode, setMode] = useState<Mode>('forward');
  // forward: 정가 + 할인율 → 할인가
  const [listPrice, setListPrice] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  // reverse: 정가 + 할인가 → 할인율
  const [origPrice, setOrigPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  const result = useMemo(() => {
    if (mode === 'forward') {
      const price = parseNonNegative(listPrice);
      const rate = parseNonNegative(discountRate);
      if (price === null || rate === null) return null;
      if (rate > 100) {
        return { error: '할인율은 0~100% 사이여야 합니다.' };
      }
      const saved = price * (rate / 100);
      return {
        primaryLabel: '할인가',
        primaryValue: fmtMoney(price - saved),
        secondaryLabel: '절약액',
        secondaryValue: fmtMoney(saved),
        copyText: `할인가 ${fmtMoney(price - saved)} / 절약 ${fmtMoney(saved)}`,
        error: '',
      };
    }
    // reverse
    const orig = parseNonNegative(origPrice);
    const sale = parseNonNegative(salePrice);
    if (orig === null || sale === null) return null;
    if (orig === 0) {
      return { error: '정가는 0보다 커야 합니다.' };
    }
    if (sale > orig) {
      return { error: '할인가가 정가보다 클 수 없습니다.' };
    }
    const saved = orig - sale;
    const rate = (saved / orig) * 100;
    return {
      primaryLabel: '할인율',
      primaryValue: fmtPercent(rate),
      secondaryLabel: '절약액',
      secondaryValue: fmtMoney(saved),
      copyText: `할인율 ${fmtPercent(rate)} / 절약 ${fmtMoney(saved)}`,
      error: '',
    };
  }, [mode, listPrice, discountRate, origPrice, salePrice]);

  function copyResult() {
    if (result && !result.error && result.copyText) {
      navigator.clipboard?.writeText(result.copyText);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Tag className="h-5 w-5 text-primary" aria-hidden />
          할인가 계산기
        </h1>
        <p className="text-sm text-muted-foreground">
          정가와 할인율로 할인가·할인액을, 또는 역으로 할인율을 계산합니다.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            { id: 'forward', label: '할인율 → 할인가' },
            { id: 'reverse', label: '할인가 → 할인율' },
          ] as const
        ).map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={mode === option.id ? 'default' : 'outline'}
            onClick={() => setMode(option.id)}
            aria-pressed={mode === option.id}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        {mode === 'forward' ? (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">정가</span>
              <Input
                inputMode="decimal"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="예: 50,000"
                aria-label="정가"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">할인율 (%)</span>
              <Input
                inputMode="decimal"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                placeholder="예: 30"
                aria-label="할인율"
              />
            </label>
          </>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">정가</span>
              <Input
                inputMode="decimal"
                value={origPrice}
                onChange={(e) => setOrigPrice(e.target.value)}
                placeholder="예: 50,000"
                aria-label="정가"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">할인가</span>
              <Input
                inputMode="decimal"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="예: 35,000"
                aria-label="할인가"
              />
            </label>
          </>
        )}
      </div>

      {result?.error && (
        <p role="alert" className="text-sm text-destructive">
          {result.error}
        </p>
      )}

      {result && !result.error && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {result.primaryLabel}
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {result.primaryValue}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyResult}>
              복사
            </Button>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">
              {result.secondaryLabel}
            </p>
            <p className="text-xl font-semibold tabular-nums text-muted-foreground">
              {result.secondaryValue}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        천단위 콤마는 자동으로 인식·표시됩니다. 모든 계산은 브라우저에서 즉시
        처리됩니다.
      </p>
    </main>
  );
}
