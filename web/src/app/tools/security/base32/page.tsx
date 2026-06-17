'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'encode' | 'decode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 바이트 배열을 RFC 4648 Base32 문자열(대문자 + `=` 패딩)로 인코딩 */
function encodeBase32(bytes: Uint8Array): string {
  let result = '';
  let buffer = 0;
  let bitsInBuffer = 0;

  for (let i = 0; i < bytes.length; i += 1) {
    buffer = (buffer << 8) | bytes[i];
    bitsInBuffer += 8;
    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsInBuffer) & 0x1f];
    }
  }

  if (bitsInBuffer > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsInBuffer)) & 0x1f];
  }

  // 8자 블록 단위로 패딩
  while (result.length % 8 !== 0) {
    result += '=';
  }
  return result;
}

/**
 * RFC 4648 Base32 문자열을 바이트 배열로 디코딩.
 * 알파벳 외 문자가 있으면 Error 를 던진다.
 */
function decodeBase32(text: string): Uint8Array {
  const cleaned = text.replace(/=+$/u, '').replace(/\s/gu, '').toUpperCase();
  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const char of cleaned) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`잘못된 Base32 문자입니다: "${char}"`);
    }
    buffer = (buffer << 5) | value;
    bitsInBuffer += 5;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      bytes.push((buffer >> bitsInBuffer) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

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
