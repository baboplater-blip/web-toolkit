'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Table } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Input } from '@/components/ui/input';

const INITIAL_VISIBLE = 100;
const LOAD_MORE_STEP = 200;

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: number;
  direction: SortDirection;
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * RFC 4180 기반 CSV 파서.
 * - 따옴표로 둘러싼 필드 내부의 콤마·줄바꿈 보존
 * - 이스케이프된 따옴표(`""`) → `"` 처리
 * - CRLF / LF 양쪽 줄바꿈 지원
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let index = 0;
  const length = text.length;

  while (index < length) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      index += 1;
      continue;
    }

    if (char === '\r') {
      // CRLF 또는 단독 CR 모두 한 줄바꿈으로 처리
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      index += text[index + 1] === '\n' ? 2 : 1;
      continue;
    }

    if (char === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      index += 1;
      continue;
    }

    field += char;
    index += 1;
  }

  // 마지막 필드/행 마무리 (파일 끝에 줄바꿈이 없는 경우)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** 빈 줄(필드가 모두 빈 문자열) 제거 */
function dropEmptyRows(rows: string[][]): string[][] {
  return rows.filter(
    (row) => !(row.length === 1 && row[0].trim() === ''),
  );
}

/**
 * 두 셀 값을 비교한다. 양쪽이 숫자로 해석되면 수치 비교, 아니면 문자열 비교.
 */
function compareCells(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  const bothNumeric =
    a.trim() !== '' &&
    b.trim() !== '' &&
    !Number.isNaN(numA) &&
    !Number.isNaN(numB);
  if (bothNumeric) {
    return numA - numB;
  }
  return a.localeCompare(b, 'ko');
}

export default function CsvViewerPage() {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  async function handleFiles(files: File[]) {
    setError(null);
    const file = files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const allRows = dropEmptyRows(parseCsv(text));
      if (allRows.length === 0) {
        setParsed(null);
        setFileName(null);
        setError('CSV 내용이 비어 있습니다.');
        return;
      }
      const [headerRow, ...dataRows] = allRows;
      const columnCount = headerRow.length;
      // 행마다 열 수를 헤더에 맞춰 정규화 (부족분은 빈 문자열로 채움)
      const normalizedRows = dataRows.map((row) => {
        if (row.length === columnCount) return row;
        const filled = row.slice(0, columnCount);
        while (filled.length < columnCount) filled.push('');
        return filled;
      });
      setParsed({ headers: headerRow, rows: normalizedRows });
      setFileName(file.name);
      setSort(null);
      setQuery('');
      setVisible(INITIAL_VISIBLE);
    } catch (e) {
      console.error('CSV parse failed:', e);
      setParsed(null);
      setFileName(null);
      setError(
        e instanceof Error ? e.message : 'CSV 파일을 읽을 수 없습니다.',
      );
    }
  }

  const filteredRows = useMemo(() => {
    if (!parsed) return [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return parsed.rows;
    return parsed.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(trimmed)),
    );
  }, [parsed, query]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const { column, direction } = sort;
    const factor = direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort(
      (a, b) => compareCells(a[column] ?? '', b[column] ?? '') * factor,
    );
  }, [filteredRows, sort]);

  const visibleRows = sortedRows.slice(0, visible);

  function toggleSort(column: number) {
    setSort((current) => {
      if (!current || current.column !== column) {
        return { column, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null;
    });
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Table className="h-5 w-5 text-primary" aria-hidden />
          CSV 뷰어
        </h1>
        <p className="text-sm text-muted-foreground">
          CSV 파일을 표로 미리보고 열 정렬·검색·필터를 적용합니다.
        </p>
      </header>

      <FileDropZone
        accept=".csv,text/csv"
        onFiles={handleFiles}
        onError={setError}
        description="CSV 파일(.csv)을 선택하세요"
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {parsed && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(INITIAL_VISIBLE);
              }}
              placeholder="전체 검색…"
              aria-label="전체 검색"
              className="max-w-xs"
            />
            <span className="text-xs text-muted-foreground">
              {fileName} · {parsed.headers.length}열 · {filteredRows.length}행
              {filteredRows.length !== parsed.rows.length &&
                ` (전체 ${parsed.rows.length}행)`}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/60">
                <tr>
                  {parsed.headers.map((header, columnIndex) => {
                    const active = sort?.column === columnIndex;
                    return (
                      <th
                        key={columnIndex}
                        scope="col"
                        className="border-b px-3 py-2 text-left font-medium"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(columnIndex)}
                          className="flex items-center gap-1 hover:text-primary"
                          aria-label={`${header || `열 ${columnIndex + 1}`} 정렬`}
                        >
                          <span>{header || `열 ${columnIndex + 1}`}</span>
                          {!active && (
                            <ArrowUpDown
                              className="h-3 w-3 text-muted-foreground"
                              aria-hidden
                            />
                          )}
                          {active && sort?.direction === 'asc' && (
                            <ArrowUp className="h-3 w-3 text-primary" aria-hidden />
                          )}
                          {active && sort?.direction === 'desc' && (
                            <ArrowDown
                              className="h-3 w-3 text-primary"
                              aria-hidden
                            />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-background even:bg-muted/20">
                    {parsed.headers.map((_, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="border-b px-3 py-1.5 align-top font-mono"
                      >
                        {row[columnIndex] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={parsed.headers.length}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {visible < sortedRows.length && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setVisible((v) => v + LOAD_MORE_STEP)}
                className="h-9 rounded-md border bg-background px-4 text-xs hover:bg-muted"
              >
                더보기 ({sortedRows.length - visible}행 남음)
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
