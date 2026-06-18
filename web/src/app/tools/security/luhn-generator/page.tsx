'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, CreditCard, RefreshCw } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MIN_LENGTH = 8;
const MAX_LENGTH = 24;
const MIN_COUNT = 1;
const MAX_COUNT = 50;

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

/**
 * 숫자열의 Luhn 체크digit(마지막 자리)을 계산한다.
 * payload 는 체크digit 을 제외한 앞자리 전체이며, 체크digit 이 맨 뒤에 붙는다는 가정 하에
 * 오른쪽부터 홀수 위치(2번째마다)를 2배(>9 면 -9)하여 합산한다.
 */
function luhnCheckDigit(payload: string): number {
  let sum = 0;
  // payload 의 가장 오른쪽 자리는 최종 숫자열에서 끝에서 2번째가 되므로 두 배 대상.
  let doubleNext = true;
  for (let i = payload.length - 1; i >= 0; i -= 1) {
    let digit = payload.charCodeAt(i) - 48;
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * 전체 길이가 totalLength 이고 (선택) prefix 로 시작하며 Luhn 을 만족하는 숫자열을 생성한다.
 * 앞부분을 무작위(또는 prefix)로 채우고 마지막 자리에 체크digit 을 계산해 붙인다.
 */
function generateLuhnNumber(totalLength: number, prefix: string): string {
  const bodyLength = totalLength - 1; // 마지막 1자리는 체크digit.
  let body = prefix.slice(0, bodyLength);
  for (let i = body.length; i < bodyLength; i += 1) {
    body += randomDigit().toString();
  }
  return body + luhnCheckDigit(body).toString();
}

/** count 개의 Luhn 유효 숫자열을 생성한다. */
function generateNumbers(totalLength: number, count: number, prefix: string): string[] {
  const numbers: string[] = [];
  for (let i = 0; i < count; i += 1) {
    numbers.push(generateLuhnNumber(totalLength, prefix));
  }
  return numbers;
}

export default function LuhnGeneratorPage() {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [prefix, setPrefix] = useState('');
  // 하이드레이션 안전: 초기 렌더는 빈 배열, 첫 생성은 마운트 후 useEffect 에서만 수행.
  const [numbers, setNumbers] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // prefix 는 숫자만 허용하고 (length-1) 자리까지로 제한.
  const sanitizedPrefix = prefix.replace(/\D/g, '').slice(0, length - 1);

  const regenerate = useCallback(() => {
    setNumbers(generateNumbers(length, count, sanitizedPrefix));
    setCopiedIndex(null);
  }, [length, count, sanitizedPrefix]);

  // 의도된 set-state-in-effect: SSR/프리렌더 시 난수를 직접 렌더하면 하이드레이션 불일치가
  // 발생하므로, 마운트 후(및 옵션 변경 시) 클라이언트에서만 crypto 로 생성한다.
  useEffect(() => {
    setNumbers(generateNumbers(length, count, sanitizedPrefix));
  }, [length, count, sanitizedPrefix]);

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
    if (numbers.length === 0) return;
    try {
      await navigator.clipboard.writeText(numbers.join('\n'));
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex((current) => (current === -1 ? null : current)), 2000);
    } catch (e) {
      console.error('clipboard write failed:', e);
    }
  }

  function reset() {
    setLength(16);
    setCount(1);
    setPrefix('');
    setCopiedIndex(null);
    setNumbers(generateNumbers(16, 1, ''));
  }

  function handleLengthChange(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setLength(MIN_LENGTH);
      return;
    }
    setLength(Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, parsed)));
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
      <ToolHeader title="Luhn 번호 생성" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <CreditCard className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          <code>crypto.getRandomValues</code> 로 Luhn 체크섬을 만족하는 무작위 숫자열을 생성합니다.
        </p>

        <div
          role="note"
          className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400"
        >
          테스트용으로만 사용하세요. 생성된 번호는 Luhn 형식만 만족할 뿐 실제 발급된 카드·계좌가 아닙니다.
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">자릿수 ({MIN_LENGTH}~{MAX_LENGTH})</span>
              <Input
                type="number"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                value={length}
                onChange={(e) => handleLengthChange(e.target.value)}
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
          <label className="block space-y-1">
            <span className="text-sm font-medium">접두사 (선택, 숫자만)</span>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="예: 4 (Visa 테스트 접두사)"
              inputMode="numeric"
              aria-label="접두사"
              className="font-mono"
            />
            {prefix && sanitizedPrefix !== prefix && (
              <span className="text-xs text-muted-foreground">
                숫자만, 최대 {length - 1}자까지 사용됩니다 → <span className="font-mono">{sanitizedPrefix}</span>
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={regenerate}>
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden />
              다시 생성
            </Button>
            {numbers.length > 1 && (
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

        {numbers.length > 0 && (
          <ul className="space-y-2" aria-label="생성된 번호 목록">
            {numbers.map((number, index) => (
              <li
                key={`${index}-${number}`}
                className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3"
              >
                <span className="select-all break-all font-mono text-base">{number}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyOne(number, index)}
                  aria-label={`${index + 1}번째 번호 복사`}
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
          모든 생성은 브라우저 안에서만 수행되며 서버로 전송되지 않습니다. 실제 결제·인증 용도로 사용하지 마세요.
        </p>
      </main>
    </div>
  );
}
