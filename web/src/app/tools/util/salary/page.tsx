'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { calcSalary, RATES } from '@/lib/office/payroll';

function parseNum(s: string): number {
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export default function SalaryCalcPage() {
  const [mode, setMode] = useState<'annual' | 'monthly'>('annual');
  const [amount, setAmount] = useState('');
  const [nonTax, setNonTax] = useState('200000');
  const [dependents, setDependents] = useState('1');

  const result = useMemo(() => {
    const value = parseNum(amount);
    if (value <= 0) return null;
    const annualGross = mode === 'annual' ? value : value * 12;
    return calcSalary({
      annualGross,
      monthlyNonTax: parseNum(nonTax),
      dependents: Math.max(1, parseNum(dependents) || 1),
    });
  }, [mode, amount, nonTax, dependents]);

  const rows = result
    ? [
        { label: '국민연금 (4.5%)', value: result.nationalPension },
        { label: '건강보험 (3.545%)', value: result.health },
        { label: '장기요양 (건보 12.95%)', value: result.longTermCare },
        { label: '고용보험 (0.9%)', value: result.employment },
        { label: '소득세 (예상)', value: result.incomeTax },
        { label: '지방소득세 (소득세 10%)', value: result.localTax },
      ]
    : [];

  // 급여 금액만 초기화한다. (비과세·부양가족은 일반적 기본값 유지)
  const handleReset = () => {
    setAmount('');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="연봉 실수령액 계산기"
        onReset={amount ? handleReset : undefined}
      />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {(['annual', 'monthly'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`h-10 text-sm rounded-md border font-medium ${
                  mode === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {m === 'annual' ? '연봉으로 입력' : '월급으로 입력'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" htmlFor="amt">
              {mode === 'annual' ? '연봉 (세전, 원)' : '월급 (세전, 원)'}
            </label>
            <Input
              id="amt"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === 'annual' ? '예: 45,000,000' : '예: 3,750,000'}
              aria-label="급여 금액"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="nontax">
                월 비과세액 (식대 등)
              </label>
              <Input
                id="nontax"
                type="text"
                inputMode="numeric"
                value={nonTax}
                onChange={(e) => setNonTax(e.target.value)}
                placeholder="200,000"
                aria-label="월 비과세액"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="dep">
                부양가족 수 (본인 포함)
              </label>
              <Input
                id="dep"
                type="text"
                inputMode="numeric"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
                placeholder="1"
                aria-label="부양가족 수"
              />
            </div>
          </div>
        </div>

        {result && (
          <>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] text-muted-foreground">월 실수령액</p>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1">
                {won(result.netMonthly)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                연 실수령 {won(result.netAnnual)} · 세전 월 {won(result.monthlyGross)}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                공제 내역 (월)
              </h2>
              <ul className="divide-y">
                {rows.map((r) => (
                  <li key={r.label} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="tabular-nums">-{won(r.value)}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between py-2 text-sm font-semibold">
                  <span>공제 합계</span>
                  <span className="tabular-nums text-rose-600 dark:text-rose-400">
                    -{won(result.totalDeduction)}
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>{RATES.year}년 기준</strong> 4대보험 요율로 계산합니다. 소득세는
            연말정산 기준 예상치(근로소득공제·세액공제 반영)로, 매월 원천징수되는
            간이세액표 금액과 다를 수 있습니다.
          </p>
          <p>
            실제 세액·실수령액은 부양가족·각종 공제·회사 정책에 따라 달라집니다. 모든
            계산은 브라우저 안에서 처리되며 입력값은 어디로도 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
