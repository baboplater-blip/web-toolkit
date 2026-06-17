'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

// 결합 분음 기호 범위 U+0300–U+036F (이스케이프로 표기해 인코딩에 무관하게 안전).
const COMBINING_MARKS = /[̀-ͯ]/g;

/** 분해 정규화(NFD) 후 결합 분음 기호를 제거한다. café → cafe */
function removeAccents(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '');
}

export default function RemoveAccentsPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => (input ? removeAccents(input) : ''), [input]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setInput('');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="발음 기호 제거" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          악센트·분음 기호를 제거합니다 (café → cafe).
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-40 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />

        <Button onClick={copy} disabled={!output}>
          {copied ? '복사됨' : '복사'}
        </Button>
      </main>
    </div>
  );
}
