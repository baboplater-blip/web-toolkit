'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatKwh(value: number): string {
  return `${Number(value.toFixed(2)).toLocaleString('ko-KR')} kWh`;
}

interface CostResult {
  dailyKwh: number;
  monthlyKwh: number;
  yearlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
}

export default function ElectricityCostPage() {
  const [watts, setWatts] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [rate, setRate] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo<CostResult | null>(() => {
    const wattsValue = parseNumber(watts);
    const hoursValue = parseNumber(hoursPerDay);
    const rateValue = parseNumber(rate);

    if (
      wattsValue === null ||
      hoursValue === null ||
      rateValue === null ||
      wattsValue < 0 ||
      hoursValue < 0 ||
      hoursValue > 24 ||
      rateValue < 0
    ) {
      return null;
    }

    const dailyKwh = (wattsValue / 1000) * hoursValue;
    const monthlyKwh = dailyKwh * DAYS_PER_MONTH;
    const yearlyKwh = dailyKwh * DAYS_PER_YEAR;

    return {
      dailyKwh,
      monthlyKwh,
      yearlyKwh,
      dailyCost: dailyKwh * rateValue,
      monthlyCost: monthlyKwh * rateValue,
      yearlyCost: yearlyKwh * rateValue,
    };
  }, [watts, hoursPerDay, rate]);

  const hasInput = watts.trim() !== '' && hoursPerDay.trim() !== '' && rate.trim() !== '';

  function reset() {
    setWatts('');
    setHoursPerDay('');
    setRate('');
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    const text = [
      `일 ${formatWon(result.dailyCost)} (${formatKwh(result.dailyKwh)})`,
      `월 ${formatWon(result.monthlyCost)} (${formatKwh(result.monthlyKwh)})`,
      `년 ${formatWon(result.yearlyCost)} (${formatKwh(result.yearlyKwh)})`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 사용 불가 — 무시
    }
  }

  const rows: { label: string; cost: number; kwh: number }[] = result
    ? [
        { label: '하루', cost: result.dailyCost, kwh: result.dailyKwh },
        { label: '한 달 (30일)', cost: result.monthlyCost, kwh: result.monthlyKwh },
        { label: '1년 (365일)', cost: result.yearlyCost, kwh: result.yearlyKwh },
      ]
    : [];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="전기요금 계산기" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          소비전력·하루 사용시간·전기 요금 단가로 예상 전기요금과 소비 전력량을 계산합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">소비전력 (W)</span>
            <Input
              inputMode="decimal"
              value={watts}
              onChange={(event) => setWatts(event.target.value)}
              placeholder="예: 1800"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">하루 사용시간 (시간)</span>
            <Input
              inputMode="decimal"
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(event.target.value)}
              placeholder="예: 5 (0~24)"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">요금 단가 (원/kWh)</span>
            <Input
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="예: 120"
            />
          </label>
        </div>

        {hasInput && !result && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            입력값을 확인해 주세요. 소비전력·요금은 0 이상, 하루 사용시간은 0~24 사이여야 합니다.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">예상 전기요금</p>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-right">
                    <span className="block text-xl font-bold tabular-nums text-primary">{formatWon(row.cost)}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">{formatKwh(row.kwh)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
