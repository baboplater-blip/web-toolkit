'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ReceiptText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';

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

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <ReceiptText className="h-5 w-5" />
          <h1 className="font-semibold text-base">부가세 계산기</h1>
        </div>
      </header>

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
              <div className="rounded-lg border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">공급가액</p>
                <p className="text-base sm:text-xl font-bold tabular-nums mt-1">{won(result.supply)}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">부가세 ({rate}%)</p>
                <p className="text-base sm:text-xl font-bold tabular-nums mt-1">{won(result.vat)}</p>
              </div>
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
                <p className="text-[11px] text-muted-foreground">합계</p>
                <p className="text-base sm:text-xl font-bold tabular-nums mt-1">{won(result.total)}</p>
              </div>
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
