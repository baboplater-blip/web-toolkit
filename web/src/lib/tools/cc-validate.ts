/**
 * 신용카드 번호 검증 — Luhn 체크섬 + 발급사 감지.
 * (cc-validate 도구 page.tsx 에서 추출 — 동작 동일)
 */

/** 발급사 식별 규칙 — prefix(정규식)와 허용 자릿수. */
export interface IssuerRule {
  name: string;
  pattern: RegExp;
  lengths: number[];
}

/**
 * 발급사 감지 규칙 (위에서부터 먼저 일치하는 것 사용).
 * prefix·길이 기준은 ISO/IEC 7812 및 각 발급사 공개 BIN 범위를 따른다.
 */
export const ISSUER_RULES: readonly IssuerRule[] = [
  { name: 'Visa', pattern: /^4/, lengths: [13, 16, 19] },
  // Mastercard: 51–55 또는 2221–2720
  { name: 'Mastercard', pattern: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/, lengths: [16] },
  { name: 'American Express', pattern: /^3[47]/, lengths: [15] },
  // Discover: 6011, 65, 644–649, 622126–622925
  { name: 'Discover', pattern: /^(6011|65|64[4-9]|622)/, lengths: [16, 19] },
  // Diners Club: 300–305, 3095, 36, 38–39
  { name: 'Diners Club', pattern: /^(30[0-5]|3095|36|3[89])/, lengths: [14, 16, 19] },
  { name: 'JCB', pattern: /^35(2[89]|[3-8]\d)/, lengths: [16, 17, 18, 19] },
  { name: 'UnionPay', pattern: /^62/, lengths: [16, 17, 18, 19] },
] as const;

/** 입력에서 숫자만 추출 (공백·하이픈 제거). */
export function extractDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Luhn 체크섬 검증.
 * 오른쪽에서 두 번째 자리부터 한 칸 걸러 2배(9 초과 시 -9)한 뒤 전체 합이 10의 배수면 유효.
 */
export function isLuhnValid(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = digits.charCodeAt(index) - 48; // '0' === 48
    if (shouldDouble) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/** prefix 가 일치하는 첫 발급사 규칙을 찾는다(길이 무관). */
export function detectIssuer(digits: string): IssuerRule | null {
  return ISSUER_RULES.find((rule) => rule.pattern.test(digits)) ?? null;
}

export interface CardAnalysis {
  digits: string;
  issuer: IssuerRule | null;
  luhnValid: boolean;
  lengthValid: boolean;
}

export function analyze(raw: string): CardAnalysis | null {
  const digits = extractDigits(raw);
  if (digits.length === 0) return null;
  const issuer = detectIssuer(digits);
  return {
    digits,
    issuer,
    luhnValid: isLuhnValid(digits),
    // 발급사 규칙이 있으면 그 자릿수, 없으면 일반 카드 범위(13~19)로 판정.
    lengthValid: issuer
      ? issuer.lengths.includes(digits.length)
      : digits.length >= 13 && digits.length <= 19,
  };
}
