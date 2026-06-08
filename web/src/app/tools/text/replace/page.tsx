'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Replace } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

// 사용자 정규식은 ReDoS(파국적 백트래킹) 위험이 있어 동기 평가 시 탭이 멈출 수 있다.
// 일정 길이를 넘으면 실시간 평가를 건너뛰고 안내만 표시한다.
const MAX_LIVE_EVAL_CHARS = 100_000;

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
  // 대용량 입력에서 ReDoS 위험을 감수하고 강제로 평가할지 여부.
  const [forceEval, setForceEval] = useState(false);

  // 치환 평가는 입력보다 한 박자 늦게 수행해 키 입력이 막히는 것을 줄인다.
  const deferredText = useDeferredValue(text);
  const deferredFind = useDeferredValue(find);
  const deferredReplace = useDeferredValue(replace);

  // 길이가 임계값을 넘고 강제 실행이 아니면 동기 평가를 건너뛴다.
  const tooLarge = deferredText.length > MAX_LIVE_EVAL_CHARS && !forceEval;

  const { output, matchCount, regexError } = useMemo(() => {
    if (!deferredFind) return { output: deferredText, matchCount: 0, regexError: null as string | null };
    if (tooLarge) {
      // 안내만 하고 원본을 그대로 보여준다(평가 생략).
      return { output: deferredText, matchCount: 0, regexError: null as string | null };
    }

    let pattern = deferredFind;
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
      const matches = deferredText.match(re);
      const out = deferredText.replace(re, deferredReplace);
      return { output: out, matchCount: matches?.length ?? 0, regexError: null };
    } catch (e) {
      return {
        output: deferredText,
        matchCount: 0,
        regexError: e instanceof Error ? e.message : '정규식 오류',
      };
    }
  }, [deferredText, deferredFind, deferredReplace, useRegex, ignoreCase, multiline, wholeWord, tooLarge]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      // 클립보드 권한 거부·비보안 컨텍스트 등에서 reject 될 수 있어 무시하고 로깅만.
      console.error('[replace] 클립보드 복사 실패', err);
    }
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

          {tooLarge && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-400">
              입력이 {MAX_LIVE_EVAL_CHARS.toLocaleString()}자를 넘어 실시간 치환을 멈췄습니다. 복잡한
              정규식은 큰 입력에서 탭을 멈추게 할 수 있습니다.{' '}
              <button
                type="button"
                onClick={() => setForceEval(true)}
                className="font-medium underline underline-offset-2"
              >
                그래도 실행
              </button>
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
