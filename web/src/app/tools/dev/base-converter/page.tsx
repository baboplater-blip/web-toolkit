'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { ShareLinkButton } from '@/components/tools/ShareLinkButton';
import { useToolUrlState } from '@/lib/use-tool-url-state';
import { parseInput, type Radix } from '@/lib/tools/base-converter';

const RADIX_OPTIONS: Array<{ value: Radix; label: string }> = [
  { value: 2, label: '2진수' },
  { value: 8, label: '8진수' },
  { value: 10, label: '10진수' },
  { value: 16, label: '16진수' },
];

const ALLOWED_RADIX: Radix[] = [2, 8, 10, 16];
const isRadix = (value: number): value is Radix => (ALLOWED_RADIX as number[]).includes(value);

export default function BaseConverterPage() {
  // 입력 값·진법을 URL 쿼리로 관리(공유·복원). 초기 렌더는 결정적 기본값.
  const [urlState, patchUrlState] = useToolUrlState(
    { value: '255', radix: 10 },
    { numericKeys: ['radix'] },
  );
  const input = urlState.value;
  const radix: Radix = isRadix(urlState.radix) ? urlState.radix : 10;
  const setInput = (next: string) => patchUrlState({ value: next });
  const setRadix = (next: Radix) => patchUrlState({ radix: next });

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
    patchUrlState({ value: '255', radix: 10 });
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="진수 변환기" widthClass="max-w-xl" onReset={handleReset}>
        <ShareLinkButton />
      </ToolHeader>
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
