'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface DedupeResult {
  text: string;
  removed: number;
}

function dedupeLines(
  input: string,
  ignoreCase: boolean,
  trimEnds: boolean,
  sortLines: boolean,
): DedupeResult {
  const lines = input.split('\n');
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const line of lines) {
    const base = trimEnds ? line.trim() : line;
    const key = ignoreCase ? base.toLowerCase() : base;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(base);
  }

  if (sortLines) {
    kept.sort((a, b) => a.localeCompare(b, 'ko'));
  }

  return { text: kept.join('\n'), removed: lines.length - kept.length };
}

export default function DedupeLinesPage() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trimEnds, setTrimEnds] = useState(false);
  const [sortLines, setSortLines] = useState(false);

  const result = useMemo(
    () => dedupeLines(input, ignoreCase, trimEnds, sortLines),
    [input, ignoreCase, trimEnds, sortLines],
  );

  const output = result.text;

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dedupe-lines.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="중복 줄 제거" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">여러 줄 텍스트에서 중복된 줄을 제거하고 순서를 유지합니다.</p>

      </header>

      <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={ignoreCase}
            onChange={(e) => setIgnoreCase(e.target.checked)}
          />
          대소문자 무시
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={trimEnds}
            onChange={(e) => setTrimEnds(e.target.checked)}
          />
          양끝 공백 무시
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={sortLines}
            onChange={(e) => setSortLines(e.target.checked)}
          />
          정렬
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

      {input && (
        <p className="text-sm text-muted-foreground" role="status">
          제거된 줄: <span className="font-medium text-foreground">{result.removed}</span>개
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>복사</Button>
        <Button variant="outline" onClick={download} disabled={!output}>다운로드</Button>
      </div>
    </main>
    </div>
  );
}
