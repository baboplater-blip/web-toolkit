'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

type BandColor = {
  id: string;
  label: string;
  /** 색 띠 스와치 배경(CSS). 일부는 그라데이션. */
  swatch: string;
  /** 글자 대비를 위해 어두운 띠인지 표시. */
  light?: boolean;
  /** 유효숫자·곱수 자릿값. 해당 역할이 없으면 null. */
  digit: number | null;
  /** 곱수(10^n). 곱수 띠가 될 수 없으면 null. */
  multiplier: number | null;
  /** 허용오차(%). 허용오차 띠가 될 수 없으면 null. */
  tolerance: number | null;
};

/** 표준 저항 색-숫자 매핑(IEC 60062). */
const COLORS: ReadonlyArray<BandColor> = [
  { id: 'black', label: '검정', swatch: '#1a1a1a', digit: 0, multiplier: 1, tolerance: null },
  { id: 'brown', label: '갈색', swatch: '#7b4a23', digit: 1, multiplier: 10, tolerance: 1 },
  { id: 'red', label: '빨강', swatch: '#d12e2e', digit: 2, multiplier: 100, tolerance: 2 },
  { id: 'orange', label: '주황', swatch: '#e6781e', digit: 3, multiplier: 1_000, tolerance: null },
  { id: 'yellow', label: '노랑', swatch: '#f2c200', light: true, digit: 4, multiplier: 10_000, tolerance: null },
  { id: 'green', label: '초록', swatch: '#3a8a3a', digit: 5, multiplier: 100_000, tolerance: 0.5 },
  { id: 'blue', label: '파랑', swatch: '#2f5fd0', digit: 6, multiplier: 1_000_000, tolerance: 0.25 },
  { id: 'violet', label: '보라', swatch: '#7b3fb5', digit: 7, multiplier: 10_000_000, tolerance: 0.1 },
  { id: 'grey', label: '회색', swatch: '#8a8a8a', digit: 8, multiplier: 100_000_000, tolerance: 0.05 },
  { id: 'white', label: '흰색', swatch: '#f5f5f5', light: true, digit: 9, multiplier: 1_000_000_000, tolerance: null },
  { id: 'gold', label: '금색', swatch: 'linear-gradient(135deg,#d4af37,#b8860b)', digit: null, multiplier: 0.1, tolerance: 5 },
  { id: 'silver', label: '은색', swatch: 'linear-gradient(135deg,#cfcfcf,#9a9a9a)', digit: null, multiplier: 0.01, tolerance: 10 },
];

const COLOR_BY_ID = new Map(COLORS.map((color) => [color.id, color]));

type BandCount = 4 | 5;

/** 밴드 수별 역할(digit | multiplier | tolerance)과 기본 색. */
type BandRole = 'digit' | 'multiplier' | 'tolerance';

type BandSlot = {
  role: BandRole;
  /** 사용자 안내용 라벨. */
  label: string;
};

const LAYOUTS: Record<BandCount, ReadonlyArray<BandSlot>> = {
  4: [
    { role: 'digit', label: '1번째 숫자' },
    { role: 'digit', label: '2번째 숫자' },
    { role: 'multiplier', label: '곱수' },
    { role: 'tolerance', label: '허용오차' },
  ],
  5: [
    { role: 'digit', label: '1번째 숫자' },
    { role: 'digit', label: '2번째 숫자' },
    { role: 'digit', label: '3번째 숫자' },
    { role: 'multiplier', label: '곱수' },
    { role: 'tolerance', label: '허용오차' },
  ],
};

const DEFAULT_BANDS: Record<BandCount, string[]> = {
  4: ['brown', 'black', 'red', 'gold'],
  5: ['brown', 'black', 'black', 'red', 'brown'],
};

/** 역할에 따라 선택 가능한 색만 노출. */
function colorsForRole(role: BandRole): ReadonlyArray<BandColor> {
  if (role === 'digit') return COLORS.filter((c) => c.digit !== null);
  if (role === 'multiplier') return COLORS.filter((c) => c.multiplier !== null);
  return COLORS.filter((c) => c.tolerance !== null);
}

/** 옴 값을 사람이 읽기 좋은 단위(Ω/kΩ/MΩ/GΩ)로 변환. */
function formatOhms(ohms: number): string {
  const units: ReadonlyArray<[number, string]> = [
    [1_000_000_000, 'GΩ'],
    [1_000_000, 'MΩ'],
    [1_000, 'kΩ'],
    [1, 'Ω'],
  ];
  for (const [factor, suffix] of units) {
    if (ohms >= factor) {
      const scaled = ohms / factor;
      const text = Number.isInteger(scaled) ? String(scaled) : String(Number(scaled.toFixed(3)));
      return `${text} ${suffix}`;
    }
  }
  // 1Ω 미만(금·은 곱수)
  return `${Number(ohms.toFixed(3))} Ω`;
}

type DecodeResult = {
  ohms: number;
  display: string;
  tolerance: number;
  min: number;
  max: number;
};

function decode(bandCount: BandCount, selected: ReadonlyArray<string>): DecodeResult | null {
  const layout = LAYOUTS[bandCount];
  const colors = selected.map((id) => COLOR_BY_ID.get(id));
  if (colors.some((color) => color === undefined)) return null;

  let digits = 0;
  let multiplier: number | null = null;
  let tolerance: number | null = null;

  for (let i = 0; i < layout.length; i += 1) {
    const color = colors[i] as BandColor;
    const { role } = layout[i];
    if (role === 'digit') {
      if (color.digit === null) return null;
      digits = digits * 10 + color.digit;
    } else if (role === 'multiplier') {
      if (color.multiplier === null) return null;
      multiplier = color.multiplier;
    } else {
      if (color.tolerance === null) return null;
      tolerance = color.tolerance;
    }
  }

  if (multiplier === null || tolerance === null) return null;

  const ohms = digits * multiplier;
  const margin = ohms * (tolerance / 100);
  return {
    ohms,
    display: formatOhms(ohms),
    tolerance,
    min: ohms - margin,
    max: ohms + margin,
  };
}

export default function ResistorColorCodePage() {
  const [bandCount, setBandCount] = useState<BandCount>(4);
  const [bands, setBands] = useState<Record<BandCount, string[]>>({
    4: [...DEFAULT_BANDS[4]],
    5: [...DEFAULT_BANDS[5]],
  });
  const [copied, setCopied] = useState(false);

  const selected = bands[bandCount];
  const layout = LAYOUTS[bandCount];
  const result = useMemo(() => decode(bandCount, selected), [bandCount, selected]);

  function setBandColor(index: number, colorId: string): void {
    setBands((prev) => {
      const next = [...prev[bandCount]];
      next[index] = colorId;
      return { ...prev, [bandCount]: next };
    });
  }

  function reset(): void {
    setBandCount(4);
    setBands({ 4: [...DEFAULT_BANDS[4]], 5: [...DEFAULT_BANDS[5]] });
    setCopied(false);
  }

  async function copyResult(): Promise<void> {
    if (!result) return;
    const text = `${result.display} ±${result.tolerance}% (${formatOhms(result.min)} ~ ${formatOhms(result.max)})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[resistor-color-code] clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="저항 색띠 계산기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          저항기의 색 띠를 선택하면 저항값과 허용오차를 읽어냅니다.
        </p>

        <div className="inline-flex rounded-lg border bg-card p-1" role="group" aria-label="밴드 수">
          {([4, 5] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setBandCount(count)}
              className={
                bandCount === count
                  ? 'rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground'
                  : 'rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground'
              }
              aria-pressed={bandCount === count}
            >
              {count}밴드
            </button>
          ))}
        </div>

        {/* 저항 미리보기 */}
        <div className="flex items-center justify-center gap-1 rounded-xl border bg-card p-6">
          <span className="h-0.5 w-6 bg-muted-foreground/50" aria-hidden />
          <span className="flex h-16 items-center gap-1.5 rounded-md bg-amber-100 px-3 dark:bg-amber-200/80">
            {selected.map((id, index) => {
              const color = COLOR_BY_ID.get(id);
              return (
                <span
                  key={index}
                  className="h-14 w-3 rounded-sm border border-black/20"
                  style={{ background: color?.swatch ?? '#000' }}
                  aria-hidden
                />
              );
            })}
          </span>
          <span className="h-0.5 w-6 bg-muted-foreground/50" aria-hidden />
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          {layout.map((slot, index) => (
            <label key={index} className="block space-y-1">
              <span className="text-sm font-medium">{slot.label}</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={selected[index]}
                onChange={(event) => setBandColor(index, event.target.value)}
                aria-label={slot.label}
              >
                {colorsForRole(slot.role).map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {result && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">저항값</p>
                <p className="text-2xl font-bold tabular-nums">
                  {result.display}{' '}
                  <span className="text-base font-medium text-muted-foreground">
                    ±{result.tolerance}%
                  </span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyResult} aria-label="결과 복사">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                복사
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              허용 범위: {formatOhms(result.min)} ~ {formatOhms(result.max)}
            </p>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              = {result.ohms.toLocaleString()} Ω
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
