'use client';

import { useMemo, useState } from 'react';
import { Ruler, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { ShareLinkButton } from '@/components/tools/ShareLinkButton';
import { useToolUrlState } from '@/lib/use-tool-url-state';
import {
  toPx,
  fromPx,
  formatNumber,
  UNITS,
  DEFAULT_ROOT_FONT_SIZE,
  type Unit,
} from '@/lib/tools/css-units';

export default function CssUnitsPage() {
  // 입력·옵션을 URL 쿼리로 관리(공유·새로고침 시 복원). 초기 렌더는 결정적
  // 기본값으로 그리고, URL 읽기는 훅 내부의 마운트 후 useEffect 에서만 수행한다.
  const [urlState, patchUrlState] = useToolUrlState(
    { value: '', unit: 'px' as Unit, root: String(DEFAULT_ROOT_FONT_SIZE) },
  );
  const { value: valueText, unit, root: rootText } = urlState;
  const setValueText = (value: string) => patchUrlState({ value });
  const setUnit = (next: Unit) => patchUrlState({ unit: next });
  const setRootText = (root: string) => patchUrlState({ root });

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
    patchUrlState({ value: '', unit: 'px', root: String(DEFAULT_ROOT_FONT_SIZE) });
    setCopiedUnit(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 단위 변환" onReset={reset}>
        <ShareLinkButton />
      </ToolHeader>
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
