'use client';

import { useMemo, useState } from 'react';
import { Fuel } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type EfficiencyUnit = 'km-per-l' | 'l-per-100km';

function formatWon(value: number): string {
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}

export default function FuelCostPage() {
  const [distance, setDistance] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [unit, setUnit] = useState<EfficiencyUnit>('km-per-l');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const km = Number(distance.replace(/,/g, ''));
    const eff = Number(efficiency.replace(/,/g, ''));
    const price = Number(pricePerLiter.replace(/,/g, ''));

    if (
      distance.trim() === '' ||
      efficiency.trim() === '' ||
      pricePerLiter.trim() === '' ||
      !Number.isFinite(km) ||
      km < 0 ||
      !Number.isFinite(eff) ||
      eff <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return null;
    }

    // 필요 연료량(L): km/L 이면 거리/연비, L/100km 이면 거리/100*연비.
    const liters = unit === 'km-per-l' ? km / eff : (km / 100) * eff;
    return {
      liters,
      cost: liters * price,
    };
  }, [distance, efficiency, unit, pricePerLiter]);

  async function copyResult(): Promise<void> {
    if (!result) return;
    const text = [
      `필요 연료량: ${result.liters.toFixed(2)} L`,
      `총 유류비: ${formatWon(result.cost)}`,
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
    setDistance('');
    setEfficiency('');
    setUnit('km-per-l');
    setPricePerLiter('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="유류비 계산기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Fuel className="h-5 w-5 text-primary" aria-hidden />
            유류비 계산기
          </h1>
          <p className="text-sm text-muted-foreground">거리·연비·유가로 주행 유류비를 계산합니다.</p>
        </header>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">주행 거리 (km)</span>
            <Input
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="예: 300"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium">연비</span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={unit === 'km-per-l' ? 'default' : 'outline'}
                onClick={() => setUnit('km-per-l')}
              >
                km/L
              </Button>
              <Button
                type="button"
                size="sm"
                variant={unit === 'l-per-100km' ? 'default' : 'outline'}
                onClick={() => setUnit('l-per-100km')}
              >
                L/100km
              </Button>
            </div>
            <Input
              inputMode="decimal"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              placeholder={unit === 'km-per-l' ? '예: 12.5' : '예: 8'}
              aria-label="연비 값"
            />
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">유가 (원/L)</span>
            <Input
              inputMode="decimal"
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(e.target.value)}
              placeholder="예: 1700"
            />
          </label>
        </div>

        {result === null ? (
          <p className="text-sm text-muted-foreground">
            거리·연비(0 초과)·유가를 올바르게 입력하세요.
          </p>
        ) : (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">필요 연료량</p>
                <p className="text-lg font-bold tabular-nums">{result.liters.toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">총 유류비</p>
                <p className="text-2xl font-bold tabular-nums">{formatWon(result.cost)}</p>
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
