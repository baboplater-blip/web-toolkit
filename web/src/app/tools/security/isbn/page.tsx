'use client';

import { useMemo, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

type IsbnFormat = 'isbn-10' | 'isbn-13';

interface ValidationResult {
  valid: boolean;
  reason: string;
  format?: IsbnFormat;
  normalized: string;
  /** 다른 포맷으로의 변환 결과(가능할 때). */
  converted?: string;
  convertedLabel?: string;
}

/** 하이픈·공백을 제거하고 대문자(X)로 정규화한다. */
function normalize(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * ISBN-10 체크섬을 검증한다.
 * Σ digit_i × (10−i) (i=0..9) ≡ 0 (mod 11). 마지막 자리는 'X'(=10) 허용.
 */
function isValidIsbn10(value: string): boolean {
  if (!/^[0-9]{9}[0-9X]$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const char = value[i];
    const digit = char === 'X' ? 10 : char.charCodeAt(0) - 48;
    sum += digit * (10 - i);
  }
  return sum % 11 === 0;
}

/**
 * ISBN-13 체크섬을 검증한다.
 * Σ digit_i × (i 가 짝수면 1, 홀수면 3) (i=0..12) ≡ 0 (mod 10).
 */
function isValidIsbn13(value: string): boolean {
  if (!/^[0-9]{13}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i += 1) {
    const digit = value.charCodeAt(i) - 48;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

/** ISBN-13 의 mod-10 체크 숫자를 계산한다(앞 12자리 기준). */
function isbn13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const digit = first12.charCodeAt(i) - 48;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/** ISBN-10 의 mod-11 체크 문자를 계산한다(앞 9자리 기준). 10 이면 'X'. */
function isbn10CheckChar(first9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    const digit = first9.charCodeAt(i) - 48;
    sum += digit * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return check === 10 ? 'X' : String(check);
}

/** 유효한 ISBN-10 을 ISBN-13(978 접두)으로 변환한다. */
function convertIsbn10To13(isbn10: string): string {
  const core = `978${isbn10.slice(0, 9)}`;
  return core + isbn13CheckDigit(core);
}

/** 유효한 978-ISBN-13 을 ISBN-10 으로 변환한다(979 접두는 변환 불가). */
function convertIsbn13To10(isbn13: string): string | null {
  if (!isbn13.startsWith('978')) return null;
  const first9 = isbn13.slice(3, 12);
  return first9 + isbn10CheckChar(first9);
}

/** ISBN 문자열을 검증하고 변환 결과까지 반환한다. */
function validateIsbn(raw: string): ValidationResult | null {
  const value = normalize(raw);
  if (!value) return null;

  if (value.length === 10) {
    const valid = isValidIsbn10(value);
    return {
      valid,
      normalized: value,
      format: 'isbn-10',
      reason: valid
        ? 'ISBN-10 체크섬(mod-11)을 통과했습니다.'
        : '형식은 ISBN-10 이지만 체크섬(mod-11)이 맞지 않습니다.',
      converted: valid ? convertIsbn10To13(value) : undefined,
      convertedLabel: valid ? 'ISBN-13' : undefined,
    };
  }

  if (value.length === 13) {
    const valid = isValidIsbn13(value);
    const converted = valid ? convertIsbn13To10(value) : null;
    return {
      valid,
      normalized: value,
      format: 'isbn-13',
      reason: valid
        ? 'ISBN-13 체크섬(mod-10)을 통과했습니다.'
        : '형식은 ISBN-13 이지만 체크섬(mod-10)이 맞지 않습니다.',
      converted: converted ?? undefined,
      convertedLabel: converted ? 'ISBN-10' : undefined,
    };
  }

  return {
    valid: false,
    normalized: value,
    reason: `길이 오류: ISBN 은 10자리 또는 13자리여야 하지만 ${value.length}자입니다.`,
  };
}

export default function IsbnValidatePage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateIsbn(input), [input]);

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="ISBN 검증" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <BookMarked className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          ISBN-10 / ISBN-13 의 형식과 체크섬을 검증하고 두 포맷 간 변환을 보여줍니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">ISBN</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 978-89-6626-256-1"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="ISBN"
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
              {result.valid ? '유효한 ISBN 입니다.' : '유효하지 않은 ISBN 입니다.'}
              <span className="mt-1 block text-xs font-normal">{result.reason}</span>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">정규화</dt>
              <dd className="break-all font-mono">{result.normalized}</dd>

              <dt className="text-muted-foreground">포맷</dt>
              <dd>
                {result.format === 'isbn-10'
                  ? 'ISBN-10'
                  : result.format === 'isbn-13'
                    ? 'ISBN-13'
                    : '판별 불가'}
              </dd>

              {result.converted && result.convertedLabel && (
                <>
                  <dt className="text-muted-foreground">{result.convertedLabel} 변환</dt>
                  <dd className="break-all font-mono">{result.converted}</dd>
                </>
              )}
            </dl>

            {result.valid && result.format === 'isbn-13' && !result.converted && (
              <p className="text-xs text-muted-foreground">
                979 로 시작하는 ISBN-13 은 대응하는 ISBN-10 이 존재하지 않아 변환할 수 없습니다.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          체크섬은 입력 오류를 잡아낼 뿐 실제 출판된 도서인지는 보장하지 않습니다. 모든 검증은 브라우저
          안에서만 수행되며 입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
