'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Braces,
  Check,
  Copy,
  Download,
  Minimize2,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type ViewMode = 'pretty' | 'minify';

export default function JsonFormatPage() {
  const [input, setInput] = useState('{\n  "hello": "world",\n  "items": [1, 2, 3]\n}');
  const [indent, setIndent] = useState(2);
  const [viewMode, setViewMode] = useState<ViewMode>('pretty');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: true, value: null, error: null };
    try {
      return { ok: true as const, value: JSON.parse(input), error: null };
    } catch (err) {
      return {
        ok: false as const,
        value: null,
        error: err instanceof Error ? err.message : 'JSON 파싱 실패',
      };
    }
  }, [input]);

  const output = useMemo(() => {
    if (!parsed.ok || parsed.value === null) return '';
    return JSON.stringify(parsed.value, null, viewMode === 'pretty' ? indent : 0);
  }, [parsed, viewMode, indent]);

  const stats = useMemo(() => {
    if (!parsed.ok) return null;
    return {
      inputSize: new Blob([input]).size,
      outputSize: new Blob([output]).size,
      keys: countKeys(parsed.value),
    };
  }, [parsed, input, output]);

  const reset = () => {
    setInput('');
  };

  const loadSample = () => {
    setInput(
      JSON.stringify(
        {
          name: '테스트 사용자',
          age: 30,
          address: { city: '서울', zipcode: '03141' },
          tags: ['developer', 'admin'],
          active: true,
        },
        null,
        2,
      ),
    );
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const downloadJson = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    triggerDownload(blob, 'formatted.json');
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Braces className="h-5 w-5" />
            <h1 className="font-semibold text-base">JSON 포맷터</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={loadSample}>
              샘플
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">입력 JSON</label>
            {parsed.ok && input.trim() && (
              <span className="text-[10px] text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                유효한 JSON
              </span>
            )}
            {!parsed.ok && <span className="text-[10px] text-destructive">오류</span>}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{ "hello": "world" }'
            rows={10}
            className={`w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y ${
              !parsed.ok ? 'border-destructive/50' : ''
            }`}
            spellCheck={false}
          />
          {!parsed.ok && parsed.error && (
            <p className="text-xs text-destructive font-mono">{parsed.error}</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-[200px]">
              <button
                type="button"
                onClick={() => setViewMode('pretty')}
                className={`h-9 text-xs rounded-md border flex items-center justify-center gap-1.5 ${
                  viewMode === 'pretty'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                <Wand2 className="h-3.5 w-3.5" />
                정렬
              </button>
              <button
                type="button"
                onClick={() => setViewMode('minify')}
                className={`h-9 text-xs rounded-md border flex items-center justify-center gap-1.5 ${
                  viewMode === 'minify'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                <Minimize2 className="h-3.5 w-3.5" />
                압축
              </button>
            </div>
            {viewMode === 'pretty' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">들여쓰기</span>
                {[2, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIndent(n)}
                    className={`h-7 w-8 text-[11px] rounded-md border ${
                      indent === n
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {parsed.ok && output && (
            <>
              <Separator />
              <textarea
                readOnly
                value={output}
                rows={viewMode === 'minify' ? 3 : 10}
                className="w-full rounded-lg border bg-muted px-3 py-2 text-xs font-mono resize-y"
              />
              {stats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">입력 크기</p>
                    <p className="text-xs font-semibold mt-0.5">{stats.inputSize} B</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">출력 크기</p>
                    <p className="text-xs font-semibold mt-0.5">{stats.outputSize} B</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">총 키 수</p>
                    <p className="text-xs font-semibold mt-0.5">{stats.keys}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copyOutput}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      복사
                    </>
                  )}
                </Button>
                <Button onClick={downloadJson}>
                  <Download className="h-4 w-4" />
                  .json 다운로드
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function countKeys(value: unknown): number {
  if (value === null || typeof value !== 'object') return 0;
  if (Array.isArray(value)) {
    return value.reduce<number>((acc, v) => acc + countKeys(v), 0);
  }
  const obj = value as Record<string, unknown>;
  return Object.keys(obj).reduce(
    (acc, k) => acc + 1 + countKeys(obj[k]),
    0,
  );
}
