'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Diff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Mode = 'line' | 'word' | 'char';

interface Part {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export default function DiffPage() {
  const [a, setA] = useState('Hello world\n이것은 원본 텍스트입니다.\n세 번째 줄');
  const [b, setB] = useState('Hello world!\n이것은 수정된 텍스트입니다.\n세 번째 줄\n네 번째 줄 추가');
  const [mode, setMode] = useState<Mode>('line');
  const [parts, setParts] = useState<Part[]>([]);
  const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const diff = await import('diff');
      let result: Part[];
      if (mode === 'line') result = diff.diffLines(a, b);
      else if (mode === 'word') result = diff.diffWords(a, b);
      else result = diff.diffChars(a, b);
      if (cancelled) return;
      setParts(result);
      let added = 0;
      let removed = 0;
      let unchanged = 0;
      for (const p of result) {
        const len = mode === 'line' ? p.value.split('\n').filter(Boolean).length : p.value.length;
        if (p.added) added += len;
        else if (p.removed) removed += len;
        else unchanged += len;
      }
      setStats({ added, removed, unchanged });
    })();
    return () => {
      cancelled = true;
    };
  }, [a, b, mode]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Diff className="h-5 w-5" />
            <h1 className="font-semibold text-base">텍스트 비교</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 flex items-center gap-3 flex-wrap">
          <label className="text-xs font-medium">비교 단위</label>
          <div className="grid grid-cols-3 gap-1.5 flex-1 max-w-md">
            {(
              [
                ['line', '줄 단위'],
                ['word', '단어 단위'],
                ['char', '문자 단위'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`h-8 text-xs rounded-md border ${
                  mode === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] ml-auto">
            <span className="text-green-500">+ {stats.added}</span>
            <span className="text-red-500">− {stats.removed}</span>
            <span className="text-muted-foreground">= {stats.unchanged}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">원본 (A)</label>
            <textarea
              value={a}
              onChange={(e) => setA(e.target.value)}
              rows={10}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
            />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">수정본 (B)</label>
            <textarea
              value={b}
              onChange={(e) => setB(e.target.value)}
              rows={10}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            차이
          </h2>
          <div className="rounded-lg border bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all max-h-[50vh] overflow-auto">
            {parts.map((p, i) => (
              <span
                key={i}
                className={
                  p.added
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : p.removed
                      ? 'bg-red-500/20 text-red-700 dark:text-red-400 line-through'
                      : ''
                }
              >
                {p.value}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
