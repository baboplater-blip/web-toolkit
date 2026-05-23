'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Check, Code2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Mode = 'encode' | 'decode';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  middot: '·',
  bull: '•',
  euro: '€',
  pound: '£',
  yen: '¥',
};

function encodeHTML(input: string, all: boolean): string {
  if (all) {
    return Array.from(input)
      .map((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        if (code < 128 && ch !== '<' && ch !== '>' && ch !== '&' && ch !== '"' && ch !== "'") {
          return ch;
        }
        return `&#${code};`;
      })
      .join('');
  }
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHTML(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

export default function HtmlEntitiesPage() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('<div class="hello">안녕 & 반가워요 © 2026</div>');
  const [encodeAll, setEncodeAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    try {
      return mode === 'encode' ? encodeHTML(input, encodeAll) : decodeHTML(input);
    } catch (e) {
      return e instanceof Error ? e.message : '';
    }
  }, [input, mode, encodeAll]);

  const swap = () => {
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

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
            <Code2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">HTML 엔티티 인·디코드</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1">
            {(
              [
                ['encode', '인코드 (텍스트 → 엔티티)'],
                ['decode', '디코드 (엔티티 → 텍스트)'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`h-8 px-3 text-xs rounded-md border ${
                  mode === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {mode === 'encode' && (
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={encodeAll}
                  onChange={(e) => setEncodeAll(e.target.checked)}
                  className="h-3 w-3"
                />
                모든 비ASCII 문자도 인코드
              </label>
            )}
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={swap}>
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span className="ml-1">방향 바꾸기</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {mode === 'encode' ? '원본 텍스트' : '엔티티 입력'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setInput('')}
              >
                지우기
              </Button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={14}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
              spellCheck={false}
            />
          </div>

          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과
              </h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span className="ml-1">복사</span>
              </Button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={14}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          명명 엔티티(&amp;copy; · &amp;trade; · &amp;hellip; 등) 와 숫자 엔티티(&amp;#161; · &amp;#x00a9;) 모두 지원
        </p>
      </main>
    </div>
  );
}
