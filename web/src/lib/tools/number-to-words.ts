/**
 * 숫자 → 단어 변환 (영문 short scale + 한글 만/억/조).
 * (number-to-words 도구 page.tsx 에서 추출 — 동작 동일)
 */

const EN_ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

// 단/억/조 단위 (10^3 마다). 영문 표기는 short scale.
const EN_SCALES = [
  '',
  'thousand',
  'million',
  'billion',
  'trillion',
  'quadrillion',
  'quintillion',
  'sextillion',
  'septillion',
  'octillion',
  'nonillion',
  'decillion',
];

/** 0~999 사이 정수를 영문 단어로. */
function enUnderThousand(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) {
    parts.push(`${EN_ONES[hundreds]} hundred`);
  }
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(EN_ONES[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${EN_TENS[tens]}-${EN_ONES[ones]}` : EN_TENS[tens]);
    }
  }
  return parts.join(' ');
}

/** 음이 아닌 정수 문자열을 영문 단어로. 3자리 그룹으로 분해. */
export function digitsToEnglish(digits: string): string | null {
  const groups: number[] = [];
  let rest = digits;
  while (rest.length > 0) {
    const take = Math.max(0, rest.length - 3);
    groups.unshift(Number(rest.slice(take)));
    rest = rest.slice(0, take);
  }
  if (groups.length > EN_SCALES.length) {
    return null; // 표기 범위 초과
  }
  const words: string[] = [];
  for (let i = 0; i < groups.length; i += 1) {
    const value = groups[i];
    if (value === 0) continue;
    const scale = EN_SCALES[groups.length - 1 - i];
    const chunk = enUnderThousand(value);
    words.push(scale ? `${chunk} ${scale}` : chunk);
  }
  return words.length > 0 ? words.join(' ') : 'zero';
}

export const KO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const KO_SMALL_UNITS = ['', '십', '백', '천']; // 10^0 ~ 10^3
const KO_BIG_UNITS = ['', '만', '억', '조', '경', '해', '자', '양']; // 10^4 마다

/** 0~9999 정수를 한글로 (만 단위 묶음 내부). */
function koUnderTenThousand(n: number): string {
  let result = '';
  const str = String(n).padStart(4, '0');
  for (let i = 0; i < 4; i += 1) {
    const digit = Number(str[i]);
    if (digit === 0) continue;
    const unitIndex = 4 - 1 - i; // 천=3, 백=2, 십=1, 일=0
    // 십·백·천 앞의 '일'은 생략 (예: 일십 → 십)
    const digitChar = digit === 1 && unitIndex > 0 ? '' : KO_DIGITS[digit];
    result += digitChar + KO_SMALL_UNITS[unitIndex];
  }
  return result;
}

/** 음이 아닌 정수 문자열을 한글(일십백천만억…)로. */
export function digitsToKorean(digits: string): string | null {
  if (/^0+$/.test(digits)) return '영';

  // 4자리(만 단위)씩 묶기.
  const groups: number[] = [];
  let rest = digits;
  while (rest.length > 0) {
    const take = Math.max(0, rest.length - 4);
    groups.unshift(Number(rest.slice(take)));
    rest = rest.slice(0, take);
  }
  if (groups.length > KO_BIG_UNITS.length) {
    return null; // 표기 범위 초과
  }

  let result = '';
  for (let i = 0; i < groups.length; i += 1) {
    const value = groups[i];
    if (value === 0) continue;
    const bigUnit = KO_BIG_UNITS[groups.length - 1 - i];
    result += koUnderTenThousand(value) + bigUnit;
  }
  return result;
}

/** 입력 문자열을 부호·정수·소수부로 분해. 무효 시 null. */
export function parseNumberInput(
  raw: string,
): { negative: boolean; intPart: string; fracPart: string } | null {
  const cleaned = raw.trim().replace(/,/g, '').replace(/\s/g, '');
  if (!cleaned) return null;
  const match = cleaned.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const [, sign, intRaw, fracRaw] = match;
  // 선행 0 제거 (단, 전체가 0이면 "0" 유지)
  const intPart = intRaw.replace(/^0+(?=\d)/, '');
  return {
    negative: sign === '-',
    intPart,
    fracPart: fracRaw ?? '',
  };
}

export const EN_DECIMAL_DIGITS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];
