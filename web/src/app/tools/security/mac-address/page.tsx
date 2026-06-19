'use client';

import { useMemo, useState } from 'react';
import { Network } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';

interface MacForms {
  colonUpper: string;
  colonLower: string;
  hyphenUpper: string;
  hyphenLower: string;
  dotUpper: string;
  dotLower: string;
  bareUpper: string;
  bareLower: string;
}

interface ValidationResult {
  valid: boolean;
  reason: string;
  oui?: string;
  forms?: MacForms;
}

/**
 * MAC 주소에서 16진수 6바이트(12 nibble)를 추출한다.
 * 콜론·하이픈 6그룹(각 2자리), 시스코 점 3그룹(각 4자리), 구분자 없는 12자리를 허용한다.
 * @returns 대문자 12자 hex 문자열, 또는 형식이 맞지 않으면 null.
 */
function extractHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 콜론 또는 하이픈으로 구분된 6그룹(각 2자리 hex).
  if (/^[0-9a-fA-F]{2}([:-])(?:[0-9a-fA-F]{2}\1){4}[0-9a-fA-F]{2}$/.test(trimmed)) {
    return trimmed.replace(/[:-]/g, '').toUpperCase();
  }

  // 시스코 점 표기(3그룹, 각 4자리 hex).
  if (/^[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}$/.test(trimmed)) {
    return trimmed.replace(/\./g, '').toUpperCase();
  }

  // 구분자 없는 12자리 hex.
  if (/^[0-9a-fA-F]{12}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

/** 12자 hex 를 2자리씩 6바이트로 끊는다. */
function toBytes(hex: string): string[] {
  return hex.match(/.{2}/g) ?? [];
}

/** 추출한 hex 로부터 모든 표기 형태를 생성한다. */
function buildForms(hexUpper: string): MacForms {
  const bytesUpper = toBytes(hexUpper);
  const hexLower = hexUpper.toLowerCase();
  const bytesLower = toBytes(hexLower);
  const dotGroups = (value: string): string => (value.match(/.{4}/g) ?? []).join('.');

  return {
    colonUpper: bytesUpper.join(':'),
    colonLower: bytesLower.join(':'),
    hyphenUpper: bytesUpper.join('-'),
    hyphenLower: bytesLower.join('-'),
    dotUpper: dotGroups(hexUpper),
    dotLower: dotGroups(hexLower),
    bareUpper: hexUpper,
    bareLower: hexLower,
  };
}

/** MAC 주소를 검증하고 표기 변환 결과를 반환한다. */
function validateMac(raw: string): ValidationResult | null {
  if (!raw.trim()) return null;

  const hex = extractHex(raw);
  if (!hex) {
    return {
      valid: false,
      reason:
        '형식 오류: 콜론(00:1A:2B:3C:4D:5E)·하이픈(00-1A-2B-...)·시스코 점(001a.2b3c.4d5e) 또는 구분자 없는 12자리 hex 만 허용됩니다.',
    };
  }

  const bytes = toBytes(hex);
  return {
    valid: true,
    reason: '유효한 MAC 주소입니다.',
    oui: bytes.slice(0, 3).join(':'),
    forms: buildForms(hex),
  };
}

export default function MacAddressPage() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateMac(input), [input]);

  function reset() {
    setInput('');
  }

  const formRows: Array<[string, string, string]> = result?.forms
    ? [
        ['콜론 (대문자)', result.forms.colonUpper, '콜론 (소문자)'],
        ['하이픈 (대문자)', result.forms.hyphenUpper, '하이픈 (소문자)'],
        ['점/시스코 (대문자)', result.forms.dotUpper, '점/시스코 (소문자)'],
        ['구분자 없음 (대문자)', result.forms.bareUpper, '구분자 없음 (소문자)'],
      ]
    : [];

  const lowerForms: Record<string, string> = result?.forms
    ? {
        '콜론 (소문자)': result.forms.colonLower,
        '하이픈 (소문자)': result.forms.hyphenLower,
        '점/시스코 (소문자)': result.forms.dotLower,
        '구분자 없음 (소문자)': result.forms.bareLower,
      }
    : {};

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="MAC 주소 검증·포맷" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Network className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          MAC 주소 형식을 검증하고 콜론·하이픈·점·구분자 없음 표기를 대/소문자로 변환합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">MAC 주소</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 00:1A:2B:3C:4D:5E"
            autoComplete="off"
            spellCheck={false}
            aria-label="MAC 주소"
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
              {result.valid ? '유효한 MAC 주소입니다.' : '유효하지 않은 MAC 주소입니다.'}
              <span className="mt-1 block text-xs font-normal">{result.reason}</span>
            </div>

            {result.valid && result.forms && (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">OUI (제조사 식별자, 상위 3바이트)</dt>
                  <dd className="font-mono">{result.oui}</dd>
                </dl>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">표기 변환</span>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                    {formRows.flatMap(([upperLabel, upperValue, lowerLabel]) => [
                      <dt key={`${upperLabel}-dt`} className="text-muted-foreground">
                        {upperLabel}
                      </dt>,
                      <dd key={`${upperLabel}-dd`} className="break-all font-mono">
                        {upperValue}
                      </dd>,
                      <dt key={`${lowerLabel}-dt`} className="text-muted-foreground">
                        {lowerLabel}
                      </dt>,
                      <dd key={`${lowerLabel}-dd`} className="break-all font-mono">
                        {lowerForms[lowerLabel]}
                      </dd>,
                    ])}
                  </dl>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          OUI 는 상위 3바이트일 뿐 실제 제조사 조회는 수행하지 않습니다. 모든 검증은 브라우저 안에서만 수행되며
          입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
