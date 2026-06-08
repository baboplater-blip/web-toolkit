'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Radix = 2 | 8 | 10 | 16;

const RADIX_OPTIONS: Array<{ value: Radix; label: string }> = [
  { value: 2, label: '2진수' },
  { value: 8, label: '8진수' },
  { value: 10, label: '10진수' },
  { value: 16, label: '16진수' },
];

const RADIX_PATTERN: Record<Radix, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-f]+$/i,
};

interface Converted {
  binary: string;
  octal: string;
  decimal: string;
  hex: string;
  bitLength: number;
  negative: boolean;
}

/**
 * 입력 문자열을 지정한 진법으로 파싱해 BigInt 로 변환한다.
 * 잘못된 형식이거나 빈 값이면 에러 메시지를 반환한다.
 */
function parseInput(raw: string, radix: Radix): Converted | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: '' };

  const negative = trimmed.startsWith('-');
  const digits = negative ? trimmed.slice(1) : trimmed;

  if (!digits) {
    return { error: '숫자를 입력해 주세요.' };
  }
  if (!RADIX_PATTERN[radix].test(digits)) {
    return {
      error: `선택한 진법(${radix})에 맞지 않는 문자가 있습니다.`,
    };
  }

  let value: bigint;
  try {
    // BigInt 는 16진수 0x, 2진수 0b, 8진수 0o 접두사를 인식한다.
    const prefix = radix === 16 ? '0x' : radix === 8 ? '0o' : radix === 2 ? '0b' : '';
    value = BigInt(prefix + digits);
  } catch {
    return { error: '숫자를 변환할 수 없습니다.' };
  }

  const magnitude = value; // digits 는 부호 없는 양수
  const sign = negative ? '-' : '';

  return {
    binary: sign + magnitude.toString(2),
    octal: sign + magnitude.toString(8),
    decimal: sign + magnitude.toString(10),
    hex: sign + magnitude.toString(16).toUpperCase(),
    bitLength: magnitude === BigInt(0) ? 1 : magnitude.toString(2).length,
    negative,
  };
}

export default function BaseConverterPage() {
  const [input, setInput] = useState('255');
  const [radix, setRadix] = useState<Radix>(10);
  const [copied, setCopied] = useState<string | null>(null);

  const parsed = useMemo(() => parseInput(input, radix), [input, radix]);
  const result = 'error' in parsed ? null : parsed;
  const error = result ? null : (parsed as { error: string }).error;

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* 클립보드 접근 불가 환경 — 조용히 무시 */
    }
  };

  const handleReset = () => {
    setInput('255');
    setRadix(10);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="진수 변환기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          2·8·10·16진수를 서로 변환하고 비트 표현을 함께 보여줍니다.
        </p>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <span className="block text-sm font-medium">입력 진법</span>
          <div className="flex flex-wrap gap-1.5">
            {RADIX_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={radix === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRadix(opt.value)}
                aria-pressed={radix === opt.value}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">값</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="변환할 숫자"
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            aria-label="변환할 값"
            aria-invalid={Boolean(error)}
          />
        </label>

        {error && (
          <div role="alert" className="text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              변환 결과
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              비트 길이 {result.bitLength}bit
            </span>
          </div>

          <div className="space-y-2">
            <ResultRow
              label="2진수"
              value={result.binary}
              copied={copied === 'binary'}
              onCopy={() => copy('binary', result.binary)}
            />
            <ResultRow
              label="8진수"
              value={result.octal}
              copied={copied === 'octal'}
              onCopy={() => copy('octal', result.octal)}
            />
            <ResultRow
              label="10진수"
              value={result.decimal}
              copied={copied === 'decimal'}
              onCopy={() => copy('decimal', result.decimal)}
            />
            <ResultRow
              label="16진수"
              value={result.hex}
              copied={copied === 'hex'}
              onCopy={() => copy('hex', result.hex)}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
        <p>
          <code className="font-mono">BigInt</code> 로 파싱하므로 자릿수 제한 없이 매우 큰 정수도
          정확히 변환합니다. 음수는 맨 앞에 <code className="font-mono">-</code> 를 붙여 입력하세요.
        </p>
      </div>
      </main>
    </div>
  );
}

function ResultRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
      <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 break-all font-mono text-sm">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={`${label} 복사`}
        title="복사"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
