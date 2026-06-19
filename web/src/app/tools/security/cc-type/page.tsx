'use client';

import { useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { isLuhnValid } from '@/lib/tools/cc-validate';

/** 카드 브랜드 판별 규칙 — prefix(정규식)와 허용 자릿수. */
interface BrandRule {
  name: string;
  pattern: RegExp;
  lengths: number[];
}

/**
 * 브랜드 판별 규칙 (위에서부터 먼저 일치하는 것 사용).
 * prefix·길이 기준은 각 카드사 공개 BIN 범위를 따른다.
 */
const BRAND_RULES: readonly BrandRule[] = [
  { name: 'Visa', pattern: /^4/, lengths: [13, 16, 19] },
  // Mastercard: 51–55 또는 2221–2720
  { name: 'Mastercard', pattern: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/, lengths: [16] },
  { name: 'American Express', pattern: /^3[47]/, lengths: [15] },
  // Discover: 6011, 65, 644–649
  { name: 'Discover', pattern: /^(6011|65|64[4-9])/, lengths: [16] },
  // Diners Club: 300–305, 36, 38
  { name: 'Diners Club', pattern: /^(30[0-5]|36|38)/, lengths: [14] },
  // JCB: 3528–3589
  { name: 'JCB', pattern: /^35(2[89]|[3-8]\d)/, lengths: [16] },
  { name: 'UnionPay', pattern: /^62/, lengths: [16, 17, 18, 19] },
] as const;

interface CardTypeResult {
  digits: string;
  brand: BrandRule | null;
  luhnValid: boolean;
  lengthValid: boolean;
}

/** 입력에서 숫자만 추출(공백·하이픈 등 제거). */
function extractDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** prefix 가 일치하는 첫 브랜드 규칙을 찾는다(길이 무관). */
function detectBrand(digits: string): BrandRule | null {
  return BRAND_RULES.find((rule) => rule.pattern.test(digits)) ?? null;
}

/** 카드번호의 브랜드·Luhn·길이를 분석한다. */
function analyzeCard(raw: string): CardTypeResult | null {
  const digits = extractDigits(raw);
  if (digits.length === 0) return null;
  const brand = detectBrand(digits);
  return {
    digits,
    brand,
    luhnValid: isLuhnValid(digits),
    lengthValid: brand ? brand.lengths.includes(digits.length) : digits.length >= 12 && digits.length <= 19,
  };
}

export default function CreditCardTypePage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => analyzeCard(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="카드 브랜드 판별" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <CreditCard className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          카드번호의 앞자리·길이로 Visa·Mastercard·Amex·Discover·Diners·JCB·UnionPay 를 판별하고 Luhn 통과
          여부를 확인합니다. 공백·하이픈은 자동으로 무시됩니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">카드번호</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 4111 1111 1111 1111"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-label="카드번호"
            className="font-mono"
          />
        </label>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-medium">
                브랜드: {result.brand ? result.brand.name : '알 수 없음'}
              </span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">자릿수</dt>
              <dd>
                {result.digits.length}자리{' '}
                <span className={result.lengthValid ? 'text-emerald-600' : 'text-destructive'}>
                  ({result.lengthValid ? '허용 범위' : '범위 벗어남'})
                </span>
              </dd>

              {result.brand && (
                <>
                  <dt className="text-muted-foreground">허용 자릿수</dt>
                  <dd className="font-mono">{result.brand.lengths.join(', ')}자리</dd>
                </>
              )}

              <dt className="text-muted-foreground">Luhn 체크섬</dt>
              <dd className={result.luhnValid ? 'text-emerald-600' : 'text-destructive'}>
                {result.luhnValid ? '통과' : '실패'}
              </dd>
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          브랜드 판별과 Luhn 검증은 형식 확인일 뿐 실제 사용 가능한 카드인지는 알 수 없습니다. 모든 처리는
          브라우저 안에서만 수행되며 입력한 카드번호는 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
