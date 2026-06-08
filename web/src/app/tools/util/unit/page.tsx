'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'speed' | 'volume';

interface UnitDef {
  id: string;
  label: string;
  /** SI 또는 base 단위로 변환하는 함수 */
  toBase: (v: number) => number;
  /** base 단위에서 이 단위로 변환 */
  fromBase: (v: number) => number;
}

const CATEGORIES: Record<Category, { label: string; units: UnitDef[] }> = {
  length: {
    label: '길이',
    units: [
      { id: 'mm', label: 'mm (밀리미터)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'cm', label: 'cm (센티미터)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'm',  label: 'm (미터)',      toBase: (v) => v,        fromBase: (v) => v },
      { id: 'km', label: 'km (킬로미터)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'in', label: 'in (인치)',     toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', label: 'ft (피트)',     toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'yd', label: 'yd (야드)',     toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'mi', label: 'mi (마일)',     toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  weight: {
    label: '무게',
    units: [
      { id: 'mg', label: 'mg', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'g',  label: 'g',  toBase: (v) => v,        fromBase: (v) => v },
      { id: 'kg', label: 'kg', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 't',  label: 'ton (메트릭톤)', toBase: (v) => v * 1_000_000, fromBase: (v) => v / 1_000_000 },
      { id: 'oz', label: 'oz (온스)',     toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 },
      { id: 'lb', label: 'lb (파운드)',    toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
    ],
  },
  temperature: {
    label: '온도',
    units: [
      { id: 'c', label: '°C (섭씨)',     toBase: (v) => v,                fromBase: (v) => v },
      { id: 'f', label: '°F (화씨)',     toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: 'k', label: 'K (켈빈)',      toBase: (v) => v - 273.15,       fromBase: (v) => v + 273.15 },
    ],
  },
  area: {
    label: '면적',
    units: [
      { id: 'mm2', label: 'mm²',  toBase: (v) => v / 1_000_000, fromBase: (v) => v * 1_000_000 },
      { id: 'cm2', label: 'cm²',  toBase: (v) => v / 10_000,    fromBase: (v) => v * 10_000 },
      { id: 'm2',  label: 'm²',   toBase: (v) => v,             fromBase: (v) => v },
      { id: 'km2', label: 'km²',  toBase: (v) => v * 1_000_000, fromBase: (v) => v / 1_000_000 },
      { id: 'pyeong', label: '평 (3.3058 m²)', toBase: (v) => v * 3.305785, fromBase: (v) => v / 3.305785 },
      { id: 'in2', label: 'in²',  toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
      { id: 'ft2', label: 'ft²',  toBase: (v) => v * 0.092903,  fromBase: (v) => v / 0.092903 },
    ],
  },
  speed: {
    label: '속도',
    units: [
      { id: 'mps',  label: 'm/s',  toBase: (v) => v,            fromBase: (v) => v },
      { id: 'kmh',  label: 'km/h', toBase: (v) => v / 3.6,      fromBase: (v) => v * 3.6 },
      { id: 'mph',  label: 'mph',  toBase: (v) => v * 0.44704,  fromBase: (v) => v / 0.44704 },
      { id: 'knot', label: 'knot (해리)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  volume: {
    label: '부피',
    units: [
      { id: 'ml', label: 'mL',     toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'l',  label: 'L (리터)', toBase: (v) => v,        fromBase: (v) => v },
      { id: 'm3', label: 'm³',     toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'gal_us', label: 'gal (US)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'fl_oz_us', label: 'fl oz (US)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    ],
  },
};

function format(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 10000 || (abs < 0.0001 && abs > 0)) return n.toExponential(4);
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

export default function UnitPage() {
  const [category, setCategory] = useState<Category>('length');
  const [fromId, setFromId] = useState('m');
  const [value, setValue] = useState('1');
  const [copied, setCopied] = useState<string | null>(null);

  // 카테고리 변경 시 from 단위 초기화
  useEffect(() => {
    setFromId(CATEGORIES[category].units[0].id);
  }, [category]);

  const cat = CATEGORIES[category];
  const fromUnit = cat.units.find((u) => u.id === fromId) ?? cat.units[0];
  const v = Number(value);
  const base = Number.isFinite(v) ? fromUnit.toBase(v) : NaN;

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  }

  function handleReset() {
    setCategory('length');
    setValue('1');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="단위 변환기" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          길이·무게·온도·면적·속도·부피 단위를 상호 변환합니다.
        </p>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`h-8 shrink-0 rounded-full border px-3 text-xs ${
              category === c
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {CATEGORIES[c].label}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <label className="text-xs font-medium text-muted-foreground">입력</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono" aria-label="입력" />
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          변환 결과
        </h2>
        <div className="space-y-1.5">
          {cat.units
            .filter((u) => u.id !== fromId)
            .map((u) => {
              const val = u.fromBase(base);
              const text = format(val);
              return (
                <div key={u.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{u.label}</span>
                  <code className="flex-1 truncate font-mono text-sm">{text}</code>
                  <Button variant="ghost" size="sm" onClick={() => copy(u.id, text)}>
                    {copied === u.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              );
            })}
        </div>
      </section>
      </main>
    </div>
  );
}
