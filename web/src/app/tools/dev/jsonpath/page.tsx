'use client';

import { useMemo, useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_JSON = `{
  "store": {
    "book": [
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "price": 8.99 },
      { "category": "fiction", "author": "J.R.R. Tolkien", "title": "The Lord of the Rings", "price": 22.99 },
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings", "price": 8.95 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`;

const EXAMPLES = [
  { path: '$.store.book[*].title', desc: '모든 책 제목' },
  { path: '$..price', desc: '모든 가격 (재귀)' },
  { path: '$.store.book[?(@.price < 10)]', desc: '10달러 미만 책' },
  { path: '$.store.book[-1:]', desc: '마지막 책' },
  { path: '$..book[0,1]', desc: '처음 두 권' },
];

export default function JsonPathPage() {
  const [json, setJson] = useState(DEFAULT_JSON);
  const [path, setPath] = useState('$.store.book[*].title');
  const [copied, setCopied] = useState(false);

  const { result, error } = useMemo(() => {
    if (!json.trim() || !path.trim()) return { result: '', error: null };
    try {
      const obj = JSON.parse(json);
      // jsonpath-plus 는 dynamic import 불가능 (top-level export 가 객체)
      // 그러므로 동기 import 시 lazy 안 됨. 여기서는 require 비슷한 방식 X
      // — 그냥 useEffect 로 비동기 처리하기보다 evaluator 함수로 호출.
      // jsonpath-plus 는 require 없이 named export 됨
      const mod = require('jsonpath-plus') as { JSONPath: (opts: { path: string; json: unknown }) => unknown[] };
      const out = mod.JSONPath({ path, json: obj });
      return { result: JSON.stringify(out, null, 2), error: null };
    } catch (e) {
      return { result: '', error: e instanceof Error ? e.message : '오류' };
    }
  }, [json, path]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <h1 className="text-xl font-semibold">JSONPath 테스터</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          JSONPath 표현식으로 JSON 의 특정 값을 추출합니다 — 실시간 평가.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium">JSON</label>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-xs font-mono h-48 leading-relaxed" aria-label="JSON" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">JSONPath 표현식</label>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" aria-label="JSONPath 표현식" />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.path}
              onClick={() => setPath(ex.path)}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] hover:bg-muted/70"
              title={ex.desc}
            >
              {ex.path}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">결과</label>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea readOnly value={result} className="w-full rounded-md border bg-card p-3 text-xs font-mono h-48 leading-relaxed" aria-label="결과" />
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">JSONPath 빠른 가이드</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li><code>$</code> 루트, <code>.field</code> 속성, <code>[*]</code> 모든 요소</li>
          <li><code>..</code> 재귀 탐색, <code>[?(@.x &gt; 5)]</code> 필터</li>
          <li><code>[0,1,2]</code> 다중 인덱스, <code>[-1:]</code> 마지막</li>
        </ul>
      </div>
    </main>
  );
}
