'use client';

import { useMemo, useState } from 'react';
import { Database, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type QuoteMode = 'string' | 'numeric';

/** 줄바꿈·콤마로 분리, 트림, 빈 값 제거. */
function splitValues(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter((value) => value !== '');
}

/** 작은따옴표 SQL 이스케이프: ' → ''. */
function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

interface BuildOptions {
  quoteMode: QuoteMode;
  dedupe: boolean;
  column: string;
}

function buildInClause(raw: string, options: BuildOptions): string {
  let values = splitValues(raw);
  if (options.dedupe) {
    values = Array.from(new Set(values));
  }
  if (values.length === 0) return '';

  const rendered = values
    .map((value) => (options.quoteMode === 'string' ? quoteString(value) : value))
    .join(', ');
  const clause = `IN (${rendered})`;
  const column = options.column.trim();
  return column ? `${column} ${clause}` : clause;
}

export default function SqlInClausePage() {
  const [input, setInput] = useState('');
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('string');
  const [dedupe, setDedupe] = useState(true);
  const [column, setColumn] = useState('');
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => buildInClause(input, { quoteMode, dedupe, column }),
    [input, quoteMode, dedupe, column],
  );

  const valueCount = useMemo(() => {
    const values = splitValues(input);
    return dedupe ? new Set(values).size : values.length;
  }, [input, dedupe]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setInput('');
    setQuoteMode('string');
    setDedupe(true);
    setColumn('');
    setCopied(false);
  }

  const hasInput = input.trim() !== '' || column.trim() !== '';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="SQL IN 절 생성" onReset={hasInput ? reset : undefined} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4 text-primary" aria-hidden />
          줄바꿈·콤마로 구분된 값을 SQL IN (...) 절로 변환합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">값 목록</span>
          <textarea
            className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'apple\nbanana\ncherry\n또는 콤마로 구분'}
            aria-label="값 목록"
            spellCheck={false}
          />
        </label>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium">따옴표</span>
              <select
                value={quoteMode}
                onChange={(event) => setQuoteMode(event.target.value as QuoteMode)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                aria-label="따옴표 모드"
              >
                <option value="string">문자열 (작은따옴표)</option>
                <option value="numeric">숫자 (따옴표 없음)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dedupe}
                onChange={(event) => setDedupe(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="font-medium">중복 제거</span>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">컬럼명 (선택)</span>
            <Input
              value={column}
              onChange={(event) => setColumn(event.target.value)}
              placeholder="예: user_id"
              aria-label="컬럼명"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">결과 · {valueCount}개 값</span>
            <Button variant="outline" size="sm" onClick={copy} disabled={!output} aria-label="결과 복사">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {output || '값을 입력하면 IN 절이 표시됩니다.'}
          </pre>
        </div>
      </main>
    </div>
  );
}
