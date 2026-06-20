'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/** 입력 상한(문자) — 초과분은 잘라내고 안내한다. */
const MAX_INPUT_LENGTH = 500_000;
/** 목록에 렌더링할 최대 개수 — 통계는 전체 기준으로 계산한다. */
const MAX_LIST_ITEMS = 2_000;

interface ExtractOptions {
  allowDecimal: boolean;
  allowNegative: boolean;
  allowThousands: boolean;
}

interface ExtractResult {
  values: number[];
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}

/**
 * 옵션에 맞는 숫자 매칭 정규식을 만든다.
 * - allowThousands: 1,234,567 형태의 천단위 쉼표 허용
 * - allowDecimal: 소수점 이하 허용
 * - allowNegative: 선행 음수 부호 허용
 */
function buildNumberPattern(options: ExtractOptions): RegExp {
  const sign = options.allowNegative ? '-?' : '';
  const intPart = options.allowThousands
    ? '\\d{1,3}(?:,\\d{3})+|\\d+'
    : '\\d+';
  const decimalPart = options.allowDecimal ? '(?:\\.\\d+)?' : '';
  return new RegExp(`${sign}(?:${intPart})${decimalPart}`, 'g');
}

/** 매칭된 문자열에서 쉼표를 제거하고 숫자로 변환한다. */
function parseToken(token: string): number {
  return Number(token.replace(/,/g, ''));
}

function extractNumbers(input: string, options: ExtractOptions): ExtractResult {
  const empty: ExtractResult = {
    values: [],
    count: 0,
    sum: 0,
    average: 0,
    min: 0,
    max: 0,
  };
  if (!input) return empty;

  const pattern = buildNumberPattern(options);
  const values: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    const value = parseToken(match[0]);
    if (Number.isFinite(value)) values.push(value);
    // 길이 0 매치 무한루프 방지
    if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
  }

  if (values.length === 0) return empty;

  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    sum += value;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return {
    values,
    count: values.length,
    sum,
    average: sum / values.length,
    min,
    max,
  };
}

/** 합계·평균의 표시 — 정수면 그대로, 소수면 자리수를 다듬는다. */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function NumberExtractPage() {
  const [input, setInput] = useState('');
  const [allowDecimal, setAllowDecimal] = useState(true);
  const [allowNegative, setAllowNegative] = useState(true);
  const [allowThousands, setAllowThousands] = useState(true);
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);
  const overLimit = deferredInput.length > MAX_INPUT_LENGTH;

  const result = useMemo(
    () =>
      extractNumbers(overLimit ? deferredInput.slice(0, MAX_INPUT_LENGTH) : deferredInput, {
        allowDecimal,
        allowNegative,
        allowThousands,
      }),
    [deferredInput, overLimit, allowDecimal, allowNegative, allowThousands],
  );

  const visibleValues = useMemo(
    () => result.values.slice(0, MAX_LIST_ITEMS),
    [result.values],
  );

  function reset() {
    setInput('');
    setAllowDecimal(true);
    setAllowNegative(true);
    setAllowThousands(true);
  }

  async function copyList() {
    if (result.count === 0) return;
    await navigator.clipboard?.writeText(result.values.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const hasInput = input.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="숫자만 추출" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트에 섞인 숫자만 골라내고 합계·평균·개수를 계산합니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 텍스트를 입력하세요"
          aria-label="입력"
        />

        {overLimit && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            입력이 {MAX_INPUT_LENGTH.toLocaleString()}자를 초과해 앞부분만 분석합니다.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={allowDecimal}
              onChange={(e) => setAllowDecimal(e.target.checked)}
            />
            소수점 포함
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={allowNegative}
              onChange={(e) => setAllowNegative(e.target.checked)}
            />
            음수 인식
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={allowThousands}
              onChange={(e) => setAllowThousands(e.target.checked)}
            />
            천단위 쉼표(1,234) 인식
          </label>
        </div>

        {!hasInput ? (
          <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            분석할 텍스트를 입력하세요.
          </p>
        ) : result.count === 0 ? (
          <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            추출된 숫자가 없습니다.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="status">
              <SummaryCard label="개수" value={result.count.toLocaleString()} />
              <SummaryCard label="합계" value={formatNumber(result.sum)} />
              <SummaryCard label="평균" value={formatNumber(result.average)} />
              <SummaryCard label="최솟값" value={formatNumber(result.min)} />
              <SummaryCard label="최댓값" value={formatNumber(result.max)} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {result.count > visibleValues.length
                  ? `목록은 처음 ${MAX_LIST_ITEMS.toLocaleString()}개만 표시합니다.`
                  : ' '}
              </p>
              <Button variant="outline" size="sm" onClick={copyList}>
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                목록 복사
              </Button>
            </div>

            <div className="max-h-72 overflow-auto rounded-xl border bg-muted/40 p-3 font-mono text-sm">
              {visibleValues.map((value, index) => (
                <div key={index} className="tabular-nums">
                  {value}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-all text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
