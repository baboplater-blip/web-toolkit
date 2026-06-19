'use client';

import { useMemo, useState } from 'react';
import { Banknote, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface CurrencyOption {
  code: string;
  locale: string;
  label: string;
}

const CURRENCIES: readonly CurrencyOption[] = [
  { code: 'KRW', locale: 'ko-KR', label: '원 (KRW · ko-KR)' },
  { code: 'USD', locale: 'en-US', label: '달러 (USD · en-US)' },
  { code: 'EUR', locale: 'de-DE', label: '유로 (EUR · de-DE)' },
  { code: 'JPY', locale: 'ja-JP', label: '엔 (JPY · ja-JP)' },
  { code: 'GBP', locale: 'en-GB', label: '파운드 (GBP · en-GB)' },
];

export default function CurrencyFormatPage() {
  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('KRW');
  const [decimals, setDecimals] = useState('');
  const [copied, setCopied] = useState<'currency' | 'plain' | null>(null);

  const result = useMemo(() => {
    const trimmed = amount.replace(/,/g, '').trim();
    if (trimmed === '') return null;
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return null;

    const option = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

    // 빈 값이면 통화 기본 소수 자릿수를 사용하도록 옵션을 생략한다.
    const fractionDigits =
      decimals.trim() === '' ? null : Math.min(20, Math.max(0, Math.floor(Number(decimals)) || 0));

    const currencyOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: option.code,
    };
    const plainOptions: Intl.NumberFormatOptions = {
      style: 'decimal',
    };
    if (fractionDigits !== null) {
      currencyOptions.minimumFractionDigits = fractionDigits;
      currencyOptions.maximumFractionDigits = fractionDigits;
      plainOptions.minimumFractionDigits = fractionDigits;
      plainOptions.maximumFractionDigits = fractionDigits;
    }

    return {
      currency: new Intl.NumberFormat(option.locale, currencyOptions).format(value),
      plain: new Intl.NumberFormat(option.locale, plainOptions).format(value),
    };
  }, [amount, currencyCode, decimals]);

  const reset = () => {
    setAmount('');
    setCurrencyCode('KRW');
    setDecimals('');
    setCopied(null);
  };

  const copy = async (kind: 'currency' | 'plain') => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(kind === 'currency' ? result.currency : result.plain);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* 클립보드 접근 불가 시 무시 */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="통화 형식 변환" onReset={reset} />

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          숫자를 통화·천단위 구분 형식으로 표시합니다. 환율 변환은 하지 않습니다(서식만).
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">숫자</span>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 1234567.89"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">통화 / 로케일</span>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                aria-label="통화 / 로케일"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">소수 자릿수 (비우면 통화 기본값)</span>
              <Input
                inputMode="numeric"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                placeholder="자동"
              />
            </label>
          </div>
        </div>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">통화 형식</p>
                <p className="truncate text-2xl font-bold tabular-nums">{result.currency}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copy('currency')}>
                {copied === 'currency' ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    복사
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">천단위 구분 숫자</p>
                <p className="truncate text-2xl font-bold tabular-nums">{result.plain}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copy('plain')}>
                {copied === 'plain' ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    복사
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <code className="font-mono">Intl.NumberFormat</code> 기반 로케일별 통화 서식. 모든 처리는
            브라우저에서 즉시 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
