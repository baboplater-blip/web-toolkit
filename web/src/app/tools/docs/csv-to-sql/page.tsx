'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Database, Download } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

const SAMPLE_CSV = `id,name,price,note
1,Apple,1500,fresh
2,Banana,900,
3,Cherry,3200,imported`;

/** 셀 값을 문자열로 정규화한다(papaparse 가 숫자/불리언을 반환할 수 있음). */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** SQL 식별자(테이블·컬럼명)를 안전한 형태로 정리한다. 영숫자·언더스코어만 허용. */
function sanitizeIdentifier(name: string): string {
  const cleaned = name.trim().replace(/[^A-Za-z0-9_]/g, '_');
  return cleaned || 'col';
}

/** 순수한(부호·소수점 포함) 숫자 문자열인지 판별한다. 선행 0 이 있는 값은 문자열로 취급. */
function isPlainNumber(value: string): boolean {
  if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)) return false;
  return true;
}

interface BuildOptions {
  /** 테이블 이름. */
  tableName: string;
  /** 첫 행을 컬럼명으로 사용한다(false 면 col1, col2 …). */
  useHeader: boolean;
  /** 빈 셀을 NULL 로 출력한다(false 면 빈 문자열 ''). */
  emptyAsNull: boolean;
}

/** 문자열 값을 작은따옴표로 감싸고 내부 ' 를 '' 로 이스케이프한다. */
function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** 한 셀 값을 SQL 리터럴로 변환한다. */
function toSqlLiteral(value: string, emptyAsNull: boolean): string {
  if (value === '') return emptyAsNull ? 'NULL' : "''";
  if (isPlainNumber(value)) return value;
  return quoteString(value);
}

/**
 * 2차원 셀 배열을 INSERT INTO 문 모음으로 변환한다.
 * @param rows 행별 셀 배열(papaparse 결과).
 * @param options 테이블명·헤더·NULL 옵션.
 */
function buildSql(rows: string[][], options: BuildOptions): string {
  if (rows.length === 0) return '';

  const table = sanitizeIdentifier(options.tableName);

  let columns: string[];
  let dataRows: string[][];
  if (options.useHeader) {
    columns = rows[0].map(sanitizeIdentifier);
    dataRows = rows.slice(1);
  } else {
    const columnCount = rows[0].length;
    columns = Array.from({ length: columnCount }, (_, i) => `col${i + 1}`);
    dataRows = rows;
  }

  if (columns.length === 0) return '';

  const columnList = columns.join(', ');
  const statements: string[] = [];
  for (const row of dataRows) {
    // 짧은 행은 빈 값으로 패딩, 긴 행은 컬럼 수에 맞춰 자른다.
    const values = columns.map((_, i) => toSqlLiteral(cellToString(row[i] ?? ''), options.emptyAsNull));
    statements.push(`INSERT INTO ${table} (${columnList}) VALUES (${values.join(', ')});`);
  }

  return statements.join('\n');
}

export default function CsvToSqlPage() {
  const [input, setInput] = useState(SAMPLE_CSV);
  const [tableName, setTableName] = useState('my_table');
  const [useHeader, setUseHeader] = useState(true);
  const [emptyAsNull, setEmptyAsNull] = useState(true);
  const [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      if (!input.trim()) {
        if (!cancelled) setRows([]);
        return;
      }
      try {
        const Papa = (await import('papaparse')).default;
        const result = Papa.parse<unknown[]>(input, {
          header: false,
          skipEmptyLines: true,
        });
        if (cancelled) return;
        if (result.errors.length > 0) {
          setError(result.errors.map((e) => e.message).join('\n'));
        }
        const parsed = (result.data as unknown[][]).map((row) =>
          row.map((cell) => cellToString(cell)),
        );
        setRows(parsed);
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
  }, [input]);

  const output = useMemo(
    () => buildSql(rows, { tableName, useHeader, emptyAsNull }),
    [rows, tableName, useHeader, emptyAsNull],
  );

  const reset = () => {
    setInput('');
    setTableName('my_table');
    setUseHeader(true);
    setEmptyAsNull(true);
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
    triggerDownload(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'insert.sql');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSV → SQL INSERT" onReset={reset} widthClass="max-w-5xl" />

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Database className="h-5 w-5 text-primary" aria-hidden />
            CSV → SQL INSERT
          </h2>
          <p className="text-sm text-muted-foreground">
            CSV를 INSERT INTO 문으로 변환합니다. 모든 처리는 브라우저에서 수행됩니다.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">테이블명</span>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="예: users"
              className="h-7 w-36 rounded-md border bg-background px-2 text-[11px]"
              aria-label="테이블 이름"
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={useHeader}
              onChange={(e) => setUseHeader(e.target.checked)}
            />
            첫 행을 헤더(컬럼명)로
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={emptyAsNull}
              onChange={(e) => setEmptyAsNull(e.target.checked)}
            />
            빈 셀을 NULL 로
          </label>
        </div>

        {error && (
          <div className="whitespace-pre-line rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="csv-input">
              CSV 입력
            </label>
            <textarea
              id="csv-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="CSV 입력"
            />
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor="sql-output">
                SQL 결과
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
                  SQL
                </button>
              </div>
            </div>
            <textarea
              id="sql-output"
              readOnly
              value={output}
              rows={16}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="SQL 결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
