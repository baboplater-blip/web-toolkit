'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type TermUnit = 'years' | 'months';

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return Math.round(amount).toLocaleString('ko-KR');
}

interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  months: number;
}

export default function LoanCalcPage() {
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [term, setTerm] = useState('');
  const [termUnit, setTermUnit] = useState<TermUnit>('years');

  const result = useMemo<LoanResult | null>(() => {
    const principalAmount = parseNum(principal);
    const ratePercent = parseNum(annualRate);
    const termValue = parseNum(term);
    if (
      principalAmount === null ||
      ratePercent === null ||
      termValue === null
    ) {
      return null;
    }
    if (principalAmount <= 0 || ratePercent < 0 || termValue <= 0) return null;

    const months =
      termUnit === 'years'
        ? Math.round(termValue * 12)
        : Math.round(termValue);
    if (months <= 0) return null;

    const monthlyRate = ratePercent / 100 / 12;

    // 이자율 0%: 단순 원금 분할
    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = principalAmount / months;
    } else {
      // 원리금균등 월상환액 = P * r / (1 - (1 + r)^-n)
      monthlyPayment =
        (principalAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -months));
    }
    if (!Number.isFinite(monthlyPayment)) return null;

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principalAmount;

    return { monthlyPayment, totalPayment, totalInterest, months };
  }, [principal, annualRate, term, termUnit]);

  const invalid =
    (principal !== '' && parseNum(principal) === null) ||
    (annualRate !== '' && parseNum(annualRate) === null) ||
    (term !== '' && parseNum(term) === null);

  function copy() {
    if (result) navigator.clipboard?.writeText(formatCurrency(result.monthlyPayment));
  }

  function handleReset() {
    setPrincipal('');
    setAnnualRate('');
    setTerm('');
    setTermUnit('years');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="대출 이자 계산기"
        widthClass="max-w-xl"
        onReset={principal || annualRate || term ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          원리금 균등상환 기준 월 상환액과 총이자를 계산합니다.
        </p>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">대출 원금 (원)</span>
          <Input
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="예: 100,000,000"
            aria-label="대출 원금"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">연이자율 (%)</span>
          <Input
            inputMode="decimal"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            placeholder="예: 4.5"
            aria-label="연이자율"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">기간</span>
          <div className="flex gap-2">
            <Input
              inputMode="decimal"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="예: 30"
              aria-label="대출 기간"
            />
            <div className="flex gap-1.5" role="group" aria-label="기간 단위">
              <Button
                type="button"
                variant={termUnit === 'years' ? 'default' : 'outline'}
                size="sm"
                aria-pressed={termUnit === 'years'}
                onClick={() => setTermUnit('years')}
              >
                년
              </Button>
              <Button
                type="button"
                variant={termUnit === 'months' ? 'default' : 'outline'}
                size="sm"
                aria-pressed={termUnit === 'months'}
                onClick={() => setTermUnit('months')}
              >
                개월
              </Button>
            </div>
          </div>
        </label>
      </div>

      {invalid && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          숫자만 입력해 주세요. (쉼표는 허용됩니다)
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                월 상환액 ({result.months}개월)
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(result.monthlyPayment)}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  원
                </span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              복사
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">총 상환액</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatCurrency(result.totalPayment)}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  원
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">총 이자</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-500">
                {formatCurrency(result.totalInterest)}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  원
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
