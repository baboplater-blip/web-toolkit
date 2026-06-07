'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, Quote } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'escape' | 'unescape';

const SAMPLE_RAW = `안녕하세요 "web-toolkit"
탭→\t끝
경로: C:\\Users\\name`;

/**
 * 원본 문자열을 JSON 문자열 본문으로 이스케이프.
 * JSON.stringify 가 따옴표로 감싼 결과에서 양끝 따옴표만 제거한다.
 */
function escapeJsonString(raw: string): string {
  const quoted = JSON.stringify(raw);
  return quoted.slice(1, -1);
}

/**
 * JSON 이스케이프된 본문을 원본 문자열로 복원.
 * 양끝에 따옴표를 붙여 JSON.parse 로 해석한다. 잘못된 이스케이프는 throw.
 */
function unescapeJsonString(escaped: string): string {
  const parsed = JSON.parse(`"${escaped}"`);
  if (typeof parsed !== 'string') {
    throw new Error('문자열로 해석되지 않았습니다.');
  }
  return parsed;
}

export default function JsonEscapePage() {
  const [dir, setDir] = useState<Direction>('escape');
  const [input, setInput] = useState(SAMPLE_RAW);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(null);
    if (input === '') {
      setOutput('');
      return;
    }
    try {
      setOutput(dir === 'escape' ? escapeJsonString(input) : unescapeJsonString(input));
    } catch (err) {
      setOutput('');
      setError(
        dir === 'unescape'
          ? `유효한 JSON 이스케이프 문자열이 아닙니다: ${
              err instanceof Error ? err.message : '파싱 실패'
            }`
          : err instanceof Error
            ? err.message
            : '이스케이프에 실패했습니다.',
      );
    }
  }, [input, dir]);

  const swap = () => {
    setInput(output);
    setDir(dir === 'escape' ? 'unescape' : 'escape');
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    triggerDownload(
      new Blob([output], { type: 'text/plain;charset=utf-8' }),
      dir === 'escape' ? 'escaped.txt' : 'unescaped.txt',
    );
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
            <Quote className="h-5 w-5" />
            <h1 className="font-semibold text-base">JSON 이스케이프 ↔ 복원</h1>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={swap}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            방향 전환
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDir('escape')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'escape'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            이스케이프 (원본 → JSON 문자열)
          </button>
          <button
            type="button"
            onClick={() => setDir('unescape')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'unescape'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            복원 (JSON 문자열 → 원본)
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">
              입력 ({dir === 'escape' ? '원본 문자열' : 'JSON 이스케이프 문자열'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
              aria-label="입력"
            />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">
                출력 ({dir === 'escape' ? 'JSON 이스케이프 문자열' : '원본 문자열'})
              </label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
              aria-label="결과"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          따옴표·개행·탭·역슬래시·유니코드 이스케이프를 양방향 처리합니다(JSON.stringify / JSON.parse 기반). 입력은
          따옴표로 감싸지 않은 문자열 본문입니다.
        </p>
      </main>
    </div>
  );
}
