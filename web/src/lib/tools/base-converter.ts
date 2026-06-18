/**
 * 진수 변환기 — 2·8·10·16진수 상호 변환 (BigInt).
 * (base-converter 도구 page.tsx 에서 추출 — 동작 동일)
 */

export type Radix = 2 | 8 | 10 | 16;

export const RADIX_PATTERN: Record<Radix, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-f]+$/i,
};

export interface Converted {
  binary: string;
  octal: string;
  decimal: string;
  hex: string;
  bitLength: number;
  negative: boolean;
}

/**
 * 입력 문자열을 지정한 진법으로 파싱해 BigInt 로 변환한다.
 * 잘못된 형식이거나 빈 값이면 에러 메시지를 반환한다.
 */
export function parseInput(raw: string, radix: Radix): Converted | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: '' };

  const negative = trimmed.startsWith('-');
  const digits = negative ? trimmed.slice(1) : trimmed;

  if (!digits) {
    return { error: '숫자를 입력해 주세요.' };
  }
  if (!RADIX_PATTERN[radix].test(digits)) {
    return {
      error: `선택한 진법(${radix})에 맞지 않는 문자가 있습니다.`,
    };
  }

  let value: bigint;
  try {
    // BigInt 는 16진수 0x, 2진수 0b, 8진수 0o 접두사를 인식한다.
    const prefix = radix === 16 ? '0x' : radix === 8 ? '0o' : radix === 2 ? '0b' : '';
    value = BigInt(prefix + digits);
  } catch {
    return { error: '숫자를 변환할 수 없습니다.' };
  }

  const magnitude = value; // digits 는 부호 없는 양수
  const sign = negative ? '-' : '';

  return {
    binary: sign + magnitude.toString(2),
    octal: sign + magnitude.toString(8),
    decimal: sign + magnitude.toString(10),
    hex: sign + magnitude.toString(16).toUpperCase(),
    bitLength: magnitude === BigInt(0) ? 1 : magnitude.toString(2).length,
    negative,
  };
}
