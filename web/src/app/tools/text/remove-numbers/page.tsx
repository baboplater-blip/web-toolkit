'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const ASCII_DIGITS = /[0-9]+/g;
const UNICODE_DIGITS = /\p{Nd}+/gu;
const MULTI_SPACE = /[^\S\r\n]{2,}/g;

/**
 * 텍스트에서 숫자를 제거한다.
 * - unicodeDigits 가 켜져 있으면 \p{Nd}(전 세계 십진 숫자)까지, 아니면 ASCII 0-9 만 제거
 * - collapseSpaces 가 켜져 있으면 제거 후 생긴 연속 공백(개행 제외)을 하나로 합친다.
 */
function removeNumbers(input: string, unicodeDigits: boolean, collapseSpaces: boolean): string {
  let text = input.replace(unicodeDigits ? UNICODE_DIGITS : ASCII_DIGITS, '');
  if (collapseSpaces) {
    text = text.replace(MULTI_SPACE, ' ');
  }
  return text;
}

export default function RemoveNumbersPage() {
  const [input, setInput] = useState('');
  const [unicodeDigits, setUnicodeDigits] = useState(false);
  const [collapseSpaces, setCollapseSpaces] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => (input ? removeNumbers(input, unicodeDigits, collapseSpaces) : ''),
    [input, unicodeDigits, collapseSpaces],
  );

  function reset() {
    setInput('');
    setUnicodeDigits(false);
    setCollapseSpaces(false);
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
    a.download = 'remove-numbers.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="숫자 제거" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">텍스트에서 모든 숫자를 제거합니다.</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={unicodeDigits}
              onChange={(e) => setUnicodeDigits(e.target.checked)}
            />
            유니코드 숫자 포함 (전각·아랍어 등)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={collapseSpaces}
              onChange={(e) => setCollapseSpaces(e.target.checked)}
            />
            공백 정리 (연속 공백 합치기)
          </label>
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
