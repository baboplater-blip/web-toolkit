'use client';

import { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const TIP_PRESETS = [10, 15, 18, 20] as const;

function formatWon(value: number): string {
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}

export default function TipCalcPage() {
  const [bill, setBill] = useState('');
  const [tipPercent, setTipPercent] = useState('15');
  const [people, setPeople] = useState('1');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const billAmount = Number(bill.replace(/,/g, ''));
    const percent = Number(tipPercent);
    const headcount = Math.floor(Number(people));

    if (
      bill.trim() === '' ||
      !Number.isFinite(billAmount) ||
      billAmount < 0 ||
      !Number.isFinite(percent) ||
      percent < 0 ||
      !Number.isFinite(headcount) ||
      headcount < 1
    ) {
      return null;
    }

    const tip = billAmount * (percent / 100);
    const total = billAmount + tip;
    return {
      tip,
      total,
      perPerson: total / headcount,
      headcount,
    };
  }, [bill, tipPercent, people]);

  async function copyResult(): Promise<void> {
    if (!result) return;
    const text = [
      `팁(${tipPercent}%): ${formatWon(result.tip)}`,
      `총액: ${formatWon(result.total)}`,
      `1인당(${result.headcount}명): ${formatWon(result.perPerson)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset(): void {
    setBill('');
    setTipPercent('15');
    setPeople('1');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="팁 계산기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Receipt className="h-5 w-5 text-primary" aria-hidden />
            팁 계산기
          </h1>
          <p className="text-sm text-muted-foreground">
            계산서 금액과 팁 비율, 인원수로 팁액·총액·1인당 금액을 계산합니다.
          </p>
        </header>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">계산서 금액 (₩)</span>
            <Input
              inputMode="decimal"
              value={bill}
              onChange={(e) => setBill(e.target.value)}
              placeholder="예: 50000"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium">팁 비율 (%)</span>
            <div className="flex flex-wrap gap-2">
              {TIP_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={tipPercent === String(preset) ? 'default' : 'outline'}
                  onClick={() => setTipPercent(String(preset))}
                >
                  {preset}%
                </Button>
              ))}
            </div>
            <Input
              inputMode="decimal"
              value={tipPercent}
              onChange={(e) => setTipPercent(e.target.value)}
              placeholder="직접 입력"
              aria-label="팁 비율 직접 입력"
            />
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

        {result === null ? (
          <p className="text-sm text-muted-foreground">
            금액·팁 비율·인원수(1명 이상)를 올바르게 입력하세요.
          </p>
        ) : (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">팁</p>
                <p className="text-lg font-bold tabular-nums">{formatWon(result.tip)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">총액</p>
                <p className="text-lg font-bold tabular-nums">{formatWon(result.total)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">1인당 ({result.headcount}명)</p>
                <p className="text-2xl font-bold tabular-nums">{formatWon(result.perPerson)}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyResult}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
