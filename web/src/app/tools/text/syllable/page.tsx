'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

// 영어 단어 1개의 음절 수를 모음 그룹 휴리스틱으로 추정한다.
// 연속 모음은 1음절로 묶고, 끝의 묵음 e 를 제외하며, 최소 1음절을 보장한다.
function countWordSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;

  const groups = cleaned.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 0;

  if (cleaned.length > 2 && cleaned.endsWith('e') && !/[aeiouy]/.test(cleaned[cleaned.length - 2])) {
    count -= 1;
  }

  return Math.max(1, count);
}

interface LineStat {
  text: string;
  words: number;
  syllables: number;
}

interface Analysis {
  totalWords: number;
  totalSyllables: number;
  lines: LineStat[];
}

function analyze(text: string): Analysis {
  const rawLines = text.split('\n');
  const lines: LineStat[] = [];
  let totalWords = 0;
  let totalSyllables = 0;

  for (const raw of rawLines) {
    const words = raw.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? [];
    const syllables = words.reduce((sum, word) => sum + countWordSyllables(word), 0);
    totalWords += words.length;
    totalSyllables += syllables;
    lines.push({ text: raw, words: words.length, syllables });
  }

  return { totalWords, totalSyllables, lines };
}

const HAIKU_PATTERN = [5, 7, 5] as const;

/** 텍스트가 5-7-5 하이쿠 음절 구조에 맞는지 판정한다(빈 줄 제외 3행 기준). */
function checkHaiku(lines: LineStat[]): { matches: boolean; counts: number[] } {
  const nonEmpty = lines.filter((line) => line.text.trim().length > 0);
  const counts = nonEmpty.map((line) => line.syllables);
  const matches =
    counts.length === HAIKU_PATTERN.length &&
    counts.every((count, index) => count === HAIKU_PATTERN[index]);
  return { matches, counts };
}

export default function SyllableCounterPage() {
  const [input, setInput] = useState('');
  const [haikuMode, setHaikuMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => analyze(input), [input]);
  const haiku = useMemo(() => checkHaiku(analysis.lines), [analysis.lines]);

  const hasContent = analysis.totalWords > 0;

  const report = useMemo(() => {
    if (!hasContent) return '';
    return [
      `단어 수: ${analysis.totalWords}`,
      `음절 수: ${analysis.totalSyllables}`,
    ].join('\n');
  }, [analysis, hasContent]);

  async function copy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setInput('');
    setHaikuMode(false);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="음절 카운터" onReset={reset} widthClass="max-w-2xl" />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          영어 텍스트의 음절 수와 단어 수를 셉니다. 모음 그룹 휴리스틱 기반 추정치입니다.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={haikuMode}
            onChange={(e) => setHaikuMode(e.target.checked)}
            className="h-4 w-4"
          />
          하이쿠(5-7-5) 검사 모드
        </label>

        <textarea
          className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="영어 텍스트를 여기에 입력하세요"
          aria-label="입력"
        />

        {!hasContent ? (
          <p className="rounded-xl border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            영어 단어를 입력하면 음절·단어 수가 표시됩니다.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="단어" value={analysis.totalWords.toLocaleString()} />
              <Stat label="음절" value={analysis.totalSyllables.toLocaleString()} />
            </div>

            {haikuMode && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  haiku.matches
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
              >
                <p className="font-medium">
                  {haiku.matches
                    ? '하이쿠 5-7-5 구조에 맞습니다.'
                    : '하이쿠 5-7-5 구조와 다릅니다.'}
                </p>
                <p className="mt-1">
                  행별 음절: {haiku.counts.length > 0 ? haiku.counts.join(' - ') : '(없음)'} · 목표: 5 - 7 - 5
                </p>
              </div>
            )}

            {analysis.lines.filter((l) => l.text.trim().length > 0).length > 1 && (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">행</th>
                      <th className="px-3 py-2 text-right font-medium">단어</th>
                      <th className="px-3 py-2 text-right font-medium">음절</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.lines
                      .filter((line) => line.text.trim().length > 0)
                      .map((line, index) => (
                        <tr key={index} className="border-t">
                          <td className="truncate px-3 py-2 font-mono">{line.text}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{line.words}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{line.syllables}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button onClick={copy} disabled={!report}>
              {copied ? '복사됨' : '결과 복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
