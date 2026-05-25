'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Replace } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';

export default function TextReplacePage() {
  const [text, setText] = useState(
    'Hello World\nHello Web Toolkit\nGoodbye World\n안녕 세계\n안녕 안녕 세계',
  );
  const [find, setFind] = useState('Hello');
  const [replace, setReplace] = useState('Hi');
  const [useRegex, setUseRegex] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [copied, setCopied] = useState(false);

  const { output, matchCount, regexError } = useMemo(() => {
    if (!find) return { output: text, matchCount: 0, regexError: null as string | null };

    let pattern = find;
    if (!useRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    let flags = 'g';
    if (ignoreCase) flags += 'i';
    if (multiline) flags += 'm';

    try {
      const re = new RegExp(pattern, flags);
      const matches = text.match(re);
      const out = text.replace(re, replace);
      return { output: out, matchCount: matches?.length ?? 0, regexError: null };
    } catch (e) {
      return {
        output: text,
        matchCount: 0,
        regexError: e instanceof Error ? e.message : '정규식 오류',
      };
    }
  }, [text, find, replace, useRegex, ignoreCase, multiline, wholeWord]);

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
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Replace className="h-5 w-5" />
            <h1 className="font-semibold text-base">일괄 찾기·치환</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                찾을 문자열
              </label>
              <Input
                value={find}
                onChange={(e) => setFind(e.target.value)}
                className="h-9 font-mono text-xs"
                placeholder="검색 패턴"
                spellCheck={false} aria-label="찾을 문자열" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                바꿀 문자열 {useRegex && '($1·$2 캡처 그룹 지원)'}
              </label>
              <Input
                value={replace}
                onChange={(e) => setReplace(e.target.value)}
                className="h-9 font-mono text-xs"
                placeholder="대체 문자열"
                spellCheck={false} aria-label="바꿀 문자열" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['regex', '정규식', useRegex, setUseRegex],
                ['icase', '대소문자 무시', ignoreCase, setIgnoreCase],
                ['ml', '여러 줄 (^/$)', multiline, setMultiline],
                ['word', '단어 단위', wholeWord, setWholeWord],
              ] as const
            ).map(([id, label, val, setter]) => (
              <label
                key={id}
                className={`flex items-center gap-1.5 text-xs px-2.5 h-8 rounded-md border cursor-pointer ${
                  val
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-background hover:bg-muted'
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

          {regexError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive font-mono">
              정규식 오류: {regexError}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            매칭 결과 <strong className="text-foreground">{matchCount}</strong>개
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                원본
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
              spellCheck={false} aria-label="원본" />
          </div>

          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과
              </h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="ml-1">복사</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    triggerDownload(
                      new Blob([output], { type: 'text/plain;charset=utf-8' }),
                      'replaced.txt',
                    )
                  }
                >
                  <Download className="h-3 w-3" />
                  <span className="ml-1">TXT</span>
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={16}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y" aria-label="결과" />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          정규식 사용 시 {'$1·$2'} 캡처 그룹과 {'\\n·\\t'} 이스케이프 지원
        </p>
      </main>
    </div>
  );
}
