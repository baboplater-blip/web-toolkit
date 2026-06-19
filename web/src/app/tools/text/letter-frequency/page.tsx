'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface FrequencyRow {
  char: string;
  count: number;
  percent: number;
}

interface FrequencyResult {
  rows: FrequencyRow[];
  total: number;
}

/**
 * 글자별 출현 빈도를 집계한다.
 * 기본은 a–z 알파벳만(대소문자 무시), 옵션에 따라 숫자/공백도 포함한다.
 */
function analyze(input: string, ignoreCase: boolean, includeDigits: boolean): FrequencyResult {
  const counts = new Map<string, number>();
  let total = 0;

  for (const rawChar of input) {
    let char = rawChar;
    const isLetter = /^[a-zA-Z]$/.test(char);
    const isDigit = /^[0-9]$/.test(char);

    if (isLetter) {
      if (ignoreCase) char = char.toLowerCase();
    } else if (isDigit) {
      if (!includeDigits) continue;
    } else {
      // 글자도 숫자도 아니면 집계 대상 아님.
      continue;
    }

    counts.set(char, (counts.get(char) ?? 0) + 1);
    total += 1;
  }

  const rows: FrequencyRow[] = Array.from(counts.entries())
    .map(([char, count]) => ({
      char,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    // 빈도 내림차순, 동률은 글자 오름차순.
    .sort((a, b) => b.count - a.count || a.char.localeCompare(b.char));

  return { rows, total };
}

export default function LetterFrequencyPage() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo<FrequencyResult>(
    () => (input ? analyze(input, ignoreCase, includeDigits) : { rows: [], total: 0 }),
    [input, ignoreCase, includeDigits],
  );

  const tableText = useMemo(
    () =>
      result.rows
        .map((row) => `${row.char}\t${row.count}\t${row.percent.toFixed(2)}%`)
        .join('\n'),
    [result],
  );

  function reset() {
    setInput('');
    setCopied(false);
  }

  async function copy() {
    if (!tableText) return;
    try {
      await navigator.clipboard.writeText(tableText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function download() {
    const blob = new Blob([tableText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'letter-frequency.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="글자 빈도 분석" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트의 글자별 출현 빈도와 비율을 집계합니다. 기본은 영문 알파벳만 셉니다.
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeDigits}
              onChange={(e) => setIncludeDigits(e.target.checked)}
            />
            숫자 포함
          </label>
          <span className="text-muted-foreground">전체 글자 수: {result.total}</span>
        </div>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        {result.rows.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="w-16 px-3 py-2 font-medium">글자</th>
                  <th className="w-20 px-3 py-2 font-medium">개수</th>
                  <th className="px-3 py-2 font-medium">비율</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.char} className="border-b last:border-0">
                    <td className="px-3 py-1.5 font-mono">{row.char}</td>
                    <td className="px-3 py-1.5 font-mono">{row.count}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
                          {row.percent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
            집계할 글자가 없습니다.
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!tableText}>
            {copied ? '복사됨' : '복사'}
          </Button>
          <Button variant="outline" onClick={download} disabled={!tableText}>
            다운로드
          </Button>
        </div>
      </main>
    </div>
  );
}
