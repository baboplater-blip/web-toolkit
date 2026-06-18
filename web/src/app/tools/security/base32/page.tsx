'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { encodeBase32, decodeBase32 } from '@/lib/tools/base32';

type Mode = 'encode' | 'decode';

export default function Base32Page() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo<{ output: string; error: string | null }>(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        return { output: encodeBase32(new TextEncoder().encode(input)), error: null };
      }
      const bytes = decodeBase32(input);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return { output: decoded, error: null };
    } catch (err) {
      const message =
        err instanceof Error
          ? mode === 'decode' && err.message.includes('UTF-8')
            ? '디코딩 결과가 올바른 UTF-8 텍스트가 아닙니다.'
            : err.message
          : '처리에 실패했습니다.';
      return { output: '', error: message };
    }
  }, [mode, input]);

  function reset() {
    setMode('encode');
    setInput('');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 거부 시 조용히 무시 (시각 피드백만 생략)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Base32 인코딩" onReset={reset} widthClass="max-w-xl" />

      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          텍스트를 RFC 4648 Base32 로 인코딩하거나 디코딩합니다. 처리는 브라우저 안에서만
          이뤄집니다.
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          {(['encode', 'decode'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex h-10 items-center justify-center rounded-md border text-sm ${
                mode === m
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {m === 'encode' ? '인코딩' : '디코딩'}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{mode === 'encode' ? '텍스트' : 'Base32'}</span>
          <textarea
            className="min-h-32 w-full rounded-lg border bg-background p-2.5 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '인코딩할 텍스트' : '디코딩할 Base32 문자열'}
            aria-label="입력"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {output && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">결과</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copy}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    복사
                  </>
                )}
              </Button>
            </div>
            <p className="break-all rounded-lg border bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap">
              {output}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
