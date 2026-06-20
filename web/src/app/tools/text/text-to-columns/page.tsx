'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/** 입력 상한(문자) — 초과분은 잘라내고 안내한다. */
const MAX_INPUT_LENGTH = 200_000;

type DelimiterKind = 'comma' | 'tab' | 'space' | 'custom';

const DELIMITER_LABELS: Record<DelimiterKind, string> = {
  comma: '쉼표 (,)',
  tab: '탭',
  space: '공백',
  custom: '직접 입력',
};

/** 한 줄을 선택한 구분자로 셀 배열로 나눈다. 공백 구분자는 연속 공백을 하나로 본다. */
function splitLine(line: string, kind: DelimiterKind, custom: string): string[] {
  switch (kind) {
    case 'comma':
      return line.split(',');
    case 'tab':
      return line.split('\t');
    case 'space':
      return line.trim().length === 0 ? [''] : line.trim().split(/\s+/);
    case 'custom':
      if (!custom) return [line];
      return line.split(custom);
    default:
      return [line];
  }
}

/** 셀의 표시 폭 — 코드 포인트 기준(한글·이모지 폭 차이는 monospace 한계상 미보정). */
function cellWidth(cell: string): number {
  return Array.from(cell).length;
}

interface AlignedResult {
  text: string;
  rowCount: number;
  columnCount: number;
}

/**
 * 행렬을 컬럼별 최대 폭에 맞춰 좌측 정렬하고 2칸 간격으로 이어 붙인다.
 * 헤더가 있으면 헤더 아래 구분선을 넣는다.
 */
function alignColumns(rows: string[][], hasHeader: boolean): AlignedResult {
  if (rows.length === 0) return { text: '', rowCount: 0, columnCount: 0 };

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const widths = new Array<number>(columnCount).fill(0);

  for (const row of rows) {
    for (let col = 0; col < columnCount; col += 1) {
      const cell = row[col] ?? '';
      const width = cellWidth(cell);
      if (width > widths[col]) widths[col] = width;
    }
  }

  const padCell = (cell: string, col: number): string => {
    const pad = widths[col] - cellWidth(cell);
    return cell + ' '.repeat(Math.max(0, pad));
  };

  const formatRow = (row: string[]): string =>
    widths
      .map((_, col) => padCell(row[col] ?? '', col))
      .join('  ')
      .replace(/\s+$/, '');

  const out: string[] = [];
  rows.forEach((row, index) => {
    out.push(formatRow(row));
    if (hasHeader && index === 0) {
      const divider = widths.map((width) => '-'.repeat(Math.max(1, width))).join('  ');
      out.push(divider);
    }
  });

  return { text: out.join('\n'), rowCount: rows.length, columnCount };
}

export default function TextToColumnsPage() {
  const [input, setInput] = useState('');
  const [delimiter, setDelimiter] = useState<DelimiterKind>('comma');
  const [custom, setCustom] = useState('');
  const [hasHeader, setHasHeader] = useState(false);
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);
  const overLimit = deferredInput.length > MAX_INPUT_LENGTH;

  const result = useMemo(() => {
    const source = overLimit ? deferredInput.slice(0, MAX_INPUT_LENGTH) : deferredInput;
    if (!source) return { text: '', rowCount: 0, columnCount: 0 } as AlignedResult;
    const rows = source.split('\n').map((line) => splitLine(line, delimiter, custom));
    return alignColumns(rows, hasHeader);
  }, [deferredInput, overLimit, delimiter, custom, hasHeader]);

  function reset() {
    setInput('');
    setDelimiter('comma');
    setCustom('');
    setHasHeader(false);
  }

  async function copyResult() {
    if (!result.text) return;
    await navigator.clipboard?.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const hasInput = input.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="구분자로 열 정렬" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          구분자로 나뉜 텍스트를 컬럼 너비에 맞춰 고정폭 표로 정렬합니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'예) 이름,나이,도시\n홍길동,30,서울'}
          aria-label="입력"
        />

        {overLimit && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            입력이 {MAX_INPUT_LENGTH.toLocaleString()}자를 초과해 앞부분만 정렬합니다.
          </p>
        )}

        <div className="space-y-3 rounded-xl border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {(Object.keys(DELIMITER_LABELS) as DelimiterKind[]).map((kind) => (
              <label key={kind} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delimiter"
                  className="h-4 w-4"
                  checked={delimiter === kind}
                  onChange={() => setDelimiter(kind)}
                />
                {DELIMITER_LABELS[kind]}
              </label>
            ))}
          </div>

          {delimiter === 'custom' && (
            <label className="flex items-center gap-2">
              <span className="whitespace-nowrap">구분자</span>
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="예) | 또는 ;"
                className="w-32 rounded-md border bg-background px-2 py-1 font-mono"
                aria-label="사용자 구분자"
              />
            </label>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
            />
            첫 줄을 헤더로(구분선 추가)
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" role="status">
              {result.rowCount > 0
                ? `${result.rowCount.toLocaleString()}행 × ${result.columnCount}열`
                : ' '}
            </p>
            <Button variant="outline" size="sm" onClick={copyResult} disabled={!result.text}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              결과 복사
            </Button>
          </div>

          {!hasInput ? (
            <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              정렬할 텍스트를 입력하세요.
            </p>
          ) : (
            <pre className="max-h-96 overflow-auto whitespace-pre rounded-xl border bg-muted/40 p-3 font-mono text-sm">
              {result.text}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}
