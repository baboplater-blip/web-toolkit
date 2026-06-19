'use client';

import { useMemo, useState } from 'react';
import { Barcode } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

/** 자릿수별로 적용할 GTIN 포맷 정의(체크 자리 포함 전체 길이). */
const FORMATS: Record<number, string> = {
  8: 'EAN-8',
  12: 'UPC-A',
  13: 'EAN-13',
};

interface ValidationResult {
  valid: boolean;
  reason: string;
  format?: string;
  digits: string;
  actualCheckDigit?: string;
  expectedCheckDigit?: number;
}

/** 공백·하이픈을 제거한다(다른 문자는 형식 검증에서 걸러진다). */
function normalize(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

/**
 * GTIN 체크 디지트를 계산한다.
 * 체크 자리를 제외한 데이터 숫자를 오른쪽에서부터 가중치 3,1 을 번갈아 적용
 * (가장 오른쪽 데이터 숫자가 ×3), 합의 10 보수가 기대 체크 디지트.
 * @param dataDigits 체크 자리를 제외한 데이터 숫자 배열.
 * @returns 0~9 의 기대 체크 디지트.
 */
function computeCheckDigit(dataDigits: number[]): number {
  let sum = 0;
  // 오른쪽 끝(마지막 데이터 숫자)에 ×3, 그 왼쪽에 ×1 순으로 번갈아 적용한다.
  for (let i = 0; i < dataDigits.length; i += 1) {
    const fromRight = dataDigits.length - 1 - i;
    const weight = fromRight % 2 === 0 ? 3 : 1;
    sum += dataDigits[i] * weight;
  }
  return (10 - (sum % 10)) % 10;
}

/** EAN-13·EAN-8·UPC-A 바코드 번호를 검증한다. */
function validateBarcode(raw: string): ValidationResult | null {
  const digits = normalize(raw);
  if (!digits) return null;

  const base = { digits };

  if (!/^[0-9]+$/.test(digits)) {
    return {
      ...base,
      valid: false,
      reason: '형식 오류: 숫자만 입력할 수 있습니다(공백·하이픈은 자동 제거).',
    };
  }

  const format = FORMATS[digits.length];
  if (!format) {
    return {
      ...base,
      valid: false,
      reason: `길이 오류: 지원 길이는 EAN-8(8자리)·UPC-A(12자리)·EAN-13(13자리)이지만 ${digits.length}자리입니다.`,
    };
  }

  const dataDigits = digits.slice(0, -1).split('').map(Number);
  const actualCheckDigit = digits.slice(-1);
  const expectedCheckDigit = computeCheckDigit(dataDigits);
  const valid = Number(actualCheckDigit) === expectedCheckDigit;

  return {
    ...base,
    valid,
    format,
    actualCheckDigit,
    expectedCheckDigit,
    reason: valid
      ? `유효한 ${format} 번호입니다(체크 디지트 일치).`
      : `체크 디지트 오류: 입력은 ${actualCheckDigit}, 기대값은 ${expectedCheckDigit} 입니다.`,
  };
}

export default function EanValidatePage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateBarcode(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EAN/UPC 바코드 검증" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Barcode className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          EAN-13·EAN-8·UPC-A 번호의 자릿수를 자동 판별하고 GTIN 체크 디지트를 검증합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">바코드 번호</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 4006381333931"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-label="바코드 번호"
            className="font-mono"
          />
        </label>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div
              role="status"
              className={`rounded-md border p-3 text-sm font-medium ${
                result.valid
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {result.valid ? '유효한 바코드입니다.' : '유효하지 않은 바코드입니다.'}
              <span className="mt-1 block text-xs font-normal">{result.reason}</span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">정규화</dt>
              <dd className="break-all font-mono">{result.digits}</dd>

              <dt className="text-muted-foreground">형식</dt>
              <dd>{result.format ?? '판별 불가'}</dd>

              {result.actualCheckDigit !== undefined && (
                <>
                  <dt className="text-muted-foreground">입력 체크 디지트</dt>
                  <dd className="font-mono">{result.actualCheckDigit}</dd>
                </>
              )}

              {result.expectedCheckDigit !== undefined && (
                <>
                  <dt className="text-muted-foreground">기대 체크 디지트</dt>
                  <dd className="font-mono">{result.expectedCheckDigit}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          체크 디지트는 입력 오류를 잡아낼 뿐 실제 등록된 상품인지는 보장하지 않습니다. 모든 검증은 브라우저
          안에서만 수행되며 입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
