'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DelimiterKind = 'comma' | 'tab' | 'space' | 'custom';

const DELIMITERS: Record<Exclude<DelimiterKind, 'custom'>, string> = {
  comma: ',',
  tab: '\t',
  space: ' ',
};

function resolveDelimiter(kind: DelimiterKind, custom: string): string {
  if (kind === 'custom') return custom;
  return DELIMITERS[kind];
}

/** "1,3" 같은 1-based 열 지정 문자열을 0-based 인덱스 배열로 파싱(순서 유지). */
function parseColumnSpec(spec: string): number[] {
  return spec
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => Number.parseInt(part, 10))
    .filter((num) => Number.isInteger(num) && num >= 1)
    .map((num) => num - 1);
}

interface ExtractOptions {
  inputDelimiter: string;
  outputDelimiter: string;
  columns: number[];
  skipHeader: boolean;
}

function extractColumns(input: string, opts: ExtractOptions): string {
  if (!opts.inputDelimiter || opts.columns.length === 0) return '';

  const lines = input.split('\n');
  const dataLines = opts.skipHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const cells = line.split(opts.inputDelimiter);
      return opts.columns
        .map((index) => cells[index] ?? '')
        .join(opts.outputDelimiter);
    })
    .join('\n');
}

export default function ColumnExtractPage() {
  const [input, setInput] = useState('');
  const [inputKind, setInputKind] = useState<DelimiterKind>('comma');
  const [customInputDelim, setCustomInputDelim] = useState('|');
  const [outputKind, setOutputKind] = useState<DelimiterKind>('tab');
  const [customOutputDelim, setCustomOutputDelim] = useState('|');
  const [columnSpec, setColumnSpec] = useState('1,2');
  const [skipHeader, setSkipHeader] = useState(false);
  const [copied, setCopied] = useState(false);

  const columns = useMemo(() => parseColumnSpec(columnSpec), [columnSpec]);
  const inputDelimiter = resolveDelimiter(inputKind, customInputDelim);
  const outputDelimiter = resolveDelimiter(outputKind, customOutputDelim);

  const output = useMemo(
    () =>
      extractColumns(input, {
        inputDelimiter,
        outputDelimiter,
        columns,
        skipHeader,
      }),
    [input, inputDelimiter, outputDelimiter, columns, skipHeader],
  );

  const error =
    input && columns.length === 0
      ? '추출할 열 번호를 1 이상의 숫자로 입력하세요 (예: 1,3).'
      : input && !inputDelimiter
        ? '입력 구분자를 지정하세요.'
        : '';

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 권한 거부·비보안 컨텍스트 등에서 reject 될 수 있어 무시하고 로깅만.
      console.error('[column-extract] 클립보드 복사 실패', err);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'column-extract.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="열 추출" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">구분자로 나뉜 텍스트에서 특정 열만 골라 뽑아냅니다.</p>

      </header>

      <div className="space-y-3 rounded-xl border bg-card p-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2">
            입력 구분자
            <select
              className="rounded-lg border bg-background px-2 py-1 text-sm"
              value={inputKind}
              onChange={(e) => setInputKind(e.target.value as DelimiterKind)}
              aria-label="입력 구분자"
            >
              <option value="comma">콤마 ( , )</option>
              <option value="tab">탭</option>
              <option value="space">스페이스</option>
              <option value="custom">사용자정의</option>
            </select>
          </label>
          {inputKind === 'custom' && (
            <Input
              value={customInputDelim}
              onChange={(e) => setCustomInputDelim(e.target.value)}
              className="w-24"
              aria-label="사용자정의 입력 구분자"
              placeholder="구분자"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2">
            출력 구분자
            <select
              className="rounded-lg border bg-background px-2 py-1 text-sm"
              value={outputKind}
              onChange={(e) => setOutputKind(e.target.value as DelimiterKind)}
              aria-label="출력 구분자"
            >
              <option value="comma">콤마 ( , )</option>
              <option value="tab">탭</option>
              <option value="space">스페이스</option>
              <option value="custom">사용자정의</option>
            </select>
          </label>
          {outputKind === 'custom' && (
            <Input
              value={customOutputDelim}
              onChange={(e) => setCustomOutputDelim(e.target.value)}
              className="w-24"
              aria-label="사용자정의 출력 구분자"
              placeholder="구분자"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2">
            추출할 열 (1부터)
            <Input
              value={columnSpec}
              onChange={(e) => setColumnSpec(e.target.value)}
              className="w-32"
              aria-label="추출할 열 번호"
              placeholder="예: 1,3"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={skipHeader}
              onChange={(e) => setSkipHeader(e.target.checked)}
            />
            헤더 줄 건너뛰기
          </label>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>
          {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>다운로드</Button>
      </div>
    </main>
    </div>
  );
}
