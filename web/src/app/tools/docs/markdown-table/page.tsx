'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Table } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Align = 'left' | 'center' | 'right';
type Delimiter = 'tab' | 'comma';

const SAMPLE = `이름\t나이\t도시
앨리스\t30\t서울
밥\t25\t부산`;

/** 정렬 옵션별 헤더 구분선 셀(`---`, `:--`, `:-:`, `--:`). */
function dividerCell(align: Align): string {
  switch (align) {
    case 'left':
      return ':---';
    case 'center':
      return ':---:';
    case 'right':
      return '---:';
  }
}

/** 마크다운 셀 안에서 의미를 갖는 파이프(|)를 이스케이프한다. */
function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').trim();
}

/**
 * 구분 문자열로 한 줄을 셀 배열로 나눈다.
 * @param line 원본 한 줄.
 * @param delimiter 'tab' 이면 탭, 'comma' 이면 쉼표 기준.
 */
function splitRow(line: string, delimiter: Delimiter): string[] {
  const sep = delimiter === 'tab' ? '\t' : ',';
  return line.split(sep).map(escapeCell);
}

/**
 * 입력 텍스트를 2차원 셀 배열로 파싱한다.
 * 빈 줄은 제외하고, 가장 긴 행 기준으로 열 수를 맞춘다(부족분은 빈 셀).
 */
function parseRows(input: string, delimiter: Delimiter): string[][] {
  const lines = input.split(/\r?\n/).filter((line) => line.trim() !== '');
  const rows = lines.map((line) => splitRow(line, delimiter));
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    const padded = [...row];
    while (padded.length < columnCount) padded.push('');
    return padded;
  });
}

/** 한 행의 셀을 마크다운 행 문자열(`| a | b |`)로 만든다. */
function renderRow(cells: string[]): string {
  return `| ${cells.map((cell) => cell || ' ').join(' | ')} |`;
}

/**
 * 파싱된 행들과 정렬 설정으로 GitHub 마크다운 표를 만든다.
 * 첫 행을 헤더로 사용하고, 그 아래에 정렬 구분선을 넣는다.
 */
function buildMarkdownTable(rows: string[][], aligns: Align[]): string {
  if (rows.length === 0) return '';
  const columnCount = rows[0].length;
  const header = rows[0];
  const body = rows.slice(1);

  const divider = Array.from({ length: columnCount }, (_, index) =>
    dividerCell(aligns[index] ?? 'left'),
  );

  const lines = [renderRow(header), `| ${divider.join(' | ')} |`];
  for (const row of body) {
    lines.push(renderRow(row));
  }
  return lines.join('\n');
}

export default function MarkdownTableGenPage() {
  const [input, setInput] = useState(SAMPLE);
  const [delimiter, setDelimiter] = useState<Delimiter>('tab');
  const [alignMode, setAlignMode] = useState<Align>('left');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => parseRows(input, delimiter), [input, delimiter]);
  const columnCount = rows[0]?.length ?? 0;

  const aligns = useMemo<Align[]>(
    () => Array.from({ length: columnCount }, () => alignMode),
    [columnCount, alignMode],
  );

  const output = useMemo(() => buildMarkdownTable(rows, aligns), [rows, aligns]);

  const reset = () => {
    setInput('');
    setDelimiter('tab');
    setAlignMode('left');
    setShowPreview(false);
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

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="마크다운 표 생성기" onReset={reset} />

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <header className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Table className="h-5 w-5 text-primary" aria-hidden />
            마크다운 표 생성기
          </h2>
          <p className="text-sm text-muted-foreground">
            탭 또는 쉼표로 구분한 데이터를 GitHub 마크다운 표로 변환합니다. 첫 행은 헤더로 사용됩니다.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">구분자</span>
            {(
              [
                ['tab', 'TAB'],
                ['comma', '쉼표'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
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

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">열 정렬</span>
            {(
              [
                ['left', '좌'],
                ['center', '중'],
                ['right', '우'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAlignMode(value)}
                className={`h-7 rounded-md border px-3 text-[11px] ${
                  alignMode === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="ml-auto flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
            />
            미리보기
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <label className="text-xs font-medium" htmlFor="md-table-input">
              입력 데이터
            </label>
            <textarea
              id="md-table-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={14}
              spellCheck={false}
              placeholder={'헤더1\t헤더2\n값1\t값2'}
              className="w-full resize-y rounded-lg border bg-background px-2.5 py-2 font-mono text-xs"
              aria-label="입력 데이터"
            />
          </div>

          <div className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor="md-table-output">
                마크다운 결과
              </label>
              <button
                type="button"
                onClick={copy}
                disabled={!output}
                className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] hover:bg-muted disabled:opacity-50"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <textarea
              id="md-table-output"
              readOnly
              value={output}
              rows={14}
              className="w-full resize-y rounded-lg border bg-muted px-2.5 py-2 font-mono text-xs"
              aria-label="마크다운 결과"
            />
          </div>
        </div>

        {showPreview && output && (
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <span className="text-xs font-medium">미리보기</span>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {rows[0].map((cell, index) => (
                      <th
                        key={index}
                        style={{ textAlign: aligns[index] ?? 'left' }}
                        className="border bg-muted px-3 py-1.5 font-semibold"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          style={{ textAlign: aligns[colIndex] ?? 'left' }}
                          className="border px-3 py-1.5"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
