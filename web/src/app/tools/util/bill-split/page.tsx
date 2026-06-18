'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 문자열 입력을 숫자로 안전 변환. 빈 값/비숫자는 null. */
function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const num = Number(value.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

/** 원화 정수 금액 포맷 (₩1,234). */
function formatWon(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

interface Breakdown {
  tax: number;
  tip: number;
  grandTotal: number;
  perPerson: number;
}

export default function BillSplitPage() {
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [tipRate, setTipRate] = useState('');
  const [people, setPeople] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 입력 기반 결정적 계산 — SSR/CSR 동일하므로 실시간 useMemo 안전.
  const result = useMemo<Breakdown | null>(() => {
    const baseAmount = parseNumber(amount);
    if (baseAmount === null || baseAmount < 0) return null;

    const headcount = parseNumber(people);
    if (headcount === null || headcount < 1) return null;

    // 세금·팁은 선택 입력 — 비어 있으면 0%.
    const tax = parseNumber(taxRate) ?? 0;
    const tip = parseNumber(tipRate) ?? 0;
    if (tax < 0 || tip < 0) return null;

    const taxAmount = baseAmount * (tax / 100);
    // 팁은 세전 금액 기준으로 계산.
    const tipAmount = baseAmount * (tip / 100);
    const grandTotal = baseAmount + taxAmount + tipAmount;

    return {
      tax: taxAmount,
      tip: tipAmount,
      grandTotal,
      perPerson: grandTotal / Math.floor(headcount),
    };
  }, [amount, taxRate, tipRate, people]);

  function handleReset() {
    setAmount('');
    setTaxRate('');
    setTipRate('');
    setPeople('');
  }

  async function copyResult() {
    if (!result) return;
    const text = `1인당 ${formatWon(result.perPerson)} (총 ${formatWon(result.grandTotal)})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  const hasInput = Boolean(amount || taxRate || tipRate || people);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="더치페이 계산기"
        widthClass="max-w-xl"
        onReset={hasInput ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          총액·세금·팁을 인원수로 공평하게 나눕니다. 금액 단위는 원(₩)입니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">총액 (₩)</span>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 60000"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">세금율 (%)</span>
              <Input
                inputMode="decimal"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="예: 10 (선택)"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">팁율 (%)</span>
              <Input
                inputMode="decimal"
                value={tipRate}
                onChange={(e) => setTipRate(e.target.value)}
                placeholder="예: 5 (선택)"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">인원수</span>
            <Input
              inputMode="numeric"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="예: 4"
            />
          </label>
        </div>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">1인당</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatWon(result.perPerson)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyResult}>
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

            <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">세금</dt>
                <dd className="font-medium tabular-nums">{formatWon(result.tax)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">팁</dt>
                <dd className="font-medium tabular-nums">{formatWon(result.tip)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">총액</dt>
                <dd className="font-medium tabular-nums">{formatWon(result.grandTotal)}</dd>
              </div>
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}
