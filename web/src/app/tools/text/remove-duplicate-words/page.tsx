'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface DedupeResult {
  text: string;
  removed: number;
}

/**
 * 반복되는 단어를 첫 등장만 남기고 제거한다.
 * 단어와 단어 사이의 구분자(공백·줄바꿈·구두점)는 원본 그대로 보존한다.
 * 단어 토큰(\p{L}\p{N}_ 연속)만 중복 판정 대상으로 본다.
 */
function removeDuplicateWords(input: string, ignoreCase: boolean): DedupeResult {
  // 단어 토큰과 비단어(구분자) 토큰을 교대로 추출.
  const tokens = input.match(/[\p{L}\p{N}_]+|[^\p{L}\p{N}_]+/gu);
  if (!tokens) return { text: '', removed: 0 };

  const seen = new Set<string>();
  const out: string[] = [];
  let removed = 0;
  // 직전에 제거된 단어 뒤에 따라오는 구분자도 함께 버려 이중 공백을 막는다.
  let dropNextSeparator = false;

  for (const token of tokens) {
    const isWord = /^[\p{L}\p{N}_]+$/u.test(token);

    if (!isWord) {
      if (dropNextSeparator) {
        dropNextSeparator = false;
        continue;
      }
      out.push(token);
      continue;
    }

    const key = ignoreCase ? token.toLowerCase() : token;
    if (seen.has(key)) {
      removed += 1;
      dropNextSeparator = true;
      continue;
    }
    seen.add(key);
    dropNextSeparator = false;
    out.push(token);
  }

  return { text: out.join(''), removed };
}

export default function RemoveDuplicateWordsPage() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo<DedupeResult>(
    () => (input ? removeDuplicateWords(input, ignoreCase) : { text: '', removed: 0 }),
    [input, ignoreCase],
  );

  function reset() {
    setInput('');
    setCopied(false);
  }

  async function copy() {
    if (!result.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remove-duplicate-words.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="중복 단어 제거" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          반복되는 단어를 첫 등장만 남기고 제거합니다. 단어 사이의 구두점·줄바꿈은 보존됩니다.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            대소문자 무시
          </label>
          <span className="text-muted-foreground">제거된 단어: {result.removed}개</span>
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
            value={result.text}
            readOnly
            placeholder="결과"
            aria-label="결과"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!result.text}>
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!result.text}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
