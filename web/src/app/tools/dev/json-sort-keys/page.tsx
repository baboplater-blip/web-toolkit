'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type SortDir = 'asc' | 'desc';

/** 모든 객체 키를 재귀적으로 정렬(배열 내부 객체 포함). */
function sortKeys(value: JsonValue, dir: SortDir): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeys(item, dir));
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort((left, right) => (dir === 'asc' ? left.localeCompare(right) : right.localeCompare(left)))
      .map((key): [string, JsonValue] => [key, sortKeys(value[key], dir)]);
    return Object.fromEntries(entries);
  }
  return value;
}

export default function JsonSortKeysPage() {
  const [input, setInput] = useState('');
  const [dir, setDir] = useState<SortDir>('asc');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null };
    try {
      const parsed = JSON.parse(input) as JsonValue;
      return { output: JSON.stringify(sortKeys(parsed, dir), null, 2), error: null };
    } catch (e) {
      const message = e instanceof SyntaxError ? `JSON 파싱 오류: ${e.message}` : 'JSON 을 정렬할 수 없습니다.';
      return { output: '', error: message };
    }
  }, [input, dir]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
  }

  function reset() {
    setInput('');
    setDir('asc');
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON 키 정렬" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">JSON 객체의 키를 알파벳순으로(중첩·배열 내부 포함) 정렬해 정돈합니다.</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant={dir === 'asc' ? 'default' : 'outline'} onClick={() => setDir('asc')}>
            오름차순
          </Button>
          <Button size="sm" variant={dir === 'desc' ? 'default' : 'outline'} onClick={() => setDir('desc')}>
            내림차순
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"b": 2, "a": 1}'
            aria-label="JSON 입력"
            spellCheck={false}
          />
          <textarea
            className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="정렬 결과"
            aria-label="정렬 결과"
            spellCheck={false}
          />
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button onClick={copy} disabled={!output}>
          {copied ? '복사됨' : '복사'}
        </Button>
      </main>
    </div>
  );
}
