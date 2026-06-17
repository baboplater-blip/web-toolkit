'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Frequency = 'yearly' | 'monthly' | 'daily';

const FREQUENCY_PER_YEAR: Record<Frequency, number> = {
  yearly: 1,
  monthly: 12,
  daily: 365,
};

const FREQUENCY_LABEL: Record<Frequency, string> = {
  yearly: '연 복리',
  monthly: '월 복리',
  daily: '일 복리',
};

interface CompoundResult {
  principal: number;
  totalContribution: number;
  finalAmount: number;
  totalInterest: number;
}

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

/** 복리 + 정기적립(매 복리주기 말 납입) 만기금액 계산. */
function calcCompound(
  principal: number,
  annualRatePercent: number,
  years: number,
  frequency: Frequency,
  contribution: number,
): CompoundResult {
  const periodsPerYear = FREQUENCY_PER_YEAR[frequency];
  const totalPeriods = Math.round(years * periodsPerYear);
  const ratePerPeriod = annualRatePercent / 100 / periodsPerYear;

  let balance = principal;
  for (let period = 0; period < totalPeriods; period += 1) {
    balance = balance * (1 + ratePerPeriod) + contribution;
  }

  const totalContribution = contribution * totalPeriods;
  const finalAmount = balance;
  const totalInterest = finalAmount - principal - totalContribution;

  return { principal, totalContribution, finalAmount, totalInterest };
}

export default function CompoundInterestPage() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('yearly');
  const [contribution, setContribution] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo<CompoundResult | null>(() => {
    const principalValue = parseNumber(principal);
    const rateValue = parseNumber(rate);
    const yearsValue = parseNumber(years);
    const contributionValue = contribution.trim() === '' ? 0 : parseNumber(contribution);

    if (
      principal.trim() === '' ||
      rate.trim() === '' ||
      years.trim() === '' ||
      !Number.isFinite(principalValue) ||
      !Number.isFinite(rateValue) ||
      !Number.isFinite(yearsValue) ||
      !Number.isFinite(contributionValue) ||
      principalValue < 0 ||
      yearsValue <= 0 ||
      contributionValue < 0
    ) {
      return null;
    }

    return calcCompound(principalValue, rateValue, yearsValue, frequency, contributionValue);
  }, [principal, rate, years, frequency, contribution]);

  function reset() {
    setPrincipal('');
    setRate('');
    setYears('');
    setFrequency('yearly');
    setContribution('');
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    const text = [
      `만기금액: ${formatWon(result.finalAmount)}`,
      `원금: ${formatWon(result.principal)}`,
      `총 적립액: ${formatWon(result.totalContribution)}`,
      `총 이자: ${formatWon(result.totalInterest)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한이 없거나 비보안 컨텍스트인 경우 — 무시
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="복리 계산기" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          원금·연이율·기간·복리 주기와 정기 적립으로 만기 금액을 계산합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">원금 (원)</span>
            <Input
              inputMode="decimal"
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              placeholder="예: 10,000,000"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">연이율 (%)</span>
            <Input
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="예: 3.5"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">기간 (년)</span>
            <Input
              inputMode="decimal"
              value={years}
              onChange={(event) => setYears(event.target.value)}
              placeholder="예: 10"
            />
          </label>
          <div className="space-y-1">
            <span className="text-sm font-medium">복리 주기</span>
            <div className="flex gap-2">
              {(Object.keys(FREQUENCY_PER_YEAR) as Frequency[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={frequency === option ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFrequency(option)}
                >
                  {FREQUENCY_LABEL[option]}
                </Button>
              ))}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">정기 적립액 (선택, 주기마다)</span>
            <Input
              inputMode="decimal"
              value={contribution}
              onChange={(event) => setContribution(event.target.value)}
              placeholder="예: 100,000 (없으면 비워 두세요)"
            />
          </label>
        </div>

        {principal.trim() !== '' && rate.trim() !== '' && years.trim() !== '' && !result && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            입력값을 확인해 주세요. 원금은 0 이상, 기간은 0보다 큰 숫자여야 합니다.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">만기 금액</p>
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {formatWon(result.finalAmount)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-sm">
              <dt className="text-muted-foreground">원금</dt>
              <dd className="text-right tabular-nums">{formatWon(result.principal)}</dd>
              <dt className="text-muted-foreground">총 적립액</dt>
              <dd className="text-right tabular-nums">{formatWon(result.totalContribution)}</dd>
              <dt className="text-muted-foreground">총 이자</dt>
              <dd className="text-right font-medium tabular-nums">{formatWon(result.totalInterest)}</dd>
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}
