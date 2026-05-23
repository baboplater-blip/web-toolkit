'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type CaseKind =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'dot'
  | 'invert'
  | 'capitalize-words';

function splitWords(input: string): string[] {
  const cleaned = input
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .trim();
  return cleaned.split(/\s+/).filter(Boolean);
}

function convert(input: string, kind: CaseKind): string {
  switch (kind) {
    case 'upper':
      return input.toUpperCase();
    case 'lower':
      return input.toLowerCase();
    case 'title':
      return input
        .toLowerCase()
        .replace(/(^|\s)(\S)/g, (_, sp, ch) => sp + ch.toUpperCase());
    case 'sentence':
      return input
        .toLowerCase()
        .replace(/(^\s*|[.!?…]\s+)(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());
    case 'capitalize-words':
      return input.replace(/\b(\w)/g, (m) => m.toUpperCase());
    case 'invert':
      return [...input]
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    case 'camel': {
      const words = splitWords(input);
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join('');
    }
    case 'pascal': {
      const words = splitWords(input);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }
    case 'snake':
      return splitWords(input).map((w) => w.toLowerCase()).join('_');
    case 'kebab':
      return splitWords(input).map((w) => w.toLowerCase()).join('-');
    case 'constant':
      return splitWords(input).map((w) => w.toUpperCase()).join('_');
    case 'dot':
      return splitWords(input).map((w) => w.toLowerCase()).join('.');
  }
}

const KINDS: { kind: CaseKind; label: string; sample: string }[] = [
  { kind: 'upper', label: '대문자', sample: 'HELLO WORLD' },
  { kind: 'lower', label: '소문자', sample: 'hello world' },
  { kind: 'title', label: 'Title Case', sample: 'Hello World' },
  { kind: 'sentence', label: 'Sentence', sample: 'Hello world.' },
  { kind: 'capitalize-words', label: '단어 첫글자', sample: 'Hello World' },
  { kind: 'invert', label: '대소 반전', sample: 'hELLO wORLD' },
  { kind: 'camel', label: 'camelCase', sample: 'helloWorld' },
  { kind: 'pascal', label: 'PascalCase', sample: 'HelloWorld' },
  { kind: 'snake', label: 'snake_case', sample: 'hello_world' },
  { kind: 'kebab', label: 'kebab-case', sample: 'hello-world' },
  { kind: 'constant', label: 'CONSTANT_CASE', sample: 'HELLO_WORLD' },
  { kind: 'dot', label: 'dot.case', sample: 'hello.world' },
];

export default function TextCasePage() {
  const [text, setText] = useState('Hello World Example Text — 안녕하세요');
  const [copiedKind, setCopiedKind] = useState<CaseKind | null>(null);

  const results = useMemo(
    () => KINDS.map((k) => ({ ...k, value: convert(text, k.kind) })),
    [text],
  );

  const copy = async (kind: CaseKind, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKind(kind);
    setTimeout(() => setCopiedKind(null), 1200);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ArrowRightLeft className="h-5 w-5" />
            <h1 className="font-semibold text-base">대소문자·케이스 변환</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setText('')}
          >
            지우기
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3">
          <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" /> 원본 텍스트
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y font-mono"
            placeholder="변환할 텍스트를 입력하세요..."
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {results.map((r) => (
            <div
              key={r.kind}
              className="rounded-xl border bg-card p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {r.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copy(r.kind, r.value)}
                  title="복사"
                  aria-label={`${r.label} 복사`}
                >
                  {copiedKind === r.kind ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs font-mono break-all leading-relaxed text-foreground/90 min-h-[1.5rem]">
                {r.value || (
                  <span className="text-muted-foreground/60">(빈 결과)</span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground">예: {r.sample}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
