/**
 * 로마숫자 ↔ 아라비아 숫자 변환 (1~3999).
 * (roman-numeral 도구 page.tsx 에서 추출 — 동작 동일)
 */

export type Direction = 'toRoman' | 'toArabic';

export const MIN_VALUE = 1;
export const MAX_VALUE = 3999;

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

export interface ConversionResult {
  ok: boolean;
  value: string;
  error?: string;
}

export function arabicToRoman(input: string): ConversionResult {
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

export function romanToArabic(input: string): ConversionResult {
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

export function detectDirection(input: string): Direction {
  // 숫자만 있으면 아라비아→로마, 그 외 로마자가 있으면 로마→아라비아
  return /^\s*\d[\d,]*\s*$/.test(input) ? 'toRoman' : 'toArabic';
}
