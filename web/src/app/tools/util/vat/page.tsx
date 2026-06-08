'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'supply' | 'total' | 'vat';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'supply', label: '공급가액 입력', hint: '공급가액 → 세액·합계' },
  { id: 'total', label: '합계 입력', hint: '합계 → 공급가액·세액' },
  { id: 'vat', label: '세액 입력', hint: '세액 → 공급가액·합계' },
];

function parseNum(s: string): number {
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export default function VatCalcPage() {
  const [mode, setMode] = useState<Mode>('total');
  const [value, setValue] = useState('');
  const [rate, setRate] = useState('10');
  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => {
    const v = parseNum(value);
    const r = parseNum(rate) / 100;
    if (v <= 0 || r < 0) return null;
    let supply: number;
    let vat: number;
    let total: number;
    if (mode === 'supply') {
      supply = v;
      vat = Math.round(supply * r);
      total = supply + vat;
    } else if (mode === 'total') {
      total = v;
      supply = Math.round(total / (1 + r));
      vat = total - supply;
    } else {
      vat = v;
      supply = Math.round(vat / r);
      total = supply + vat;
    }
    return { supply, vat, total };
  }, [mode, value, rate]);

  // 결과 숫자를 클립보드에 복사한다. (key 로 어떤 항목이 복사됐는지 구분)
  const copyValue = async (key: string, amount: number) => {
    try {
      await navigator.clipboard.writeText(String(Math.round(amount)));
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  const handleReset = () => {
    setValue('');
    setRate('10');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="부가세 계산기"
        onReset={value || rate !== '10' ? handleReset : undefined}
      />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`h-12 text-xs rounded-md border px-1 ${
                  mode === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                <div className="font-semibold">{m.label}</div>
                <div className={`text-[10px] ${mode === m.id ? 'text-primary-foreground/80' : 'text-muted-foreground'} truncate`}>
                  {m.hint}
                </div>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-[1fr_120px] gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="val">
                {mode === 'supply' ? '공급가액 (원)' : mode === 'total' ? '합계금액 (원)' : '부가세액 (원)'}
              </label>
              <Input id="val" type="text" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="예: 1,100,000" aria-label="금액" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="rate">세율 (%)</label>
              <Input id="rate" type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="10" aria-label="세율" />
            </div>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  { key: 'supply', label: '공급가액', amount: result.supply, accent: false },
                  { key: 'vat', label: `부가세 (${rate}%)`, amount: result.vat, accent: false },
                  { key: 'total', label: '합계', amount: result.total, accent: true },
                ] as const
              ).map((cell) => (
                <div
                  key={cell.key}
                  className={`rounded-lg border p-3 ${
                    cell.accent ? 'border-2 border-primary/30 bg-primary/5' : 'bg-background'
                  }`}
                >
                  <p className="text-[11px] text-muted-foreground">{cell.label}</p>
                  <p className="text-base sm:text-xl font-bold tabular-nums mt-1">
                    {won(cell.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 px-2 text-[11px]"
                    onClick={() => copyValue(cell.key, cell.amount)}
                    aria-label={`${cell.label} 복사`}
                  >
                    {copied === cell.key ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        복사
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            세금계산서·견적서의 공급가액·부가세·합계를 어느 값에서든 역산합니다. 부가가치세
            기본 세율은 10%이며 세율은 직접 바꿀 수 있습니다. 합계 기준 역산 시 공급가액은
            원 단위 반올림합니다. 계산은 브라우저에서만 처리됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
