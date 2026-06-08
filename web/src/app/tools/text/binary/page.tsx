'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** 입력이 2진수(0·1 과 공백/개행만)인지 감지한다. */
function isBinaryInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[01\s]+$/.test(trimmed) && /[01]/.test(trimmed);
}

/** 텍스트를 UTF-8 8비트 2진수 그룹(공백 구분)으로 변환한다. */
function textToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const groups: string[] = [];
  bytes.forEach((byte) => {
    groups.push(byte.toString(2).padStart(8, '0'));
  });
  return groups.join(' ');
}

/**
 * 2진수 문자열을 UTF-8 디코딩하여 텍스트로 변환한다.
 * 8비트 단위로 정렬되지 않으면 오류를 던진다.
 */
function binaryToText(binary: string): string {
  const bits = binary.replace(/[^01]/g, '');
  if (bits.length === 0) return '';
  if (bits.length % 8 !== 0) {
    throw new Error('2진수 비트 수가 8의 배수가 아닙니다. 8비트 단위로 입력하세요.');
  }

  const byteCount = bits.length / 8;
  const bytes = new Uint8Array(byteCount);
  for (let index = 0; index < byteCount; index += 1) {
    const chunk = bits.slice(index * 8, index * 8 + 8);
    bytes[index] = Number.parseInt(chunk, 2);
  }

  // 잘못된 UTF-8 시퀀스는 예외로 처리하여 사용자에게 알린다.
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export default function BinaryTextPage() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const isBinary = useMemo(() => isBinaryInput(input), [input]);

  const { output, error } = useMemo<{ output: string; error: string | null }>(() => {
    if (!input) return { output: '', error: null };
    try {
      const result = isBinary ? binaryToText(input) : textToBinary(input);
      return { output: result, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '변환 중 오류가 발생했습니다.';
      return { output: '', error: message };
    }
  }, [input, isBinary]);

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'binary-text.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="텍스트 ↔ 2진수" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          텍스트를 UTF-8 8비트 2진수로, 또는 그 반대로 자동 변환합니다.
        </p>

      </header>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        현재 입력: {input ? (isBinary ? '2진수 → 텍스트' : '텍스트 → 2진수') : '대기 중'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 텍스트 또는 2진수(0과 1)를 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>
          {copied ? (
            <Check className="mr-1 h-4 w-4" aria-hidden />
          ) : (
            <Copy className="mr-1 h-4 w-4" aria-hidden />
          )}
          {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>
          다운로드
        </Button>
      </div>
    </main>
    </div>
  );
}
