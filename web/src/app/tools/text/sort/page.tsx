'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowUpDown,
  Check,
  Copy,
  Download,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

type SortMode = 'asc' | 'desc' | 'length-asc' | 'length-desc' | 'random' | 'reverse';
type DupMode = 'keep' | 'unique' | 'only-duplicates';

const KO_COLLATOR = new Intl.Collator('ko', {
  sensitivity: 'base',
  numeric: true,
});

function applySort(lines: string[], mode: SortMode): string[] {
  switch (mode) {
    case 'asc':
      return [...lines].sort((a, b) => KO_COLLATOR.compare(a, b));
    case 'desc':
      return [...lines].sort((a, b) => KO_COLLATOR.compare(b, a));
    case 'length-asc':
      return [...lines].sort((a, b) => a.length - b.length || KO_COLLATOR.compare(a, b));
    case 'length-desc':
      return [...lines].sort((a, b) => b.length - a.length || KO_COLLATOR.compare(a, b));
    case 'reverse':
      return [...lines].reverse();
    case 'random': {
      const arr = [...lines];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  }
}

function applyDup(lines: string[], mode: DupMode, ignoreCase: boolean): string[] {
  const norm = (s: string) => (ignoreCase ? s.toLowerCase() : s);
  if (mode === 'keep') return lines;
  if (mode === 'unique') {
    const seen = new Set<string>();
    return lines.filter((l) => {
      const k = norm(l);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  const counts = new Map<string, number>();
  for (const l of lines) counts.set(norm(l), (counts.get(norm(l)) ?? 0) + 1);
  const seen = new Set<string>();
  return lines.filter((l) => {
    const k = norm(l);
    if ((counts.get(k) ?? 0) < 2) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export default function TextSortPage() {
  const [text, setText] = useState(
    [
      'banana',
      'apple',
      'cherry',
      'apple',
      'durian',
      '바나나',
      '사과',
      '체리',
      '사과',
    ].join('\n'),
  );
  const [sortMode, setSortMode] = useState<SortMode>('asc');
  const [dupMode, setDupMode] = useState<DupMode>('keep');
  const [trim, setTrim] = useState(true);
  const [removeBlank, setRemoveBlank] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    let lines = text.split(/\r?\n/);
    if (trim) lines = lines.map((l) => l.trim());
    if (removeBlank) lines = lines.filter((l) => l.length > 0);
    lines = applyDup(lines, dupMode, ignoreCase);
    lines = applySort(lines, sortMode);
    return lines;
  }, [text, sortMode, dupMode, trim, removeBlank, ignoreCase]);

  const resultText = result.join('\n');
  const originalCount = text.split(/\r?\n/).length;

  const copyResult = async () => {
    await navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const downloadResult = () => {
    triggerDownload(
      new Blob([resultText], { type: 'text/plain;charset=utf-8' }),
      'sorted.txt',
    );
  };

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'asc', label: '오름차순' },
    { value: 'desc', label: '내림차순' },
    { value: 'length-asc', label: '길이↑' },
    { value: 'length-desc', label: '길이↓' },
    { value: 'reverse', label: '역순' },
    { value: 'random', label: '랜덤' },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <ArrowDownAZ className="h-5 w-5" />
            <h1 className="font-semibold text-base">줄 정렬·중복 제거</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                정렬
              </label>
              <div className="grid grid-cols-3 gap-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortMode(opt.value)}
                    className={`h-8 text-[10px] rounded-md border ${
                      sortMode === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                중복 처리
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    ['keep', '유지'],
                    ['unique', '제거'],
                    ['only-duplicates', '중복만'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDupMode(v)}
                    className={`h-8 text-[10px] rounded-md border ${
                      dupMode === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                전처리
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['trim', '공백 제거', trim, setTrim],
                    ['blank', '빈 줄 제거', removeBlank, setRemoveBlank],
                    ['icase', '대소문자 무시', ignoreCase, setIgnoreCase],
                  ] as const
                ).map(([id, label, val, setter]) => (
                  <label
                    key={id}
                    className={`flex items-center gap-1 text-[10px] px-2 h-8 rounded-md border cursor-pointer ${
                      val ? 'bg-primary/10 border-primary/40' : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setter(e.target.checked)}
                      className="h-3 w-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                원본 ({originalCount}줄)
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setText('')}
              >
                지우기
              </Button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={16}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
              placeholder="줄 단위로 입력..."
              spellCheck={false} aria-label="줄 단위로 입력..." />
          </div>

          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과 ({result.length}줄)
              </h2>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={copyResult}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="ml-1">복사</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={downloadResult}
                >
                  <Download className="h-3 w-3" />
                  <span className="ml-1">TXT</span>
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={resultText}
              rows={16}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y" aria-label="결과" />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <ArrowUpDown className="h-3 w-3" />
          정렬은 한국어·숫자 인식 (Intl.Collator) · 원본 데이터는 브라우저 메모리에만 존재
        </p>
      </main>
    </div>
  );
}
