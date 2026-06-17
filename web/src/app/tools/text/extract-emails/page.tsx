'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

// RFC 5322 의 실용적 근사 — 한 줄에 하나, 대부분의 일반 이메일을 포착한다.
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export default function ExtractEmailsPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const emails = useMemo(() => {
    if (!input) return [] as string[];
    const matches = input.match(EMAIL_RE) ?? [];
    const unique = Array.from(new Set(matches.map((m) => m.toLowerCase())));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [input]);

  const output = emails.join('\n');

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
      <ToolHeader title="이메일 추출" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트에서 이메일 주소를 모두 추출해 중복을 제거하고 정렬합니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        <p className="text-sm text-muted-foreground">
          {emails.length}개 발견
        </p>

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
