'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

// http(s):// 또는 www. 로 시작하는 URL. 끝의 문장부호(., , ) ] } 등)는 제외한다.
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

/** URL 뒤에 흔히 붙는 문장 부호를 잘라낸다. */
function trimTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)\]}'"]+$/, '');
}

export default function ExtractUrlsPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const urls = useMemo(() => {
    if (!input) return [] as string[];
    const matches = input.match(URL_RE) ?? [];
    const cleaned = matches.map(trimTrailingPunctuation).filter(Boolean);
    return Array.from(new Set(cleaned));
  }, [input]);

  const output = urls.join('\n');

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
      <ToolHeader title="URL 추출" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트에서 URL·링크를 모두 추출해 중복을 제거합니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        <p className="text-sm text-muted-foreground">{urls.length}개 발견</p>

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
