'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

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
function digitsToEnglish(digits: string): string | null {
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

const KO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
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
function digitsToKorean(digits: string): string | null {
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
function parseNumberInput(
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

const EN_DECIMAL_DIGITS = [
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

export default function NumberToWordsPage() {
  const [input, setInput] = useState('');

  const output = useMemo(() => {
    if (!input.trim()) return { english: '', korean: '', error: '' };

    const parsed = parseNumberInput(input);
    if (!parsed) {
      return {
        english: '',
        korean: '',
        error: '숫자만 입력하세요 (예: 1234567 또는 -89.5)',
      };
    }

    const english = digitsToEnglish(parsed.intPart);
    const korean = digitsToKorean(parsed.intPart);
    if (english === null || korean === null) {
      return {
        english: '',
        korean: '',
        error: '표기할 수 있는 범위를 넘는 큰 수입니다.',
      };
    }

    let enText = english;
    let koText = korean;

    // 소수부: 자릿수 그대로 읽기.
    if (parsed.fracPart) {
      const enFrac = parsed.fracPart
        .split('')
        .map((d) => EN_DECIMAL_DIGITS[Number(d)])
        .join(' ');
      const koFrac = parsed.fracPart
        .split('')
        .map((d) => (d === '0' ? '영' : KO_DIGITS[Number(d)]))
        .join('');
      enText += ` point ${enFrac}`;
      koText += ` 점 ${koFrac}`;
    }

    if (parsed.negative) {
      enText = `negative ${enText}`;
      koText = `마이너스 ${koText}`;
    }

    return { english: enText, korean: koText, error: '' };
  }, [input]);

  function copy(text: string) {
    if (text) navigator.clipboard?.writeText(text);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="숫자 → 한글·영문 표기"
        widthClass="max-w-3xl"
        onReset={input ? () => setInput('') : undefined}
      />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          숫자를 한글(일십백천만억)·영문 단어 표기로 변환합니다.
        </p>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">숫자 입력</span>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 1,234,567 또는 -89.5"
            aria-label="숫자 입력"
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-lg tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          쉼표 포함 입력·음수·소수점을 지원합니다.
        </p>
      </div>

      {output.error && (
        <p role="alert" className="text-sm text-destructive">
          {output.error}
        </p>
      )}

      {output.korean && (
        <div className="space-y-3">
          <div className="space-y-1 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">한글 표기</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(output.korean)}
              >
                복사
              </Button>
            </div>
            <p className="break-keep text-lg font-semibold leading-relaxed">
              {output.korean}
            </p>
          </div>

          <div className="space-y-1 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">영문 표기</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(output.english)}
              >
                복사
              </Button>
            </div>
            <p className="text-lg font-semibold capitalize leading-relaxed">
              {output.english}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        모든 변환은 브라우저에서 즉시 처리됩니다.
      </p>
      </main>
    </div>
  );
}
