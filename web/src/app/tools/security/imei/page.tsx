'use client';

import { useMemo, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

const IMEI_LENGTH = 15;

interface ValidationResult {
  valid: boolean;
  reason: string;
  normalized: string;
  /** 14자리 입력 시 계산한 마지막 체크 숫자(완성된 15자리 IMEI). */
  completed?: string;
}

/** 공백·하이픈 제거 후 숫자만 남긴 정규화 결과를 반환한다. */
function normalize(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

/**
 * Luhn 합계를 계산한다(오른쪽에서 두 번째 자리부터 ×2, 9 초과 시 -9).
 * @param digits 숫자로만 구성된 문자열.
 */
function luhnSum(digits: string): number {
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i += 1) {
    let value = digits.charCodeAt(len - 1 - i) - 48;
    // 가장 오른쪽(i=0)은 배수 없음, 그 왼쪽부터 한 칸 건너 ×2.
    if (i % 2 === 1) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
  }
  return sum;
}

/** 14자리 본문에 대한 Luhn 체크 숫자를 계산한다. */
function luhnCheckDigit(first14: string): number {
  // 체크 숫자 자리(0)를 포함해 합을 구하면, 본문은 짝/홀 위치가 한 칸씩 밀린다.
  // 14자리 뒤에 0 을 붙여 15자리로 만든 뒤 Luhn 합을 계산하면 본문 가중치가 맞춰진다.
  const sum = luhnSum(`${first14}0`);
  return (10 - (sum % 10)) % 10;
}

/** IMEI 문자열을 검증한다. 15자리는 Luhn 검증, 14자리는 체크 숫자 계산을 제공한다. */
function validateImei(raw: string): ValidationResult | null {
  const value = normalize(raw);
  if (!value) return null;

  const base = { normalized: value };

  if (!/^[0-9]+$/.test(value)) {
    return {
      ...base,
      valid: false,
      reason: '문자 오류: IMEI 는 숫자로만 구성됩니다.',
    };
  }

  if (value.length === 14) {
    const check = luhnCheckDigit(value);
    return {
      ...base,
      valid: false,
      completed: value + check,
      reason: `14자리가 입력되었습니다. 마지막 체크 숫자는 '${check}' 입니다(아래 완성본 참고).`,
    };
  }

  if (value.length !== IMEI_LENGTH) {
    return {
      ...base,
      valid: false,
      reason: `길이 오류: IMEI 는 ${IMEI_LENGTH}자리여야 하지만 ${value.length}자리입니다.`,
    };
  }

  const valid = luhnSum(value) % 10 === 0;
  return {
    ...base,
    valid,
    reason: valid
      ? 'Luhn 체크섬을 통과했습니다.'
      : 'Luhn 체크섬이 맞지 않습니다(자릿수 오류 또는 입력 실수).',
  };
}

export default function ImeiValidatePage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateImei(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="IMEI 검증" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Smartphone className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          15자리 IMEI 의 Luhn 체크섬을 검증합니다. 14자리를 입력하면 체크 숫자를 계산합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">IMEI</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 490154203237518"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-label="IMEI"
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
              {result.valid ? '유효한 IMEI 입니다.' : '유효하지 않은 IMEI 입니다.'}
              <span className="mt-1 block text-xs font-normal">{result.reason}</span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">정규화</dt>
              <dd className="break-all font-mono">{result.normalized}</dd>

              <dt className="text-muted-foreground">길이</dt>
              <dd>{result.normalized.length}자리</dd>

              {result.completed && (
                <>
                  <dt className="text-muted-foreground">완성된 IMEI</dt>
                  <dd className="break-all font-mono">{result.completed}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Luhn 체크섬은 입력 오류를 잡아낼 뿐 실제 단말기에 할당된 IMEI 인지는 보장하지 않습니다. 모든 검증은
          브라우저 안에서만 수행되며 입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
