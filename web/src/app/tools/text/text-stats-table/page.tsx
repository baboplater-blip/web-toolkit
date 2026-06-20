'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/** 입력 상한(문자) — 초과분은 잘라내고 안내한다. */
const MAX_INPUT_LENGTH = 500_000;
/** 표에 렌더링할 최대 줄 수 — 초과분은 통계에만 반영하고 표는 잘라 보여준다. */
const MAX_TABLE_ROWS = 2_000;

interface LineStat {
  index: number;
  chars: number;
  words: number;
  text: string;
}

interface StatsSummary {
  lines: LineStat[];
  totalLines: number;
  totalWords: number;
  totalChars: number;
  longest: number;
  shortest: number;
  average: number;
}

/** 공백 기준 단어 수 — 빈 줄은 0으로 친다. */
function countWords(line: string): number {
  const trimmed = line.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** 코드 포인트 기준 문자 수 — 이모지·결합 문자를 한 글자로 본다. */
function countChars(line: string): number {
  return Array.from(line).length;
}

function buildStats(input: string): StatsSummary {
  const rawLines = input.split('\n');
  const lines: LineStat[] = rawLines.map((text, i) => ({
    index: i + 1,
    chars: countChars(text),
    words: countWords(text),
    text,
  }));

  let totalWords = 0;
  let totalChars = 0;
  let longest = 0;
  let shortest = lines.length > 0 ? Number.POSITIVE_INFINITY : 0;

  for (const line of lines) {
    totalWords += line.words;
    totalChars += line.chars;
    if (line.chars > longest) longest = line.chars;
    if (line.chars < shortest) shortest = line.chars;
  }

  if (!Number.isFinite(shortest)) shortest = 0;
  const average = lines.length > 0 ? totalChars / lines.length : 0;

  return {
    lines,
    totalLines: lines.length,
    totalWords,
    totalChars,
    longest,
    shortest,
    average,
  };
}

function toTsv(summary: StatsSummary): string {
  const header = '줄\t문자수\t단어수\t내용';
  const body = summary.lines
    .map((line) => `${line.index}\t${line.chars}\t${line.words}\t${line.text}`)
    .join('\n');
  return `${header}\n${body}`;
}

export default function TextStatsTablePage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const deferredInput = useDeferredValue(input);
  const overLimit = deferredInput.length > MAX_INPUT_LENGTH;

  const summary = useMemo(
    () => buildStats(overLimit ? deferredInput.slice(0, MAX_INPUT_LENGTH) : deferredInput),
    [deferredInput, overLimit],
  );

  const visibleLines = useMemo(
    () => summary.lines.slice(0, MAX_TABLE_ROWS),
    [summary.lines],
  );

  const truncatedTable = summary.lines.length > visibleLines.length;

  function reset() {
    setInput('');
  }

  async function copyTsv() {
    if (summary.lines.length === 0) return;
    await navigator.clipboard?.writeText(toTsv(summary));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const hasInput = input.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="줄별 길이 통계" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          각 줄의 문자·단어 수를 표로 보여주고, 최장·최단·평균 줄 길이와 전체 합계를 산출합니다.
        </p>

        <textarea
          className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 텍스트를 입력하세요"
          aria-label="입력"
        />

        {overLimit && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            입력이 {MAX_INPUT_LENGTH.toLocaleString()}자를 초과해 앞부분만 분석합니다.
          </p>
        )}

        {!hasInput ? (
          <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            분석할 텍스트를 입력하세요.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="status">
              <SummaryCard label="총 줄 수" value={summary.totalLines.toLocaleString()} />
              <SummaryCard label="총 단어 수" value={summary.totalWords.toLocaleString()} />
              <SummaryCard label="총 문자 수" value={summary.totalChars.toLocaleString()} />
              <SummaryCard label="최장 줄(자)" value={summary.longest.toLocaleString()} />
              <SummaryCard label="최단 줄(자)" value={summary.shortest.toLocaleString()} />
              <SummaryCard label="평균 줄(자)" value={summary.average.toFixed(1)} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {truncatedTable
                  ? `표는 처음 ${MAX_TABLE_ROWS.toLocaleString()}줄만 표시합니다.`
                  : ' '}
              </p>
              <Button variant="outline" size="sm" onClick={copyTsv}>
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                표 복사(TSV)
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-14 px-3 py-2 font-medium">줄</th>
                    <th className="w-20 px-3 py-2 font-medium">문자</th>
                    <th className="w-20 px-3 py-2 font-medium">단어</th>
                    <th className="px-3 py-2 font-medium">내용</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLines.map((line) => (
                    <tr key={line.index} className="border-t">
                      <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{line.index}</td>
                      <td className="px-3 py-1.5 tabular-nums">{line.chars}</td>
                      <td className="px-3 py-1.5 tabular-nums">{line.words}</td>
                      <td className="max-w-0 truncate px-3 py-1.5 font-mono text-muted-foreground">
                        {line.text === '' ? <span className="italic">(빈 줄)</span> : line.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
