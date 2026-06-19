'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'smart' | 'straight';

const LDQUO = '“'; // “
const RDQUO = '”'; // ”
const LSQUO = '‘'; // ‘
const RSQUO = '’'; // ’

/** 여는 따옴표로 판정할 직전 문자(공백류·여는 괄호류). 빈 문자열은 문자열 시작을 의미한다. */
function isOpeningContext(prev: string): boolean {
  if (prev === '') return true;
  return /[\s([{<—–-]/.test(prev);
}

/**
 * 곧은 따옴표(' ")를 활자체 둥근 따옴표로 변환한다.
 * - 직전 문자가 공백/시작/여는 괄호이면 여는 따옴표(“ ‘), 아니면 닫는 따옴표(” ’)
 * - 단어 중간/뒤의 어퍼스트로피(축약형·소유격)는 닫는 작은따옴표(’)로 처리된다.
 */
function toSmartQuotes(input: string): string {
  let result = '';
  let prev = '';
  for (const ch of input) {
    if (ch === '"') {
      result += isOpeningContext(prev) ? LDQUO : RDQUO;
    } else if (ch === "'") {
      result += isOpeningContext(prev) ? LSQUO : RSQUO;
    } else {
      result += ch;
    }
    prev = ch;
  }
  return result;
}

/** 둥근 따옴표를 곧은 따옴표로 되돌린다. */
function toStraightQuotes(input: string): string {
  return input
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

export default function SmartQuotesPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('smart');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'smart' ? toSmartQuotes(input) : toStraightQuotes(input);
  }, [input, mode]);

  function reset() {
    setInput('');
    setMode('smart');
    setCopied(false);
  }

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

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-quotes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="스마트 따옴표 변환" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          곧은 따옴표 ↔ 둥근(스마트) 따옴표를 변환합니다.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={mode === 'smart' ? 'default' : 'outline'}
            onClick={() => setMode('smart')}
          >
            스마트 따옴표로
          </Button>
          <Button
            size="sm"
            variant={mode === 'straight' ? 'default' : 'outline'}
            onClick={() => setMode('straight')}
          >
            곧은 따옴표로
          </Button>
        </div>

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
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!output}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
