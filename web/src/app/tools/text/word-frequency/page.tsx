'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STOPWORDS: ReadonlySet<string> = new Set([
  // 영어
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on',
  'at', 'for', 'with', 'as', 'by', 'is', 'are', 'was', 'were', 'be',
  'been', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'not', 'no', 'do', 'does', 'did', 'so', 'if',
  'then', 'than', 'too', 'very', 'can', 'will', 'just', 'from', 'up', 'out',
  // 한국어
  '그리고', '그러나', '하지만', '그래서', '또한', '또는', '그런데', '즉', '및', '등',
  '이', '그', '저', '것', '수', '때', '말', '거', '안', '못',
  '의', '가', '을', '를', '에', '와', '과', '로', '으로', '도',
]);

interface WordCount {
  word: string;
  count: number;
}

function tokenize(input: string): string[] {
  const matches = input.match(/[\p{L}\p{N}']+/gu);
  return matches ?? [];
}

function buildFrequency(
  input: string,
  ignoreCase: boolean,
  minLength: number,
  removeStopwords: boolean,
): WordCount[] {
  const counts = new Map<string, { display: string; count: number }>();

  for (const raw of tokenize(input)) {
    if (raw.length < minLength) continue;
    const key = ignoreCase ? raw.toLowerCase() : raw;
    if (removeStopwords && STOPWORDS.has(key.toLowerCase())) continue;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { display: key, count: 1 });
    }
  }

  return Array.from(counts.values())
    .map((entry) => ({ word: entry.display, count: entry.count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'ko'));
}

function toCsv(rows: WordCount[]): string {
  const escape = (value: string): string =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const header = 'word,count';
  const body = rows.map((row) => `${escape(row.word)},${row.count}`).join('\n');
  return `${header}\n${body}`;
}

export default function WordFrequencyPage() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [minLength, setMinLength] = useState(1);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [topN, setTopN] = useState(20);
  const [copied, setCopied] = useState(false);

  const allRows = useMemo(
    () => buildFrequency(input, ignoreCase, Math.max(1, minLength), removeStopwords),
    [input, ignoreCase, minLength, removeStopwords],
  );

  const visibleRows = useMemo(
    () => allRows.slice(0, topN),
    [allRows, topN],
  );

  const maxCount = visibleRows.length > 0 ? visibleRows[0].count : 0;

  async function copyCsv() {
    if (allRows.length === 0) return;
    await navigator.clipboard?.writeText(toCsv(allRows));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <ListOrdered className="h-5 w-5 text-primary" aria-hidden />
          단어 빈도 분석
        </h1>
        <p className="text-sm text-muted-foreground">텍스트에서 단어별 출현 횟수를 세어 빈도순으로 보여줍니다.</p>
      </header>

      <textarea
        className="min-h-40 w-full rounded-xl border bg-card p-3 font-mono text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="분석할 텍스트를 입력하세요"
        aria-label="입력"
      />

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
            checked={removeStopwords}
            onChange={(e) => setRemoveStopwords(e.target.checked)}
          />
          불용어 제거
        </label>
        <label className="flex items-center gap-2">
          최소 길이
          <Input
            type="number"
            min={1}
            max={20}
            value={minLength}
            onChange={(e) => setMinLength(Math.max(1, Number(e.target.value) || 1))}
            className="w-16"
            aria-label="최소 단어 길이"
          />
        </label>
      </div>

      <div className="rounded-xl border bg-card p-3 text-sm">
        <label className="flex items-center gap-3">
          <span className="whitespace-nowrap">상위 {topN}개</span>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="flex-1"
            aria-label="표시할 상위 단어 개수"
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" role="status">
            고유 단어 <span className="font-medium text-foreground">{allRows.length}</span>개
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={copyCsv}
            disabled={allRows.length === 0}
          >
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            CSV 복사
          </Button>
        </div>

        {visibleRows.length === 0 ? (
          <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            분석할 단어가 없습니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">단어</th>
                  <th className="w-40 px-3 py-2 font-medium">빈도</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={row.word} className="border-t">
                    <td className="px-3 py-1.5 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-1.5 font-mono break-all">{row.word}</td>
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
  );
}
