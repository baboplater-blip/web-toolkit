'use client';

import { useMemo, useState } from 'react';
import { Braces } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

interface JsonStats {
  totalKeys: number;
  maxDepth: number;
  arrayCount: number;
  maxArrayLength: number;
  typeCounts: Record<ValueType, number>;
}

function createEmptyStats(): JsonStats {
  return {
    totalKeys: 0,
    maxDepth: 0,
    arrayCount: 0,
    maxArrayLength: 0,
    typeCounts: { string: 0, number: 0, boolean: 0, null: 0, object: 0, array: 0 },
  };
}

/** 단일 값의 타입을 분류한다(null 과 배열을 object 와 구분). */
function classify(value: unknown): ValueType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  return 'object';
}

/**
 * 값을 재귀 분석해 통계를 누적한다.
 * @param depth 현재 노드의 깊이(루트=1).
 */
function walk(value: unknown, depth: number, stats: JsonStats): void {
  if (depth > stats.maxDepth) stats.maxDepth = depth;
  const type = classify(value);
  stats.typeCounts[type] += 1;

  if (type === 'array') {
    const arr = value as unknown[];
    stats.arrayCount += 1;
    if (arr.length > stats.maxArrayLength) stats.maxArrayLength = arr.length;
    for (const item of arr) {
      walk(item, depth + 1, stats);
    }
    return;
  }

  if (type === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    stats.totalKeys += entries.length;
    for (const [, child] of entries) {
      walk(child, depth + 1, stats);
    }
  }
}

interface AnalysisResult {
  ok: boolean;
  stats?: JsonStats;
  error?: string;
}

function analyze(input: string): AnalysisResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? `JSON 파싱 오류: ${e.message}` : 'JSON 을 파싱할 수 없습니다.',
    };
  }
  const stats = createEmptyStats();
  walk(parsed, 1, stats);
  return { ok: true, stats };
}

const TYPE_LABELS: Record<ValueType, string> = {
  string: '문자열 (string)',
  number: '숫자 (number)',
  boolean: '불리언 (boolean)',
  null: '널 (null)',
  object: '객체 (object)',
  array: '배열 (array)',
};

export default function JsonStatsPage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => analyze(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON 구조 분석" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Braces className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          JSON 의 총 키 수·최대 중첩 깊이·배열 통계·값 타입 분포를 분석합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">JSON 입력</span>
          <textarea
            className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "예시", "items": [1, 2, 3]}'
            aria-label="JSON 입력"
          />
        </label>

        {result && !result.ok && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {result.error}
          </div>
        )}

        {result?.ok && result.stats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="총 키 수" value={result.stats.totalKeys} />
              <Stat label="최대 깊이" value={result.stats.maxDepth} />
              <Stat label="배열 개수" value={result.stats.arrayCount} />
              <Stat label="최대 배열 길이" value={result.stats.maxArrayLength} />
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">값 타입 분포</h2>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
                {(Object.keys(TYPE_LABELS) as ValueType[]).map((type) => (
                  <div key={type} className="contents">
                    <dt className="text-muted-foreground">{TYPE_LABELS[type]}</dt>
                    <dd className="text-right font-mono tabular-nums">
                      {result.stats!.typeCounts[type].toLocaleString('ko')}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          모든 분석은 브라우저 안에서만 수행되며, 입력은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString('ko')}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
