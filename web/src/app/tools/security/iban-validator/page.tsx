'use client';

import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

/**
 * 국가별 IBAN 전체 길이 + (선택) 은행/계좌 분해 규칙.
 * bban 구조는 BBAN 내에서의 [은행코드 시작, 길이] · [계좌 시작, 길이] (0-base, BBAN 기준).
 */
interface CountrySpec {
  length: number;
  name: string;
  bankCode?: [number, number];
  accountNumber?: [number, number];
}

const COUNTRY_SPECS: Record<string, CountrySpec> = {
  AD: { length: 24, name: '안도라' },
  AT: { length: 20, name: '오스트리아', bankCode: [0, 5], accountNumber: [5, 11] },
  BE: { length: 16, name: '벨기에', bankCode: [0, 3], accountNumber: [3, 7] },
  CH: { length: 21, name: '스위스', bankCode: [0, 5], accountNumber: [5, 12] },
  CZ: { length: 24, name: '체코' },
  DE: { length: 22, name: '독일', bankCode: [0, 8], accountNumber: [8, 10] },
  DK: { length: 18, name: '덴마크', bankCode: [0, 4], accountNumber: [4, 10] },
  ES: { length: 24, name: '스페인', bankCode: [0, 4], accountNumber: [10, 10] },
  FI: { length: 18, name: '핀란드' },
  FR: { length: 27, name: '프랑스', bankCode: [0, 5], accountNumber: [10, 11] },
  GB: { length: 22, name: '영국', bankCode: [0, 4], accountNumber: [10, 8] },
  GR: { length: 27, name: '그리스', bankCode: [0, 3], accountNumber: [7, 16] },
  IE: { length: 22, name: '아일랜드', bankCode: [0, 4], accountNumber: [10, 8] },
  IT: { length: 27, name: '이탈리아', bankCode: [1, 5], accountNumber: [11, 12] },
  LU: { length: 20, name: '룩셈부르크', bankCode: [0, 3], accountNumber: [3, 13] },
  NL: { length: 18, name: '네덜란드', bankCode: [0, 4], accountNumber: [4, 10] },
  NO: { length: 15, name: '노르웨이', bankCode: [0, 4], accountNumber: [4, 7] },
  PL: { length: 28, name: '폴란드', bankCode: [0, 8], accountNumber: [8, 16] },
  PT: { length: 25, name: '포르투갈', bankCode: [0, 4], accountNumber: [8, 11] },
  SE: { length: 24, name: '스웨덴', bankCode: [0, 3], accountNumber: [3, 17] },
};

interface ValidationResult {
  valid: boolean;
  reason: string;
  countryCode: string;
  countryName?: string;
  expectedLength?: number;
  actualLength: number;
  checkDigits?: string;
  bankCode?: string;
  accountNumber?: string;
  formatted: string;
}

/** 공백·하이픈 제거 후 대문자로 정규화한다. */
function normalize(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

/** 4자리씩 끊어 사람이 읽기 좋은 형태로 포맷한다. */
function formatGroups(value: string): string {
  return value.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * IBAN mod-97 체크섬을 계산한다(ISO 7064 MOD-97-10).
 * 앞 4자(국가코드 2 + 체크숫자 2)를 뒤로 이동 → 문자를 A=10..Z=35 로 변환 →
 * 큰 정수를 97 로 나눈 나머지. 나머지가 1 이면 유효.
 */
function mod97(rearranged: string): number {
  let remainder = 0;
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    // 숫자(0~9) 는 그대로, 문자(A~Z) 는 10~35 로 치환.
    const fragment = code >= 65 && code <= 90 ? (code - 55).toString() : char;
    for (const digit of fragment) {
      remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder;
}

/** IBAN 문자열을 검증하고 분해 결과를 반환한다. */
function validateIban(raw: string): ValidationResult | null {
  const value = normalize(raw);
  if (!value) return null;

  const base = {
    actualLength: value.length,
    countryCode: value.slice(0, 2),
    formatted: formatGroups(value),
  };

  // 1) 기본 형식: 2자 국가코드 + 2자 체크숫자 + 영숫자 BBAN.
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(value)) {
    return {
      ...base,
      valid: false,
      reason: '형식 오류: IBAN 은 2자 국가코드 + 2자 체크숫자 + 계좌식별자(영숫자)로 구성됩니다.',
    };
  }

  const countryCode = value.slice(0, 2);
  const spec = COUNTRY_SPECS[countryCode];

  // 2) 국가별 길이 검증(알려진 국가에 한해).
  if (spec && value.length !== spec.length) {
    return {
      ...base,
      valid: false,
      countryName: spec.name,
      expectedLength: spec.length,
      reason: `길이 오류: ${spec.name}(${countryCode}) IBAN 은 ${spec.length}자여야 하지만 ${value.length}자입니다.`,
    };
  }

  // 3) mod-97 체크섬 검증(앞 4자를 뒤로 이동).
  const rearranged = value.slice(4) + value.slice(0, 4);
  const remainder = mod97(rearranged);
  if (remainder !== 1) {
    return {
      ...base,
      valid: false,
      countryName: spec?.name,
      expectedLength: spec?.length,
      checkDigits: value.slice(2, 4),
      reason: `체크섬 오류: mod-97 결과가 ${remainder}(유효값 1)이므로 자릿수가 틀렸거나 입력 오류입니다.`,
    };
  }

  // 4) 유효 — 가능하면 은행/계좌 분해(BBAN = 5번째 문자부터).
  const bban = value.slice(4);
  const bankCode = spec?.bankCode ? bban.slice(spec.bankCode[0], spec.bankCode[0] + spec.bankCode[1]) : undefined;
  const accountNumber = spec?.accountNumber
    ? bban.slice(spec.accountNumber[0], spec.accountNumber[0] + spec.accountNumber[1])
    : undefined;

  return {
    ...base,
    valid: true,
    countryName: spec?.name,
    expectedLength: spec?.length,
    checkDigits: value.slice(2, 4),
    bankCode,
    accountNumber,
    reason: spec
      ? `유효한 IBAN 입니다(${spec.name}, mod-97 통과).`
      : '유효한 IBAN 형식입니다(mod-97 통과). 단, 등록되지 않은 국가코드라 길이·분해 정보는 제한적입니다.',
  };
}

export default function IbanValidatorPage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateIban(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="IBAN 검증" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Landmark className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          IBAN 의 형식·국가별 길이·mod-97 체크섬을 검증하고 국가·은행·계좌로 분해합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">IBAN</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: DE89 3704 0044 0532 0130 00"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="IBAN"
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
              {result.valid ? '유효한 IBAN 입니다.' : '유효하지 않은 IBAN 입니다.'}
              <span className="mt-1 block text-xs font-normal">{result.reason}</span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">정규화</dt>
              <dd className="break-all font-mono">{result.formatted}</dd>

              <dt className="text-muted-foreground">국가</dt>
              <dd>
                {result.countryCode}
                {result.countryName ? ` (${result.countryName})` : ' (미등록 국가코드)'}
              </dd>

              <dt className="text-muted-foreground">길이</dt>
              <dd>
                {result.actualLength}자
                {result.expectedLength
                  ? ` / 기준 ${result.expectedLength}자`
                  : ''}
              </dd>

              {result.checkDigits && (
                <>
                  <dt className="text-muted-foreground">체크숫자</dt>
                  <dd className="font-mono">{result.checkDigits}</dd>
                </>
              )}

              {result.bankCode && (
                <>
                  <dt className="text-muted-foreground">은행코드</dt>
                  <dd className="font-mono">{result.bankCode}</dd>
                </>
              )}

              {result.accountNumber && (
                <>
                  <dt className="text-muted-foreground">계좌번호</dt>
                  <dd className="break-all font-mono">{result.accountNumber}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          mod-97 체크섬은 입력 오류를 잡아낼 뿐 실제 존재하는 계좌인지는 보장하지 않습니다. 모든 검증은 브라우저
          안에서만 수행되며 입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
