'use client';

import { useMemo, useState } from 'react';
import { Binary, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = ALPHABET.length;

/** 문자 → 인덱스 역참조 맵(디코딩용). */
const INDEX_MAP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (let i = 0; i < ALPHABET.length; i += 1) {
    map[ALPHABET[i]] = i;
  }
  return map;
})();

type Mode = 'encode' | 'decode';

interface ConvertResult {
  output: string;
  error: string | null;
}

/** 바이트 배열 → Base58. 선행 0 바이트는 '1' 로 보존. */
function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros += 1;
  }

  // big-endian 바이트를 base58 자릿수로 변환(반복 나눗셈).
  const digits: number[] = [];
  for (let i = leadingZeros; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8;
      digits[j] = carry % BASE;
      carry = Math.floor(carry / BASE);
    }
    while (carry > 0) {
      digits.push(carry % BASE);
      carry = Math.floor(carry / BASE);
    }
  }

  let result = ALPHABET[0].repeat(leadingZeros);
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    result += ALPHABET[digits[i]];
  }
  return result;
}

/** Base58 → 바이트 배열. 유효하지 않은 문자가 있으면 null. */
function base58ToBytes(str: string): Uint8Array | null {
  if (str.length === 0) return new Uint8Array(0);

  let leadingOnes = 0;
  while (leadingOnes < str.length && str[leadingOnes] === ALPHABET[0]) {
    leadingOnes += 1;
  }

  const bytes: number[] = [];
  for (let i = leadingOnes; i < str.length; i += 1) {
    const value = INDEX_MAP[str[i]];
    if (value === undefined) return null;
    let carry = value;
    for (let j = 0; j < bytes.length; j += 1) {
      carry += bytes[j] * BASE;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // 선행 '1' → 선행 0 바이트, 그리고 little-endian 누적을 big-endian 으로 뒤집는다.
  const out = new Uint8Array(leadingOnes + bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[leadingOnes + bytes.length - 1 - i] = bytes[i];
  }
  return out;
}

function convert(input: string, mode: Mode): ConvertResult {
  if (!input) return { output: '', error: null };

  try {
    if (mode === 'encode') {
      const bytes = new TextEncoder().encode(input);
      return { output: bytesToBase58(bytes), error: null };
    }

    const trimmed = input.trim();
    const bytes = base58ToBytes(trimmed);
    if (bytes === null) {
      return { output: '', error: '유효하지 않은 Base58 문자가 포함되어 있습니다.' };
    }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { output: text, error: null };
  } catch {
    return { output: '', error: '디코딩 결과가 올바른 UTF-8 텍스트가 아닙니다.' };
  }
}

export default function Base58Page() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => convert(input, mode), [input, mode]);

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setInput('');
    setMode('encode');
    setCopied(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Base58 인코딩/디코딩" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Binary className="h-4 w-4 text-primary" aria-hidden />
          비트코인 알파벳(0·O·I·l 제외)으로 텍스트를 Base58 인코딩·디코딩합니다.
        </p>

        <div className="inline-flex rounded-lg border bg-card p-1">
          {(
            [
              ['encode', '인코딩'],
              ['decode', '디코딩'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`h-8 rounded-md px-4 text-sm font-medium ${
                mode === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">{mode === 'encode' ? '텍스트' : 'Base58'}</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? '인코딩할 텍스트' : '디코딩할 Base58 문자열'}
              spellCheck={false}
              aria-label="입력"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">결과</span>
            <textarea
              className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
              value={output}
              readOnly
              placeholder="결과"
              aria-label="결과"
            />
          </label>
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
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
