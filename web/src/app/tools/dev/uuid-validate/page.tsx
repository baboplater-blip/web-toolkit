'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Fingerprint, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 8-4-4-4-12 hex, 선택적 중괄호 허용. */
const UUID_PATTERN = /^\{?([0-9a-fA-F]{8})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{12})\}?$/;
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

interface ValidationResult {
  valid: boolean;
  isNil: boolean;
  /** 1~5, 0(nil/미정의), 또는 null(유효하지 않음) */
  version: number | null;
  variant: string | null;
  normalized: string | null;
}

const VERSION_LABELS: Record<number, string> = {
  1: 'v1 (시간 기반)',
  2: 'v2 (DCE 보안)',
  3: 'v3 (MD5 이름 기반)',
  4: 'v4 (무작위)',
  5: 'v5 (SHA-1 이름 기반)',
};

/**
 * variant 는 17번째 hex 숫자(= clock_seq_hi_and_reserved 의 상위 니블) 비트로 판별한다.
 * 0xxx → NCS(예약), 10xx → RFC 4122, 110x → Microsoft, 111x → 예약.
 */
function detectVariant(variantNibble: number): string {
  if ((variantNibble & 0b1000) === 0) return 'NCS (레거시 예약)';
  if ((variantNibble & 0b1100) === 0b1000) return 'RFC 4122';
  if ((variantNibble & 0b1110) === 0b1100) return 'Microsoft';
  return '예약됨';
}

function validate(raw: string): ValidationResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = UUID_PATTERN.exec(trimmed);
  if (!match) {
    return { valid: false, isNil: false, version: null, variant: null, normalized: null };
  }

  const normalized = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`.toLowerCase();

  if (normalized === NIL_UUID) {
    return { valid: true, isNil: true, version: 0, variant: 'nil', normalized };
  }

  // 버전: 13번째 hex 숫자(3번째 그룹의 첫 글자).
  const versionDigit = parseInt(match[3][0], 16);
  const version = versionDigit >= 1 && versionDigit <= 5 ? versionDigit : null;

  // variant: 17번째 hex 숫자(4번째 그룹의 첫 글자).
  const variantNibble = parseInt(match[4][0], 16);
  const variant = detectVariant(variantNibble);

  return { valid: true, isNil: false, version, variant, normalized };
}

export default function UuidValidatePage() {
  const [input, setInput] = useState('');
  const result = useMemo(() => validate(input), [input]);

  const handleReset = () => setInput('');

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="UUID 검증" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Fingerprint className="h-4 w-4 text-primary" aria-hidden />
          UUID/GUID 형식을 검사하고 버전(v1~v5)·variant를 판별합니다. nil UUID도 인식합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">UUID 입력</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 550e8400-e29b-41d4-a716-446655440000"
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            aria-label="UUID 입력"
          />
        </label>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            {result.valid ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
                유효한 UUID {result.isNil && '(nil UUID)'}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <XCircle className="h-5 w-5" aria-hidden />
                형식이 올바르지 않습니다
              </div>
            )}

            {result.valid && (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg border bg-background px-3 py-2">
                  <dt className="text-xs text-muted-foreground">정규화</dt>
                  <dd className="font-mono break-all">{result.normalized}</dd>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <dt className="text-xs text-muted-foreground">버전</dt>
                  <dd className="font-medium">
                    {result.isNil
                      ? 'nil (정의되지 않음)'
                      : result.version
                        ? VERSION_LABELS[result.version]
                        : '알 수 없음 (비표준)'}
                  </dd>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2 sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Variant</dt>
                  <dd className="font-medium">{result.variant}</dd>
                </div>
              </dl>
            )}

            {!result.valid && (
              <p className="text-xs text-muted-foreground">
                8-4-4-4-12 형식의 16진수여야 합니다(선택적으로 중괄호 허용).
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
