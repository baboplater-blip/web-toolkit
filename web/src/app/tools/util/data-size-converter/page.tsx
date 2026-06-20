'use client';

import { useMemo, useState } from 'react';
import { HardDrive, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

type UnitKey = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'KiB' | 'MiB' | 'GiB' | 'TiB';

interface UnitDef {
  key: UnitKey;
  label: string;
  /** 1 단위가 몇 바이트인지. SI=1000^n, IEC=1024^n. */
  bytes: number;
  system: 'si' | 'iec';
}

const SI = 1000;
const IEC = 1024;

const UNITS: UnitDef[] = [
  { key: 'B', label: '바이트 (B)', bytes: 1, system: 'si' },
  { key: 'KB', label: '킬로바이트 (KB)', bytes: SI, system: 'si' },
  { key: 'MB', label: '메가바이트 (MB)', bytes: SI ** 2, system: 'si' },
  { key: 'GB', label: '기가바이트 (GB)', bytes: SI ** 3, system: 'si' },
  { key: 'TB', label: '테라바이트 (TB)', bytes: SI ** 4, system: 'si' },
  { key: 'KiB', label: '키비바이트 (KiB)', bytes: IEC, system: 'iec' },
  { key: 'MiB', label: '메비바이트 (MiB)', bytes: IEC ** 2, system: 'iec' },
  { key: 'GiB', label: '기비바이트 (GiB)', bytes: IEC ** 3, system: 'iec' },
  { key: 'TiB', label: '테비바이트 (TiB)', bytes: IEC ** 4, system: 'iec' },
];

const UNIT_MAP: Record<UnitKey, UnitDef> = UNITS.reduce(
  (acc, unit) => ({ ...acc, [unit.key]: unit }),
  {} as Record<UnitKey, UnitDef>,
);

/** 표시용 숫자 포맷: 큰 수는 천 단위 구분, 소수는 유효자리 제한. */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '-';
  if (value === 0) return '0';
  const rounded = Number(value.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

const DEFAULT_UNIT: UnitKey = 'MB';

export default function DataSizeConverterPage() {
  const [valueText, setValueText] = useState('');
  const [unit, setUnit] = useState<UnitKey>(DEFAULT_UNIT);
  const [copied, setCopied] = useState<UnitKey | null>(null);

  const result = useMemo(() => {
    const value = Number(valueText.replace(/,/g, ''));
    if (valueText.trim() === '' || !Number.isFinite(value) || value < 0) return null;
    const totalBytes = value * UNIT_MAP[unit].bytes;
    const rows = UNITS.map((target) => ({
      key: target.key,
      label: target.label,
      system: target.system,
      text: formatNumber(totalBytes / target.bytes),
    }));
    return { totalBytes, rows };
  }, [valueText, unit]);

  async function copyRow(target: UnitKey, text: string) {
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
  const siRows = result?.rows.filter((row) => row.system === 'si') ?? [];
  const iecRows = result?.rows.filter((row) => row.system === 'iec') ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="데이터 용량 변환" onReset={changed ? reset : undefined} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4 text-primary" aria-hidden />
          SI(1000) 와 IEC(1024) 단위를 바이트 기준으로 동시에 변환합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">값</span>
              <Input
                inputMode="decimal"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
                placeholder="예: 500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">단위</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitKey)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                aria-label="입력 단위"
              >
                {UNITS.map((item) => (
                  <option key={item.key} value={item.key}>{item.key}</option>
                ))}
              </select>
            </label>
          </div>
          {valueText.trim() !== '' && !result && (
            <p className="text-xs text-destructive">0 이상의 숫자를 입력하세요.</p>
          )}
        </div>

        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">SI (1000 단위)</p>
              <div className="overflow-hidden rounded-xl border bg-card">
                {siRows.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => copyRow(row.key, row.text)}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                    aria-label={`${row.label} 값 복사`}
                  >
                    <span className="w-8 shrink-0 text-xs text-muted-foreground">{row.key}</span>
                    <code className="flex-1 font-mono text-sm tabular-nums break-all">{row.text}</code>
                    {copied === row.key ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">IEC (1024 단위)</p>
              <div className="overflow-hidden rounded-xl border bg-card">
                {iecRows.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => copyRow(row.key, row.text)}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                    aria-label={`${row.label} 값 복사`}
                  >
                    <span className="w-8 shrink-0 text-xs text-muted-foreground">{row.key}</span>
                    <code className="flex-1 font-mono text-sm tabular-nums break-all">{row.text}</code>
                    {copied === row.key ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
