'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { jsonToTypeScript } from '@/lib/tools/json-to-ts-convert';
import { ToolHeader } from '@/components/tools/ToolHeader';

const SAMPLE = `{
  "id": 42,
  "name": "Ada",
  "active": true,
  "roles": ["admin", "editor"],
  "profile": { "age": 30, "city": null }
}`;

export default function JsonToTsPage() {
  const [input, setInput] = useState(SAMPLE);
  const [rootName, setRootName] = useState('Root');
  const [copied, setCopied] = useState(false);

  // 큰 입력에서도 타이핑이 끊기지 않도록 변환은 지연된 값 기준으로 수행한다.
  const deferredInput = useDeferredValue(input);
  const deferredRootName = useDeferredValue(rootName);

  const { output, error } = useMemo(() => {
    if (!deferredInput.trim()) return { output: '', error: null };
    try {
      const { code } = jsonToTypeScript(deferredInput, deferredRootName.trim() || 'Root');
      return { output: code, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { output: '', error: `JSON 파싱 오류: ${message}` };
    }
  }, [deferredInput, deferredRootName]);

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const download = () => {
    if (!output) return;
    const safeName = (rootName.trim() || 'types').replace(/[^A-Za-z0-9_-]/g, '');
    const blob = new Blob([output], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName || 'types'}.ts`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setInput(SAMPLE);
    setRootName('Root');
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON → TypeScript" widthClass="max-w-3xl" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          JSON 을 붙여넣으면 TypeScript 인터페이스를 자동 생성합니다.
        </p>

      <label className="block max-w-xs space-y-1">
        <span className="text-sm font-medium">루트 인터페이스 이름</span>
        <Input
          value={rootName}
          onChange={(e) => setRootName(e.target.value)}
          placeholder="Root"
          className="font-mono"
          spellCheck={false}
          autoComplete="off"
          aria-label="루트 인터페이스 이름"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 JSON 을 붙여넣으세요"
          spellCheck={false}
          aria-label="JSON 입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="생성된 TypeScript 인터페이스"
          aria-label="TypeScript 결과"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>
          <Download className="h-4 w-4" aria-hidden />
          .ts 다운로드
        </Button>
      </div>

      <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
        <p>
          중첩 객체는 별도 인터페이스로, 배열 요소는 타입 유니온으로 추론합니다. 모든 처리는 브라우저
          안에서 이뤄지며 데이터는 외부로 전송되지 않습니다.
        </p>
      </div>
      </main>
    </div>
  );
}
