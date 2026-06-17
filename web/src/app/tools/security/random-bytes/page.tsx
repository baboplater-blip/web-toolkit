'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeySquare, RefreshCw } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type OutputFormat = 'hex' | 'base64' | 'uuid';

const MIN_BYTES = 1;
const MAX_BYTES = 256;

/** 바이트 배열 → 소문자 hex 문자열. */
function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0');
  }
  return out;
}

/** 바이트 배열 → 표준 Base64 문자열. */
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** 지정 길이의 암호학적 난수를 형식에 맞춰 생성한다. */
function generateRandom(byteCount: number, format: OutputFormat): string {
  if (format === 'uuid') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return format === 'hex' ? toHex(bytes) : toBase64(bytes);
}

export default function RandomBytesPage() {
  const [byteCount, setByteCount] = useState(32);
  const [format, setFormat] = useState<OutputFormat>('hex');
  // 하이드레이션 안전: 초기 렌더는 빈 값, 첫 생성은 마운트 후 useEffect 에서 수행.
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setValue(generateRandom(byteCount, format));
  }, [byteCount, format]);

  // 마운트 후 1회 초기 생성 + 옵션 변경 시 재생성.
  useEffect(() => {
    setValue(generateRandom(byteCount, format));
  }, [byteCount, format]);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed:', e);
    }
  }

  function reset() {
    setByteCount(32);
    setFormat('hex');
    setCopied(false);
    // value 는 옵션 변경 useEffect 가 재생성한다(기본값이 이미 같다면 명시 재생성).
    setValue(generateRandom(32, 'hex'));
  }

  function handleByteCountChange(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setByteCount(MIN_BYTES);
      return;
    }
    setByteCount(Math.min(MAX_BYTES, Math.max(MIN_BYTES, parsed)));
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="랜덤 바이트/토큰" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <KeySquare className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          <code>crypto.getRandomValues</code> 로 암호학적 난수를 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">바이트 수 ({MIN_BYTES}~{MAX_BYTES})</span>
            <Input
              type="number"
              min={MIN_BYTES}
              max={MAX_BYTES}
              value={byteCount}
              onChange={(e) => handleByteCountChange(e.target.value)}
              disabled={format === 'uuid'}
              aria-label="바이트 수"
            />
            {format === 'uuid' && (
              <span className="text-xs text-muted-foreground">UUID 형식은 길이가 고정되어 바이트 수를 무시합니다.</span>
            )}
          </label>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">출력 형식</legend>
            <div className="flex flex-wrap gap-2">
              {(['hex', 'base64', 'uuid'] as const).map((option) => (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                    format === option ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option}
                    checked={format === option}
                    onChange={() => setFormat(option)}
                    className="sr-only"
                  />
                  {option === 'hex' ? 'Hex' : option === 'base64' ? 'Base64' : 'UUID'}
                </label>
              ))}
            </div>
          </fieldset>

          <Button onClick={regenerate}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            다시 생성
          </Button>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">결과</span>
            <Button variant="outline" size="sm" onClick={copy} disabled={!value}>
              {copied ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                  복사
                </>
              )}
            </Button>
          </div>
          <textarea
            className="min-h-24 w-full break-all rounded-lg border bg-muted/40 p-3 font-mono text-sm"
            value={value}
            readOnly
            aria-label="생성 결과"
          />
        </div>
      </main>
    </div>
  );
}
