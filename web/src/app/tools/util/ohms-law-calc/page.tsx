'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Quantity = 'V' | 'I' | 'R' | 'P';

interface FieldMeta {
  key: Quantity;
  label: string;
  unit: string;
  placeholder: string;
}

const FIELDS: FieldMeta[] = [
  { key: 'V', label: '전압', unit: 'V', placeholder: '예: 12' },
  { key: 'I', label: '전류', unit: 'A', placeholder: '예: 2' },
  { key: 'R', label: '저항', unit: 'Ω', placeholder: '예: 6' },
  { key: 'P', label: '전력', unit: 'W', placeholder: '예: 24' },
];

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  // 유효숫자 6자리 내에서 불필요한 0 제거.
  return Number(value.toPrecision(6)).toLocaleString('ko-KR', { maximumFractionDigits: 6 });
}

interface OhmsResult {
  V: number;
  I: number;
  R: number;
  P: number;
  /** 입력으로 주어진 두 양 (결과 강조 제외용) */
  given: Quantity[];
}

/**
 * 임의의 두 전기량으로부터 나머지 두 양을 옴의 법칙·전력 공식으로 계산한다.
 * 관계: V = I·R, P = V·I, P = I²·R, P = V²/R.
 * 물리적으로 불가능(음수·0 나눗셈)하면 null 반환.
 */
function solveOhmsLaw(values: Record<Quantity, number | null>): OhmsResult | null {
  const given = (Object.keys(values) as Quantity[]).filter((k) => values[k] !== null);
  if (given.length !== 2) return null;

  let { V, I, R, P } = values;

  const has = (a: Quantity, b: Quantity) => values[a] !== null && values[b] !== null;

  if (has('V', 'I')) {
    if ((I as number) === 0) return null; // R = V/I 불가
    R = (V as number) / (I as number);
    P = (V as number) * (I as number);
  } else if (has('V', 'R')) {
    if ((R as number) === 0) return null; // I = V/R 불가
    I = (V as number) / (R as number);
    P = ((V as number) * (V as number)) / (R as number);
  } else if (has('V', 'P')) {
    if ((V as number) === 0) return null; // I = P/V 불가
    if ((P as number) === 0) return null; // R = V²/P 불가
    I = (P as number) / (V as number);
    R = ((V as number) * (V as number)) / (P as number);
  } else if (has('I', 'R')) {
    V = (I as number) * (R as number);
    P = (I as number) * (I as number) * (R as number);
  } else if (has('I', 'P')) {
    if ((I as number) === 0) return null; // V = P/I 불가
    V = (P as number) / (I as number);
    R = (P as number) / ((I as number) * (I as number));
  } else if (has('R', 'P')) {
    if ((R as number) < 0 || (P as number) < 0) return null;
    // I = sqrt(P/R), V = sqrt(P·R)
    if ((R as number) === 0) return null;
    I = Math.sqrt((P as number) / (R as number));
    V = Math.sqrt((P as number) * (R as number));
  } else {
    return null;
  }

  if (V === null || I === null || R === null || P === null) return null;
  if (![V, I, R, P].every(Number.isFinite)) return null;

  return { V, I, R, P, given };
}

export default function OhmsLawCalcPage() {
  const [inputs, setInputs] = useState<Record<Quantity, string>>({
    V: '',
    I: '',
    R: '',
    P: '',
  });
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const parsed = useMemo<Record<Quantity, number | null>>(
    () => ({
      V: parseNum(inputs.V),
      I: parseNum(inputs.I),
      R: parseNum(inputs.R),
      P: parseNum(inputs.P),
    }),
    [inputs],
  );

  const filledCount = (Object.keys(parsed) as Quantity[]).filter((k) => parsed[k] !== null).length;
  const rawFilledCount = (Object.keys(inputs) as Quantity[]).filter((k) => inputs[k].trim() !== '')
    .length;

  const result = useMemo<OhmsResult | null>(() => {
    if (filledCount !== 2) return null;
    return solveOhmsLaw(parsed);
  }, [filledCount, parsed]);

  // 잘못된 숫자가 있거나, 정확히 2개가 아닌데 입력은 채워진 경우 안내.
  const hasInvalidNumber = (Object.keys(inputs) as Quantity[]).some(
    (k) => inputs[k].trim() !== '' && parsed[k] === null,
  );
  const showCountHint = rawFilledCount > 0 && filledCount !== 2 && !hasInvalidNumber;
  const unsolvable = filledCount === 2 && result === null;

  function updateField(key: Quantity, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function copy() {
    if (!result) return;
    const text = FIELDS.map((f) => `${f.label} ${formatValue(result[f.key])}${f.unit}`).join('  ');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setInputs({ V: '', I: '', R: '', P: '' });
  }

  const dirty = rawFilledCount > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="옴의 법칙 계산기"
        widthClass="max-w-xl"
        onReset={dirty ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          전압(V)·전류(I)·저항(R)·전력(P) 중 임의의 두 값을 입력하면 나머지 두 값을 계산합니다.
          (V=I·R, P=V·I)
        </p>

        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          {FIELDS.map((field) => {
            const isGiven = result?.given.includes(field.key) ?? false;
            const computed = result && !isGiven ? formatValue(result[field.key]) : null;
            return (
              <label key={field.key} className="block space-y-1">
                <span className="text-sm font-medium">
                  {field.label} ({field.unit})
                </span>
                <Input
                  inputMode="decimal"
                  value={inputs[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  aria-label={field.label}
                />
                {computed !== null && (
                  <span className="block text-xs font-medium text-primary tabular-nums">
                    = {computed} {field.unit}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {hasInvalidNumber && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            숫자만 입력해 주세요. (쉼표는 허용됩니다)
          </p>
        )}

        {showCountHint && (
          <p className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
            정확히 두 개의 값을 입력해 주세요. (현재 {filledCount}개 입력됨)
          </p>
        )}

        {unsolvable && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            입력한 조합으로는 계산할 수 없습니다. (0 나눗셈 또는 음수 전력/저항)
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">계산 결과</p>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
                </span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((field) => {
                const isGiven = result.given.includes(field.key);
                return (
                  <div
                    key={field.key}
                    className={
                      isGiven
                        ? 'rounded-lg border bg-background p-3'
                        : 'rounded-lg border border-primary/40 bg-primary/5 p-3'
                    }
                  >
                    <p className="text-[11px] text-muted-foreground">
                      {field.label} {isGiven ? '(입력)' : '(계산)'}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {formatValue(result[field.key])}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                        {field.unit}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
