'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Mode = 'encode' | 'decode' | 'parse';

export default function UrlPage() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('https://example.com/검색?q=안녕 세상&page=2#섹션');
  const [useComponent, setUseComponent] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!input) return { output: '', parts: null, error: null };
    try {
      if (mode === 'encode') {
        return {
          output: useComponent ? encodeURIComponent(input) : encodeURI(input),
          parts: null,
          error: null,
        };
      }
      if (mode === 'decode') {
        return {
          output: useComponent ? decodeURIComponent(input) : decodeURI(input),
          parts: null,
          error: null,
        };
      }
      // parse
      const u = new URL(input);
      const queryParams: [string, string][] = [];
      u.searchParams.forEach((v, k) => queryParams.push([k, v]));
      return {
        output: '',
        parts: {
          protocol: u.protocol,
          username: u.username,
          password: u.password,
          hostname: u.hostname,
          port: u.port,
          pathname: u.pathname,
          search: u.search,
          hash: u.hash,
          origin: u.origin,
          queryParams,
        },
        error: null,
      };
    } catch (err) {
      return {
        output: '',
        parts: null,
        error: err instanceof Error ? err.message : '처리 실패',
      };
    }
  }, [input, mode, useComponent]);

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
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
            <Link2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">URL 인코더/디코더</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ['encode', '인코딩'],
              ['decode', '디코딩'],
              ['parse', 'URL 분석'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-9 text-xs rounded-md border ${
                mode === m
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode !== 'parse' && (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={useComponent}
              onChange={(e) => setUseComponent(e.target.checked)}
            />
            <code>Component</code> 모드 (권장, 쿼리값 등 특수문자 포함)
          </label>
        )}

        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-xs font-medium">
            {mode === 'encode' ? '원본' : mode === 'decode' ? '인코딩된 URL' : 'URL'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y break-all"
            spellCheck={false}
          />
        </div>

        {result.error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {result.error}
          </div>
        )}

        {mode !== 'parse' && result.output && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">결과</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => copy('output', result.output)}
              >
                {copied === 'output' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <textarea
              readOnly
              value={result.output}
              rows={4}
              className="w-full rounded-lg border bg-muted px-3 py-2 text-xs font-mono resize-y break-all"
            />
          </div>
        )}

        {mode === 'parse' && result.parts && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              URL 구성 요소
            </h2>
            <Separator />
            <div className="space-y-1.5">
              {(
                [
                  ['protocol', '프로토콜'],
                  ['hostname', '호스트명'],
                  ['port', '포트'],
                  ['username', '사용자'],
                  ['password', '비밀번호'],
                  ['pathname', '경로'],
                  ['search', '쿼리 문자열'],
                  ['hash', '해시 (fragment)'],
                  ['origin', '오리진'],
                ] as const
              ).map(([key, label]) => {
                const value = result.parts![key as keyof typeof result.parts];
                if (typeof value !== 'string' || !value) return null;
                return (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
                    <span className="flex-1 font-mono break-all">{value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => copy(key, value)}
                    >
                      {copied === key ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {result.parts.queryParams.length > 0 && (
              <>
                <Separator />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  쿼리 파라미터 ({result.parts.queryParams.length})
                </h3>
                <div className="space-y-1">
                  {result.parts.queryParams.map(([k, v], i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border p-2 text-xs font-mono"
                    >
                      <span className="text-primary shrink-0">{k}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="flex-1 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
