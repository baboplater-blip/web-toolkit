'use client';

import { useCallback, useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

/** 메모리 보호: 과대 입력은 사전 거부. */
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 5000;
const INITIAL_VISIBLE = 100;
const LOAD_MORE_STEP = 200;

type JsonObject = Record<string, unknown>;

interface ParseResult {
  /** 파싱에 성공한 객체 행. */
  rows: JsonObject[];
  /** 키 합집합(첫 등장 순서 유지). */
  columns: string[];
  /** 파싱에 실패한 줄 번호(1-based). */
  failedLines: number[];
  /** 행 수 제한으로 잘렸는지. */
  truncated: boolean;
}

/** 셀 표시값을 문자열로 정규화한다(객체·배열은 JSON 직렬화). */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** JSONL/NDJSON 텍스트를 줄 단위로 파싱한다. */
function parseJsonl(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const rows: JsonObject[] = [];
  const columns: string[] = [];
  const seen = new Set<string>();
  const failedLines: number[] = [];
  let truncated = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (rows.length >= MAX_ROWS) {
      truncated = true;
      break;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      failedLines.push(i + 1);
      continue;
    }
    // 객체가 아닌 값(원시값·배열)은 단일 "value" 컬럼으로 감싼다.
    const obj: JsonObject =
      parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as JsonObject)
        : { value: parsed };
    for (const key of Object.keys(obj)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
    rows.push(obj);
  }

  return { rows, columns, failedLines, truncated };
}

export default function JsonlViewerPage() {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const result = useMemo<ParseResult | null>(() => {
    if (!text.trim()) return null;
    return parseJsonl(text);
  }, [text]);

  const setInput = useCallback((value: string) => {
    setText(value);
    setVisible(INITIAL_VISIBLE);
  }, []);

  async function handleFiles(files: File[]) {
    setError(null);
    const file = files[0];
    if (!file) return;
    try {
      const content = await file.text();
      setInput(content);
    } catch (e) {
      console.error('JSONL read failed:', e);
      setError(e instanceof Error ? e.message : '파일을 읽을 수 없습니다.');
    }
  }

  function reset() {
    setText('');
    setError(null);
    setVisible(INITIAL_VISIBLE);
  }

  function exportJson() {
    if (!result || result.rows.length === 0) return;
    const json = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    triggerDownload(blob, 'data.json');
  }

  async function exportCsv() {
    if (!result || result.rows.length === 0) return;
    const Papa = (await import('papaparse')).default;
    const data = result.rows.map((row) => {
      const flat: Record<string, string> = {};
      for (const column of result.columns) {
        flat[column] = formatCell(row[column]);
      }
      return flat;
    });
    const csv = Papa.unparse({ fields: result.columns, data });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, 'data.csv');
  }

  const visibleRows = result ? result.rows.slice(0, visible) : [];
  const hasRows = result != null && result.rows.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSONL 뷰어" widthClass="max-w-4xl" onReset={reset} />
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <FileDropZone
          accept=".jsonl,.ndjson,.json,application/json,text/plain"
          maxBytes={MAX_BYTES}
          onFiles={handleFiles}
          onError={setError}
          description="JSONL/NDJSON 파일(최대 5MB)을 선택하거나 아래에 붙여넣으세요"
        />

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={text}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'줄마다 하나의 JSON 객체를 붙여넣으세요\n예: {"name": "철수", "age": 20}'}
          aria-label="JSONL 입력"
          spellCheck={false}
        />

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {result && result.truncated && (
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
            행이 너무 많아 처음 {MAX_ROWS.toLocaleString()}행만 표시합니다.
          </div>
        )}

        {result && result.failedLines.length > 0 && (
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
            파싱에 실패한 줄: {result.failedLines.slice(0, 20).join(', ')}
            {result.failedLines.length > 20 &&
              ` 외 ${result.failedLines.length - 20}개`}
          </div>
        )}

        {hasRows && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={exportJson}>JSON 배열로 내보내기</Button>
              <Button variant="outline" onClick={exportCsv}>
                CSV 로 내보내기
              </Button>
              <span className="text-xs text-muted-foreground">
                {result!.rows.length}행 · {result!.columns.length}열
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    {result!.columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="border-b px-3 py-2 text-left font-medium"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="odd:bg-background even:bg-muted/20"
                    >
                      {result!.columns.map((column) => {
                        const cell = formatCell(row[column]);
                        return (
                          <td
                            key={column}
                            className="max-w-xs truncate border-b px-3 py-1.5 align-top font-mono"
                            title={cell}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visible < result!.rows.length && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + LOAD_MORE_STEP)}
                  className="h-9 rounded-md border bg-background px-4 text-xs hover:bg-muted"
                >
                  더보기 ({result!.rows.length - visible}행 남음)
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
