'use client';

import { useMemo, useState } from 'react';
import { Ruler, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Unit = 'px' | 'rem' | 'em' | 'pt';

const UNITS: readonly Unit[] = ['px', 'rem', 'em', 'pt'];
const DEFAULT_ROOT_FONT_SIZE = 16;
/** CSS 표준: 1pt = 1/72 in, 1px = 1/96 in → 1px = 0.75pt */
const PX_PER_PT = 96 / 72;

/** 입력 값을 기준 단위에서 px 로 환산한다. em 은 rem 과 동일하게 root font-size 기준으로 본다. */
function toPx(value: number, unit: Unit, rootFontSize: number): number {
  switch (unit) {
    case 'px':
      return value;
    case 'rem':
    case 'em':
      return value * rootFontSize;
    case 'pt':
      return value * PX_PER_PT;
    default:
      return value;
  }
}

/** px 값을 대상 단위로 환산한다. */
function fromPx(px: number, unit: Unit, rootFontSize: number): number {
  switch (unit) {
    case 'px':
      return px;
    case 'rem':
    case 'em':
      return rootFontSize === 0 ? 0 : px / rootFontSize;
    case 'pt':
      return px / PX_PER_PT;
    default:
      return px;
  }
}

/** 불필요한 소수점 0 을 제거한 최대 4자리 문자열 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Number(value.toFixed(4)));
}

export default function CssUnitsPage() {
  const [valueText, setValueText] = useState('');
  const [unit, setUnit] = useState<Unit>('px');
  const [rootText, setRootText] = useState(String(DEFAULT_ROOT_FONT_SIZE));
  const [copiedUnit, setCopiedUnit] = useState<Unit | null>(null);

  const rootFontSize = useMemo(() => {
    const parsed = Number(rootText);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ROOT_FONT_SIZE;
  }, [rootText]);

  const rows = useMemo(() => {
    const value = Number(valueText.replace(/,/g, ''));
    if (valueText.trim() === '' || !Number.isFinite(value)) return null;
    const px = toPx(value, unit, rootFontSize);
    return UNITS.map((target) => ({
      unit: target,
      text: `${formatNumber(fromPx(px, target, rootFontSize))}${target}`,
    }));
  }, [valueText, unit, rootFontSize]);

  async function copyRow(target: Unit, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUnit(target);
      window.setTimeout(() => setCopiedUnit((current) => (current === target ? null : current)), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setValueText('');
    setUnit('px');
    setRootText(String(DEFAULT_ROOT_FONT_SIZE));
    setCopiedUnit(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 단위 변환" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ruler className="h-4 w-4 text-primary" aria-hidden />
          px·rem·em·pt 단위를 한 번에 상호 변환합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">값</span>
              <Input
                inputMode="decimal"
                value={valueText}
                onChange={(event) => setValueText(event.target.value)}
                placeholder="예: 16"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">단위</span>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value as Unit)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                aria-label="입력 단위"
              >
                {UNITS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">root font-size (px)</span>
            <Input
              inputMode="decimal"
              value={rootText}
              onChange={(event) => setRootText(event.target.value)}
              placeholder={String(DEFAULT_ROOT_FONT_SIZE)}
            />
          </label>
        </div>

        {rows && (
          <div className="overflow-hidden rounded-xl border bg-card">
            {rows.map((row) => (
              <div
                key={row.unit}
                className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0"
              >
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{row.unit}</p>
                  <p className="font-mono text-base font-semibold tabular-nums">{row.text}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyRow(row.unit, row.text)}
                  aria-label={`${row.unit} 값 복사`}
                >
                  {copiedUnit === row.unit ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedUnit === row.unit ? '복사됨' : '복사'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
