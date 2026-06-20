'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface BracketInput {
  /** 구간 상한 (이 금액 이하까지 해당 세율 적용). 빈 문자열이면 "이상 전부" */
  upper: string;
  /** 세율 (%) */
  rate: string;
}

interface BracketResult {
  lower: number;
  upper: number | null;
  rate: number;
  taxableInBracket: number;
  tax: number;
}

interface TaxResult {
  rows: BracketResult[];
  totalTax: number;
  taxableBase: number;
  effectiveRate: number;
  netAmount: number;
}

const DEFAULT_BRACKETS: BracketInput[] = [
  { upper: '12000000', rate: '6' },
  { upper: '46000000', rate: '15' },
  { upper: '88000000', rate: '24' },
  { upper: '', rate: '35' },
];

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

export default function TaxBracketCalcPage() {
  const [base, setBase] = useState('');
  const [brackets, setBrackets] = useState<BracketInput[]>(DEFAULT_BRACKETS);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<TaxResult | null>(() => {
    const taxableBase = parseNum(base);
    if (taxableBase === null || taxableBase < 0) return null;

    // 상한 오름차순 정렬 (빈 상한 = 무한대는 맨 뒤). 세율은 필수.
    const parsed: { upper: number | null; rate: number }[] = [];
    for (const b of brackets) {
      const rate = parseNum(b.rate);
      if (rate === null || rate < 0) return null;
      const upperRaw = b.upper.trim();
      const upper = upperRaw === '' ? null : parseNum(b.upper);
      if (upperRaw !== '' && (upper === null || upper <= 0)) return null;
      parsed.push({ upper, rate });
    }
    if (parsed.length === 0) return null;

    parsed.sort((x, y) => {
      if (x.upper === null) return 1;
      if (y.upper === null) return -1;
      return x.upper - y.upper;
    });

    const rows: BracketResult[] = [];
    let lower = 0;
    let totalTax = 0;
    for (const bracket of parsed) {
      const cap = bracket.upper === null ? taxableBase : Math.min(bracket.upper, taxableBase);
      const taxableInBracket = Math.max(0, cap - lower);
      const tax = (taxableInBracket * bracket.rate) / 100;
      totalTax += tax;
      rows.push({
        lower,
        upper: bracket.upper,
        rate: bracket.rate,
        taxableInBracket,
        tax,
      });
      lower = bracket.upper === null ? taxableBase : bracket.upper;
      if (lower >= taxableBase) break;
    }

    const effectiveRate = taxableBase > 0 ? (totalTax / taxableBase) * 100 : 0;
    return {
      rows,
      totalTax,
      taxableBase,
      effectiveRate,
      netAmount: taxableBase - totalTax,
    };
  }, [base, brackets]);

  const invalid = base !== '' && (parseNum(base) === null || (parseNum(base) ?? -1) < 0);

  function updateBracket(index: number, field: keyof BracketInput, value: string) {
    setBrackets((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    );
  }

  function addBracket() {
    setBrackets((prev) => [...prev, { upper: '', rate: '' }]);
  }

  function removeBracket(index: number) {
    setBrackets((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatCurrency(result.totalTax));
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
    setBase('');
    setBrackets(DEFAULT_BRACKETS);
  }

  const dirty = base !== '' || brackets !== DEFAULT_BRACKETS;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="구간 세율 계산기"
        widthClass="max-w-xl"
        onReset={dirty ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          누진 세율 구간을 직접 정의해 과세표준의 구간별 세액·총세액·실효세율을 계산합니다.
          상한을 비우면 그 이상 전부에 해당 세율이 적용됩니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">과세표준</span>
            <Input
              inputMode="decimal"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="예: 50,000,000"
              aria-label="과세표준"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">세율 구간</span>
            <Button type="button" variant="outline" size="sm" onClick={addBracket}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              <span className="ml-1">구간 추가</span>
            </Button>
          </div>
          <div className="space-y-2">
            {brackets.map((b, i) => (
              <div key={i} className="flex items-end gap-2">
                <label className="block flex-1 space-y-1">
                  <span className="text-[11px] text-muted-foreground">상한 (이하)</span>
                  <Input
                    inputMode="decimal"
                    value={b.upper}
                    onChange={(e) => updateBracket(i, 'upper', e.target.value)}
                    placeholder="비우면 이상 전부"
                    aria-label={`구간 ${i + 1} 상한`}
                  />
                </label>
                <label className="block w-24 space-y-1">
                  <span className="text-[11px] text-muted-foreground">세율 (%)</span>
                  <Input
                    inputMode="decimal"
                    value={b.rate}
                    onChange={(e) => updateBracket(i, 'rate', e.target.value)}
                    placeholder="예: 15"
                    aria-label={`구간 ${i + 1} 세율`}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBracket(i)}
                  disabled={brackets.length <= 1}
                  aria-label={`구간 ${i + 1} 삭제`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {invalid && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            과세표준에 0 이상의 숫자를 입력해 주세요. (쉼표는 허용됩니다)
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">총 세액</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatCurrency(result.totalTax)}
                  <span className="ml-1 text-base font-normal text-muted-foreground">원</span>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">실효세율</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">
                  {result.effectiveRate.toFixed(2)}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">%</span>
                </p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">세후 금액</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">
                  {formatCurrency(result.netAmount)}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">원</span>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-muted-foreground">
                    <th className="py-1 font-medium">구간</th>
                    <th className="py-1 text-right font-medium">세율</th>
                    <th className="py-1 text-right font-medium">과세분</th>
                    <th className="py-1 text-right font-medium">세액</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1.5 tabular-nums">
                        {formatCurrency(row.lower)} ~{' '}
                        {row.upper === null ? '이상' : formatCurrency(row.upper)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{row.rate}%</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatCurrency(row.taxableInBracket)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{formatCurrency(row.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
