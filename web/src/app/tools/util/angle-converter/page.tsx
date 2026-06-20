'use client';

import { useMemo, useState } from 'react';
import { Compass, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type AngleUnit = 'deg' | 'rad' | 'grad' | 'turn';

interface UnitDef {
  key: AngleUnit;
  label: string;
  /** 한 바퀴(360°) 기준 해당 단위의 값. 변환 계수로 사용. */
  perTurn: number;
}

const UNITS: UnitDef[] = [
  { key: 'deg', label: '도 (°)', perTurn: 360 },
  { key: 'rad', label: '라디안 (rad)', perTurn: 2 * Math.PI },
  { key: 'grad', label: '그라드 (grad)', perTurn: 400 },
  { key: 'turn', label: '회전 (turn)', perTurn: 1 },
];

const UNIT_MAP: Record<AngleUnit, UnitDef> = UNITS.reduce(
  (acc, unit) => ({ ...acc, [unit.key]: unit }),
  {} as Record<AngleUnit, UnitDef>,
);

/** value(fromUnit) 를 toUnit 으로 변환한다. turn(한 바퀴) 을 매개로 환산. */
function convert(value: number, fromUnit: AngleUnit, toUnit: AngleUnit): number {
  const turns = value / UNIT_MAP[fromUnit].perTurn;
  return turns * UNIT_MAP[toUnit].perTurn;
}

/** 표시용 숫자 포맷: 불필요한 0 제거, 과도한 소수 자리 제한. */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '-';
  if (value === 0) return '0';
  const rounded = Number(value.toPrecision(10));
  return String(rounded);
}

const DEFAULT_UNIT: AngleUnit = 'deg';

export default function AngleConverterPage() {
  const [valueText, setValueText] = useState('');
  const [unit, setUnit] = useState<AngleUnit>(DEFAULT_UNIT);
  const [copied, setCopied] = useState<AngleUnit | null>(null);

  const rows = useMemo(() => {
    const value = Number(valueText.replace(/,/g, ''));
    if (valueText.trim() === '' || !Number.isFinite(value)) return null;
    return UNITS.map((target) => ({
      key: target.key,
      label: target.label,
      text: formatNumber(convert(value, unit, target.key)),
    }));
  }, [valueText, unit]);

  async function copyRow(target: AngleUnit, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(target);
      window.setTimeout(() => setCopied((cur) => (cur === target ? null : cur)), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setValueText('');
    setUnit(DEFAULT_UNIT);
    setCopied(null);
  }

  const changed = valueText !== '' || unit !== DEFAULT_UNIT;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="각도 단위 변환" onReset={changed ? reset : undefined} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Compass className="h-4 w-4 text-primary" aria-hidden />
          도(°)·라디안·그라드·회전(turn)을 한 번에 상호 변환합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">값</span>
              <Input
                inputMode="decimal"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
                placeholder="예: 90"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">단위</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as AngleUnit)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                aria-label="입력 단위"
              >
                {UNITS.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {rows && (
          <div className="overflow-hidden rounded-xl border bg-card">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="font-mono text-base font-semibold tabular-nums break-all">{row.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyRow(row.key, row.text)}
                  className="ml-2 inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs hover:bg-muted"
                  aria-label={`${row.label} 값 복사`}
                >
                  {copied === row.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === row.key ? '복사됨' : '복사'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
