'use client';

import { useState } from 'react';
import { Loader2, Sigma } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';

/** 메모리 보호: 전체 파일을 파싱하므로 과대 파일은 사전 거부한다. */
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

interface ColumnStats {
  name: string;
  count: number;
  missing: number;
  /** 비결측 값이 모두 숫자로 해석되면 숫자열로 본다. */
  numeric: boolean;
  sum: number | null;
  mean: number | null;
  min: number | null;
  max: number | null;
  /** 텍스트열의 고유값 수. */
  uniqueCount: number | null;
}

/** 결측 판정: null/undefined/공백만 있는 문자열. */
function isMissing(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

/** 한 열의 값 배열에서 통계를 산출한다. */
function computeColumnStats(name: string, values: unknown[]): ColumnStats {
  const present: string[] = [];
  let missing = 0;
  for (const value of values) {
    if (isMissing(value)) {
      missing += 1;
    } else {
      present.push(String(value));
    }
  }

  const numbers: number[] = [];
  let allNumeric = present.length > 0;
  for (const text of present) {
    const num = Number(text);
    if (text.trim() !== '' && !Number.isNaN(num)) {
      numbers.push(num);
    } else {
      allNumeric = false;
      break;
    }
  }

  if (allNumeric && numbers.length > 0) {
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    return {
      name,
      count: values.length,
      missing,
      numeric: true,
      sum,
      mean: sum / numbers.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      uniqueCount: null,
    };
  }

  return {
    name,
    count: values.length,
    missing,
    numeric: false,
    sum: null,
    mean: null,
    min: null,
    max: null,
    uniqueCount: new Set(present).size,
  };
}

/** 숫자 표시: 정수는 그대로, 소수는 4자리까지 반올림 후 불필요한 0 제거. */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('ko');
  return Number(value.toFixed(4)).toLocaleString('ko', { maximumFractionDigits: 4 });
}

export default function CsvStatsPage() {
  const [stats, setStats] = useState<ColumnStats[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStats(null);
    setFileName(null);
    setRowCount(0);
    setProcessing(false);
    setError(null);
  }

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`파일이 너무 큽니다. 최대 ${MAX_BYTES / (1024 * 1024)}MB까지 분석할 수 있습니다.`);
      return;
    }
    setError(null);
    setStats(null);
    setProcessing(true);
    try {
      const text = await file.text();
      const Papa = (await import('papaparse')).default;
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      const fields = parsed.meta.fields ?? [];
      if (fields.length === 0) {
        setError('CSV 헤더를 찾을 수 없습니다. 첫 행에 열 이름이 있어야 합니다.');
        return;
      }

      const rows = parsed.data;
      const columnStats = fields.map((field) =>
        computeColumnStats(field, rows.map((row) => row[field])),
      );

      setStats(columnStats);
      setFileName(file.name);
      setRowCount(rows.length);
    } catch (e) {
      console.error('CSV stats failed:', e);
      setError(e instanceof Error ? e.message : 'CSV 분석에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSV 통계 분석" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Sigma className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          CSV 열별 행수·결측·합계·평균·최소·최대·고유값을 분석합니다.
        </p>

        <FileDropZone
          accept=".csv,text/csv"
          maxBytes={MAX_BYTES}
          onFiles={handleFiles}
          onError={setError}
          description="CSV 파일(.csv, 최대 25MB)을 선택하세요"
        />

        {processing && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            분석 중…
          </p>
        )}

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {stats && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {fileName} · {stats.length}열 · {rowCount}행
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th scope="col" className="border-b px-3 py-2 text-left font-medium">열</th>
                    <th scope="col" className="border-b px-3 py-2 text-left font-medium">유형</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">행수</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">결측</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">합계</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">평균</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">최소</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">최대</th>
                    <th scope="col" className="border-b px-3 py-2 text-right font-medium">고유값</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((column, index) => (
                    <tr key={index} className="odd:bg-background even:bg-muted/20">
                      <td className="border-b px-3 py-1.5 align-top font-medium">{column.name}</td>
                      <td className="border-b px-3 py-1.5 align-top text-muted-foreground">
                        {column.numeric ? '숫자' : '텍스트'}
                      </td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">{column.count}</td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">{column.missing}</td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">
                        {column.sum != null ? formatNumber(column.sum) : '—'}
                      </td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">
                        {column.mean != null ? formatNumber(column.mean) : '—'}
                      </td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">
                        {column.min != null ? formatNumber(column.min) : '—'}
                      </td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">
                        {column.max != null ? formatNumber(column.max) : '—'}
                      </td>
                      <td className="border-b px-3 py-1.5 text-right tabular-nums">
                        {column.uniqueCount != null ? column.uniqueCount.toLocaleString('ko') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          모든 분석은 브라우저 안에서만 수행되며, 파일은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
