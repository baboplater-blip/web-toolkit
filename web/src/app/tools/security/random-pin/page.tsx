'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, RefreshCw } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MIN_DIGITS = 4;
const MAX_DIGITS = 12;
const MIN_COUNT = 1;
const MAX_COUNT = 100;

/**
 * 0~9 균등 분포의 무작위 숫자 하나를 반환한다.
 * crypto.getRandomValues(0~255) 에서 250~255 를 버리는 rejection sampling 으로
 * 모듈로 편향(modulo bias)을 제거한다(250 = 25 * 10).
 */
function randomDigit(): number {
  const buffer = new Uint8Array(1);
  let byte: number;
  do {
    crypto.getRandomValues(buffer);
    byte = buffer[0];
  } while (byte >= 250);
  return byte % 10;
}

/** 지정 자릿수의 무작위 숫자 PIN 문자열을 생성한다. */
function generatePin(digits: number): string {
  let pin = '';
  for (let i = 0; i < digits; i += 1) {
    pin += randomDigit().toString();
  }
  return pin;
}

/** count 개의 PIN 을 생성한다. */
function generatePins(digits: number, count: number): string[] {
  const pins: string[] = [];
  for (let i = 0; i < count; i += 1) {
    pins.push(generatePin(digits));
  }
  return pins;
}

export default function RandomPinPage() {
  const [digits, setDigits] = useState(6);
  const [count, setCount] = useState(1);
  // 하이드레이션 안전: 초기 렌더는 빈 배열, 첫 생성은 마운트 후 useEffect 에서만 수행.
  const [pins, setPins] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const regenerate = useCallback(() => {
    setPins(generatePins(digits, count));
    setCopiedIndex(null);
  }, [digits, count]);

  // 의도된 set-state-in-effect: SSR/프리렌더 시 난수를 직접 렌더하면 하이드레이션 불일치가
  // 발생하므로, 마운트 후(및 옵션 변경 시) 클라이언트에서만 crypto 로 생성한다.
  useEffect(() => {
    setPins(generatePins(digits, count));
  }, [digits, count]);

  async function copyOne(value: string, index: number) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 2000);
    } catch (e) {
      console.error('clipboard write failed:', e);
    }
  }

  async function copyAll() {
    if (pins.length === 0) return;
    try {
      await navigator.clipboard.writeText(pins.join('\n'));
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex((current) => (current === -1 ? null : current)), 2000);
    } catch (e) {
      console.error('clipboard write failed:', e);
    }
  }

  function reset() {
    setDigits(6);
    setCount(1);
    setCopiedIndex(null);
    setPins(generatePins(6, 1));
  }

  function handleDigitsChange(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setDigits(MIN_DIGITS);
      return;
    }
    setDigits(Math.min(MAX_DIGITS, Math.max(MIN_DIGITS, parsed)));
  }

  function handleCountChange(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setCount(MIN_COUNT);
      return;
    }
    setCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, parsed)));
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PIN 생성기" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <KeyRound className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          <code>crypto.getRandomValues</code> 와 편향 없는 표집으로 안전한 무작위 숫자 PIN 을 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">자릿수 ({MIN_DIGITS}~{MAX_DIGITS})</span>
              <Input
                type="number"
                min={MIN_DIGITS}
                max={MAX_DIGITS}
                value={digits}
                onChange={(e) => handleDigitsChange(e.target.value)}
                aria-label="자릿수"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">개수 ({MIN_COUNT}~{MAX_COUNT})</span>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={count}
                onChange={(e) => handleCountChange(e.target.value)}
                aria-label="개수"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={regenerate}>
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden />
              다시 생성
            </Button>
            {pins.length > 1 && (
              <Button variant="outline" onClick={copyAll}>
                {copiedIndex === -1 ? (
                  <Check className="mr-1 h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="mr-1 h-4 w-4" aria-hidden />
                )}
                전체 복사
              </Button>
            )}
          </div>
        </div>

        {pins.length > 0 && (
          <ul className="space-y-2" aria-label="생성된 PIN 목록">
            {pins.map((pin, index) => (
              <li
                key={`${index}-${pin}`}
                className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3"
              >
                <span className="select-all font-mono text-lg tracking-[0.3em]">{pin}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyOne(pin, index)}
                  aria-label={`${index + 1}번째 PIN 복사`}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          생성된 PIN 은 안전한 곳에 보관하고 타인과 공유하지 마세요. 모든 생성은 브라우저 안에서만 수행되며 서버로
          전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
