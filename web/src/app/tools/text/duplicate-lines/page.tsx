'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/** 입력 상한(문자) — 초과분은 잘라내고 안내한다. */
const MAX_INPUT_LENGTH = 500_000;

interface DuplicateRow {
  /** 화면에 보여줄 대표 줄(원본 첫 등장 형태) */
  line: string;
  count: number;
}

/**
 * 2번 이상 등장한 줄만 빈도 내림차순으로 추린다.
 * ignoreCase / trimWhitespace 옵션에 따라 비교 키를 정규화하되,
 * 표시는 정규화 이전의 첫 등장 원본을 사용한다.
 */
function findDuplicateLines(
  input: string,
  ignoreCase: boolean,
  trimWhitespace: boolean,
): DuplicateRow[] {
  if (!input) return [];

  const counts = new Map<string, { display: string; count: number }>();

  for (const rawLine of input.split('\n')) {
    let key = rawLine;
    if (trimWhitespace) key = key.replace(/\s+/g, ' ').trim();
    if (ignoreCase) key = key.toLowerCase();

    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { display: rawLine, count: 1 });
    }
  }

  return Array.from(counts.values())
    .filter((entry) => entry.count >= 2)
    .map((entry) => ({ line: entry.display, count: entry.count }))
    .sort((a, b) => b.count - a.count || a.line.localeCompare(b.line, 'ko'));
}

export default function DuplicateLinesPage() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(false);
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);
  const overLimit = deferredInput.length > MAX_INPUT_LENGTH;

  const rows = useMemo(
    () =>
      findDuplicateLines(
        overLimit ? deferredInput.slice(0, MAX_INPUT_LENGTH) : deferredInput,
        ignoreCase,
        trimWhitespace,
      ),
    [deferredInput, overLimit, ignoreCase, trimWhitespace],
  );

  const maxCount = rows.length > 0 ? rows[0].count : 0;

  function reset() {
    setInput('');
    setIgnoreCase(false);
    setTrimWhitespace(false);
  }

  async function copyResult() {
    if (rows.length === 0) return;
    const text = rows.map((row) => `${row.count}\t${row.line}`).join('\n');
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="중복 줄 찾기" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트에서 2번 이상 나타난 줄만 골라 빈도순으로 보여줍니다. (고유한 줄은 제외)
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 텍스트를 입력하세요 (한 줄에 한 항목)"
          aria-label="입력"
        />

        {overLimit && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            입력이 {MAX_INPUT_LENGTH.toLocaleString()}자를 초과해 앞부분만 분석합니다.
          </p>
        )}

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
              checked={trimWhitespace}
              onChange={(e) => setTrimWhitespace(e.target.checked)}
            />
            앞뒤·중복 공백 무시
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" role="status">
              중복 줄 <span className="font-medium text-foreground">{rows.length}</span>종
            </p>
            <Button variant="outline" size="sm" onClick={copyResult} disabled={rows.length === 0}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              결과 복사
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              {input ? '중복된 줄이 없습니다.' : '분석할 텍스트를 입력하세요.'}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">줄</th>
                    <th className="w-40 px-3 py-2 font-medium">빈도</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.line}-${index}`} className="border-t">
                      <td className="px-3 py-1.5 text-muted-foreground">{index + 1}</td>
                      <td className="break-all px-3 py-1.5 font-mono">
                        {row.line === '' ? (
                          <span className="text-muted-foreground">(빈 줄)</span>
                        ) : (
                          row.line
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary"
                              style={{ width: maxCount ? `${(row.count / maxCount) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="w-8 text-right tabular-nums">{row.count}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
