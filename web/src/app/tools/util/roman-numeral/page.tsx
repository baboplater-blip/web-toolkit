'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, Sigma } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Direction = 'toRoman' | 'toArabic';

const MIN_VALUE = 1;
const MAX_VALUE = 3999;

/** 표준 로마숫자 매핑 (큰 값 → 작은 값, 감산 표기 포함) */
const ROMAN_MAP: { value: number; symbol: string }[] = [
  { value: 1000, symbol: 'M' },
  { value: 900, symbol: 'CM' },
  { value: 500, symbol: 'D' },
  { value: 400, symbol: 'CD' },
  { value: 100, symbol: 'C' },
  { value: 90, symbol: 'XC' },
  { value: 50, symbol: 'L' },
  { value: 40, symbol: 'XL' },
  { value: 10, symbol: 'X' },
  { value: 9, symbol: 'IX' },
  { value: 5, symbol: 'V' },
  { value: 4, symbol: 'IV' },
  { value: 1, symbol: 'I' },
];

/** 표준 형식 검증용 정규식 (1~3999 범위의 유효한 로마숫자만 매칭) */
const ROMAN_PATTERN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

interface ConversionResult {
  ok: boolean;
  value: string;
  error?: string;
}

function arabicToRoman(input: string): ConversionResult {
  const trimmed = input.trim().replace(/,/g, '');
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, value: '', error: '정수만 입력해 주세요.' };
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < MIN_VALUE || n > MAX_VALUE) {
    return {
      ok: false,
      value: '',
      error: `${MIN_VALUE}~${MAX_VALUE} 범위의 정수만 변환할 수 있습니다.`,
    };
  }

  let remaining = n;
  let result = '';
  for (const { value, symbol } of ROMAN_MAP) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return { ok: true, value: result };
}

function romanToArabic(input: string): ConversionResult {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return { ok: false, value: '', error: '로마숫자를 입력해 주세요.' };
  if (!/^[IVXLCDM]+$/.test(normalized)) {
    return { ok: false, value: '', error: '로마숫자(I·V·X·L·C·D·M)만 입력해 주세요.' };
  }
  if (!ROMAN_PATTERN.test(normalized)) {
    return { ok: false, value: '', error: '올바른 로마숫자 형식이 아닙니다.' };
  }

  // 그리디 디코딩 (패턴 검증을 통과했으므로 안전)
  let i = 0;
  let total = 0;
  while (i < normalized.length) {
    let matched = false;
    for (const { value, symbol } of ROMAN_MAP) {
      if (normalized.startsWith(symbol, i)) {
        total += value;
        i += symbol.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      return { ok: false, value: '', error: '올바른 로마숫자 형식이 아닙니다.' };
    }
  }

  if (total < MIN_VALUE || total > MAX_VALUE) {
    return {
      ok: false,
      value: '',
      error: `${MIN_VALUE}~${MAX_VALUE} 범위만 지원합니다.`,
    };
  }
  return { ok: true, value: String(total) };
}

function detectDirection(input: string): Direction {
  // 숫자만 있으면 아라비아→로마, 그 외 로마자가 있으면 로마→아라비아
  return /^\s*\d[\d,]*\s*$/.test(input) ? 'toRoman' : 'toArabic';
}

export default function RomanNumeralPage() {
  const [input, setInput] = useState('');

  const result = useMemo<ConversionResult | null>(() => {
    if (!input.trim()) return null;
    const direction = detectDirection(input);
    return direction === 'toRoman' ? arabicToRoman(input) : romanToArabic(input);
  }, [input]);

  const direction = input.trim() ? detectDirection(input) : 'toRoman';

  function copy() {
    if (result?.ok) navigator.clipboard?.writeText(result.value);
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Sigma className="h-5 w-5 text-primary" aria-hidden />
          로마숫자 변환
        </h1>
        <p className="text-sm text-muted-foreground">
          아라비아 숫자와 로마숫자(I·V·X·L·C·D·M)를 서로 변환합니다. (1~3999)
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">입력 (숫자 또는 로마숫자)</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 2024 또는 MMXXIV"
            aria-label="변환할 값"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
          {direction === 'toRoman' ? '아라비아 → 로마숫자' : '로마숫자 → 아라비아'} (자동 감지)
        </p>
      </div>

      {result && !result.ok && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {result.error}
        </p>
      )}

      {result?.ok && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">결과</p>
            <p className="truncate text-2xl font-bold tabular-nums tracking-wide">
              {result.value}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>
            복사
          </Button>
        </div>
      )}
    </main>
  );
}
