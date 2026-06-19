'use client';

import { useMemo, useState } from 'react';
import { Car } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

/** VIN 문자 → 숫자 음역표(I, O, Q 는 사용 불가). 숫자는 자기 자신. */
const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

/** 위치 1..17 의 가중치(9번째=체크 디지트 위치는 0). */
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const VIN_LENGTH = 17;
const CHECK_INDEX = 8; // 9번째 자리(0-base)

interface ValidationResult {
  valid: boolean;
  reason: string;
  normalized: string;
  expectedCheck?: string;
  actualCheck?: string;
}

/** 공백·하이픈 제거 후 대문자로 정규화한다. */
function normalize(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

/** 한 문자의 음역값을 반환한다. 숫자면 자기 자신, 유효한 문자면 매핑값, 그 외 null. */
function transliterate(char: string): number | null {
  if (char >= '0' && char <= '9') return char.charCodeAt(0) - 48;
  const mapped = TRANSLITERATION[char];
  return mapped === undefined ? null : mapped;
}

/** VIN 문자열을 검증하고 기대 체크 디지트를 반환한다. */
function validateVin(raw: string): ValidationResult | null {
  const value = normalize(raw);
  if (!value) return null;

  const base = { normalized: value };

  if (value.length !== VIN_LENGTH) {
    return {
      ...base,
      valid: false,
      reason: `길이 오류: VIN 은 ${VIN_LENGTH}자여야 하지만 ${value.length}자입니다.`,
    };
  }

  // I, O, Q 는 1/0 과 혼동되므로 VIN 에 쓰일 수 없다.
  if (/[IOQ]/.test(value)) {
    return {
      ...base,
      valid: false,
      reason: '문자 오류: VIN 에는 I, O, Q 를 사용할 수 없습니다(숫자 1·0 과 혼동 방지).',
    };
  }

  let sum = 0;
  for (let i = 0; i < VIN_LENGTH; i += 1) {
    const numericValue = transliterate(value[i]);
    if (numericValue === null) {
      return {
        ...base,
        valid: false,
        reason: `문자 오류: ${i + 1}번째 자리 '${value[i]}' 는 VIN 에 사용할 수 없는 문자입니다.`,
      };
    }
    sum += numericValue * WEIGHTS[i];
  }

  const remainder = sum % 11;
  const expectedCheck = remainder === 10 ? 'X' : String(remainder);
  const actualCheck = value[CHECK_INDEX];
  const valid = expectedCheck === actualCheck;

  return {
    ...base,
    valid,
    expectedCheck,
    actualCheck,
    reason: valid
      ? '체크 디지트(ISO 3779)가 일치합니다.'
      : `체크 디지트 불일치: 9번째 자리는 '${expectedCheck}' 여야 하지만 '${actualCheck}' 입니다.`,
  };
}

export default function VinValidatePage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateVin(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="VIN(차대번호) 검증" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Car className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          17자리 VIN(ISO 3779)의 형식과 체크 디지트를 검증합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">VIN</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 1HGBH41JXMN109186"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="VIN"
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
              {result.valid ? '유효한 VIN 입니다.' : '유효하지 않은 VIN 입니다.'}
              <span className="mt-1 block text-xs font-normal">{result.reason}</span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">정규화</dt>
              <dd className="break-all font-mono">{result.normalized}</dd>

              <dt className="text-muted-foreground">길이</dt>
              <dd>
                {result.normalized.length}자 / 기준 {VIN_LENGTH}자
              </dd>

              {result.expectedCheck !== undefined && (
                <>
                  <dt className="text-muted-foreground">기대 체크 디지트</dt>
                  <dd className="font-mono">{result.expectedCheck}</dd>

                  <dt className="text-muted-foreground">입력 체크 디지트</dt>
                  <dd className="font-mono">{result.actualCheck}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          체크 디지트 검증은 ISO 3779 표준(북미식)을 따릅니다. 일부 지역·제조사는 이 체크 디지트 규칙을
          따르지 않을 수 있습니다. 모든 검증은 브라우저 안에서만 수행되며 입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
