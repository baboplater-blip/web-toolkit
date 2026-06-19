'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Table } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'tsv-to-csv' | 'csv-to-tsv';

const SAMPLE_TSV = `name\tage\tcity
Alice\t30\tSeoul
Bob\t25\tBusan
Charlie\t35\tIncheon`;

/** 셀 값을 문자열로 정규화한다(papaparse 가 숫자/불리언을 반환할 수 있음). */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * CSV 필드를 인코딩한다.
 * 콤마·따옴표·개행을 포함하면 큰따옴표로 감싸고, 내부 따옴표는 "" 로 이스케이프한다.
 */
function encodeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** TSV 텍스트를 CSV 텍스트로 변환한다(개행으로 행, 탭으로 필드 분리). */
function tsvToCsv(input: string): string {
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  return lines
    .map((line) => line.split('\t').map(encodeCsvField).join(','))
    .join('\n');
}

export default function TsvToCsvPage() {
  const [input, setInput] = useState(SAMPLE_TSV);
  const [direction, setDirection] = useState<Direction>('tsv-to-csv');
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // CSV→TSV 방향에서만 papaparse 로 입력을 비동기 파싱한다.
  useEffect(() => {
    if (direction !== 'csv-to-tsv') {
      setError(null);
      setCsvRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      if (!input.trim()) {
        if (!cancelled) setCsvRows([]);
        return;
      }
      try {
        const Papa = (await import('papaparse')).default;
        const result = Papa.parse<unknown[]>(input, {
          header: false,
          skipEmptyLines: false,
        });
        if (cancelled) return;
        if (result.errors.length > 0) {
          setError(result.errors.map((e) => e.message).join('\n'));
        }
        const parsed = (result.data as unknown[][]).map((row) => row.map((cell) => cellToString(cell)));
        setCsvRows(parsed);
      } catch (err) {
        if (!cancelled) {
          console.error('csv parse failed', err);
          setError(err instanceof Error ? err.message : 'CSV 파싱에 실패했습니다.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, direction]);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (direction === 'tsv-to-csv') return tsvToCsv(input);
    return csvRows.map((row) => row.join('\t')).join('\n');
  }, [input, direction, csvRows]);

  const reset = () => {
    setInput('');
    setDirection('tsv-to-csv');
    setCsvRows([]);
    setError(null);
    setCopied(false);
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  };

  const download = () => {
    if (!output) return;
    const isCsvOut = direction === 'tsv-to-csv';
    triggerDownload(
      new Blob([output], { type: `${isCsvOut ? 'text/csv' : 'text/tab-separated-values'};charset=utf-8` }),
      isCsvOut ? 'output.csv' : 'output.tsv',
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="TSV ↔ CSV 변환" onReset={reset} widthClass="max-w-5xl" />

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Table className="h-5 w-5 text-primary" aria-hidden />
            TSV ↔ CSV 변환
          </h2>
          <p className="text-sm text-muted-foreground">
            탭 구분(TSV)과 콤마 구분(CSV)을 상호 변환합니다. 모든 처리는 브라우저에서 수행됩니다.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <span className="text-[11px] text-muted-foreground">변환 방향</span>
          {(
            [
              ['tsv-to-csv', 'TSV → CSV'],
              ['csv-to-tsv', 'CSV → TSV'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDirection(value)}
              className={`h-7 rounded-md border px-3 text-[11px] ${
                direction === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="whitespace-pre-line rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="tsvcsv-input">
              {direction === 'tsv-to-csv' ? 'TSV 입력' : 'CSV 입력'}
            </label>
            <textarea
              id="tsvcsv-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="입력"
            />
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor="tsvcsv-output">
                {direction === 'tsv-to-csv' ? 'CSV 결과' : 'TSV 결과'}
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={copy}
                  disabled={!output}
                  className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] hover:bg-muted disabled:opacity-50"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? '복사됨' : '복사'}
                </button>
                <button
                  type="button"
                  onClick={download}
                  disabled={!output}
                  className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] hover:bg-muted disabled:opacity-50"
                >
                  <Download className="h-3 w-3" />
                  {direction === 'tsv-to-csv' ? 'CSV' : 'TSV'}
                </button>
              </div>
            </div>
            <textarea
              id="tsvcsv-output"
              readOnly
              value={output}
              rows={16}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
