'use client';

import { useMemo, useState } from 'react';
import { Link2, Check, Copy, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Pair {
  /** 행을 안정적으로 식별하는 키(렌더용). */
  id: number;
  key: string;
  value: string;
}

function makePair(id: number): Pair {
  return { id, key: '', value: '' };
}

const INITIAL_PAIRS: Pair[] = [makePair(0), makePair(1)];

/** 키가 비어있지 않은 행만 encodeURIComponent 로 인코딩해 쿼리 스트링을 만든다. */
function buildQueryString(pairs: Pair[]): string {
  const parts = pairs
    .filter((pair) => pair.key.trim() !== '')
    .map((pair) => `${encodeURIComponent(pair.key)}=${encodeURIComponent(pair.value)}`);
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

export default function QueryStringBuilderPage() {
  const [pairs, setPairs] = useState<Pair[]>(INITIAL_PAIRS);
  const [nextId, setNextId] = useState(INITIAL_PAIRS.length);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => buildQueryString(pairs), [pairs]);

  function updatePair(id: number, patch: Partial<Pick<Pair, 'key' | 'value'>>) {
    setPairs((prev) => prev.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)));
  }

  function addPair() {
    setPairs((prev) => [...prev, makePair(nextId)]);
    setNextId((id) => id + 1);
  }

  function removePair(id: number) {
    setPairs((prev) => (prev.length > 1 ? prev.filter((pair) => pair.id !== id) : prev));
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setPairs([makePair(nextId), makePair(nextId + 1)]);
    setNextId((id) => id + 2);
    setCopied(false);
  }

  const hasInput = pairs.some((pair) => pair.key.trim() !== '' || pair.value.trim() !== '');

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="쿼리 스트링 빌더" onReset={hasInput ? reset : undefined} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="h-4 w-4 text-primary" aria-hidden />
          키-값 쌍을 URL 쿼리 스트링으로 인코딩합니다.
        </p>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          {pairs.map((pair) => (
            <div key={pair.id} className="flex items-center gap-2">
              <Input
                value={pair.key}
                onChange={(event) => updatePair(pair.id, { key: event.target.value })}
                placeholder="키"
                aria-label="키"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
              <span className="text-muted-foreground">=</span>
              <Input
                value={pair.value}
                onChange={(event) => updatePair(pair.id, { value: event.target.value })}
                placeholder="값"
                aria-label="값"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePair(pair.id)}
                disabled={pairs.length <= 1}
                aria-label="행 삭제"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPair}>
            <Plus className="h-3.5 w-3.5" />행 추가
          </Button>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">쿼리 스트링</span>
            <Button variant="outline" size="sm" onClick={copy} disabled={!output} aria-label="결과 복사">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {output || '키를 입력하면 쿼리 스트링이 표시됩니다.'}
          </pre>
        </div>
      </main>
    </div>
  );
}
