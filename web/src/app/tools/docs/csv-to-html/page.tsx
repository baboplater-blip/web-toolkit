'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Table2 } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

type Delimiter = ',' | ';' | '\t';

const SAMPLE_CSV = `name,age,city
Alice,30,Seoul
Bob,25,Busan
Charlie,35,Incheon`;

/** HTML 본문에 안전하게 넣기 위해 특수문자를 엔티티로 치환한다. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 셀 값을 문자열로 정규화한다(papaparse 가 숫자/불리언을 반환할 수 있음). */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

interface BuildOptions {
  /** 첫 행을 `<th>` 헤더로 렌더링한다. */
  useHeader: boolean;
  /** `<table>` 에 추가할 class 속성(빈 문자열이면 생략). */
  className: string;
  /** 출력 들여쓰기 단위. */
  indent: string;
}

/** 한 행을 `<tr>` 마크업으로 만든다. */
function renderRow(cells: string[], tag: 'th' | 'td', indent: string): string {
  const inner = cells
    .map((cell) => `${indent.repeat(3)}<${tag}>${escapeHtml(cell)}</${tag}>`)
    .join('\n');
  return `${indent.repeat(2)}<tr>\n${inner}\n${indent.repeat(2)}</tr>`;
}

/**
 * 2차원 셀 배열을 `<table>` HTML 마크업으로 변환한다.
 * @param rows 행별 셀 배열.
 * @param options 헤더·클래스·들여쓰기 옵션.
 */
function buildHtmlTable(rows: string[][], options: BuildOptions): string {
  if (rows.length === 0) return '';
  const { useHeader, className, indent } = options;

  const tableTag = className ? `<table class="${escapeHtml(className)}">` : '<table>';
  const parts: string[] = [tableTag];

  let bodyRows = rows;
  if (useHeader) {
    parts.push(`${indent}<thead>`);
    parts.push(renderRow(rows[0], 'th', indent));
    parts.push(`${indent}</thead>`);
    bodyRows = rows.slice(1);
  }

  parts.push(`${indent}<tbody>`);
  for (const row of bodyRows) {
    parts.push(renderRow(row, 'td', indent));
  }
  parts.push(`${indent}</tbody>`);
  parts.push('</table>');

  return parts.join('\n');
}

export default function CsvToHtmlPage() {
  const [input, setInput] = useState(SAMPLE_CSV);
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [useHeader, setUseHeader] = useState(true);
  const [className, setClassName] = useState('');
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
          delimiter,
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
  }, [input, delimiter]);

  const output = useMemo(
    () => buildHtmlTable(rows, { useHeader, className: className.trim(), indent: '  ' }),
    [rows, useHeader, className],
  );

  const reset = () => {
    setInput('');
    setDelimiter(',');
    setUseHeader(true);
    setClassName('');
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
    triggerDownload(new Blob([output], { type: 'text/html;charset=utf-8' }), 'table.html');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSV → HTML 표" onReset={reset} widthClass="max-w-5xl" />

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Table2 className="h-5 w-5 text-primary" aria-hidden />
            CSV → HTML 표
          </h2>
          <p className="text-sm text-muted-foreground">
            CSV를 &lt;table&gt; HTML 마크업으로 변환합니다. 모든 처리는 브라우저에서 수행됩니다.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">구분자</span>
            {(
              [
                [',', ','],
                [';', ';'],
                ['\t', 'TAB'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDelimiter(value)}
                className={`h-7 rounded-md border px-3 text-[11px] ${
                  delimiter === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={useHeader}
              onChange={(e) => setUseHeader(e.target.checked)}
            />
            첫 행을 헤더(&lt;th&gt;)로
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">class</span>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="예: table"
              className="h-7 w-28 rounded-md border bg-background px-2 text-[11px]"
              aria-label="table class 속성"
            />
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
              <label className="text-xs font-medium" htmlFor="html-output">
                HTML 결과
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
                  HTML
                </button>
              </div>
            </div>
            <textarea
              id="html-output"
              readOnly
              value={output}
              rows={16}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="HTML 결과"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
