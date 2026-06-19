'use client';

import { useState } from 'react';
import { Check, Copy, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

const MIN_COUNT = 1;
const MAX_COUNT = 50;
const ALPHABET_SIZE = 26; // A~Z
const CHAR_CODE_A = 65; // 'A'

/**
 * [0, maxExclusive) 범위의 균등한 정수를 반환한다.
 * 단순 `% maxExclusive` 는 2^32 가 maxExclusive 의 배수가 아닐 때 모듈로 편향이 생기므로,
 * 균등 분포가 보장되는 상한(limit) 이상 값은 버리고 다시 뽑는 거부 표집(rejection sampling)을 쓴다.
 */
function secureRandomInt(maxExclusive: number): number {
  // maxExclusive 의 배수가 되는 가장 큰 2^32 이하 경계. 이 값 이상은 편향 구간이라 폐기.
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % maxExclusive;
}

/** A~Z 무작위 글자 하나를 대문자로 반환. */
function randomUpperLetter(): string {
  return String.fromCharCode(CHAR_CODE_A + secureRandomInt(ALPHABET_SIZE));
}

export default function RandomLetterPage() {
  const [count, setCount] = useState(1);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(false);
  const [allowRepeat, setAllowRepeat] = useState(true);
  // 하이드레이션 안전: 결과는 빈 배열로 시작하고 "뽑기" 클릭 시에만 생성.
  const [letters, setLetters] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 적어도 한 가지 대소문자 형태는 켜져 있어야 한다.
  const caseEnabled = useUppercase || useLowercase;
  // 중복 비허용 시 뽑을 수 있는 글자 수는 26개를 넘을 수 없다.
  const exceedsUnique = !allowRepeat && count > ALPHABET_SIZE;
  const canGenerate = caseEnabled && count >= MIN_COUNT && !exceedsUnique;

  /**
   * 켜진 대소문자 형태에 맞춰 글자의 형태를 무작위로 결정한다.
   * 두 형태가 모두 켜져 있으면 글자마다 독립적으로 대/소문자를 고른다.
   */
  function applyCase(upper: string): string {
    if (useUppercase && useLowercase) {
      return secureRandomInt(2) === 0 ? upper : upper.toLowerCase();
    }
    return useUppercase ? upper : upper.toLowerCase();
  }

  function generate() {
    if (!canGenerate) return;

    let baseLetters: string[];
    if (allowRepeat) {
      baseLetters = Array.from({ length: count }, () => randomUpperLetter());
    } else {
      // 중복 없이: A~Z 풀에서 거부 표집 셔플 후 앞에서 count 개를 취한다.
      const pool = Array.from({ length: ALPHABET_SIZE }, (_, i) =>
        String.fromCharCode(CHAR_CODE_A + i),
      );
      for (let i = pool.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      baseLetters = pool.slice(0, count);
    }

    setLetters(baseLetters.map(applyCase));
  }

  function reset() {
    setLetters([]);
  }

  async function copyAll() {
    if (letters.length === 0) return;
    try {
      await navigator.clipboard.writeText(letters.join(''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="랜덤 글자 뽑기"
        widthClass="max-w-xl"
        onReset={letters.length > 0 ? reset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          A~Z 알파벳을 무작위로 뽑습니다. Web Crypto 기반의 균등한 난수를
          사용합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">
              뽑을 개수 ({MIN_COUNT}~{MAX_COUNT})
            </span>
            <Input
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={count}
              onChange={(e) => {
                const next = Math.round(Number(e.target.value) || MIN_COUNT);
                setCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, next)));
              }}
              aria-label="뽑을 개수"
            />
          </label>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useUppercase}
                onChange={(e) => setUseUppercase(e.target.checked)}
                className="h-4 w-4"
                aria-label="대문자 포함"
              />
              대문자 (A~Z)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useLowercase}
                onChange={(e) => setUseLowercase(e.target.checked)}
                className="h-4 w-4"
                aria-label="소문자 포함"
              />
              소문자 (a~z)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allowRepeat}
                onChange={(e) => setAllowRepeat(e.target.checked)}
                className="h-4 w-4"
                aria-label="중복 허용"
              />
              중복 허용
            </label>
          </div>

          <Button onClick={generate} disabled={!canGenerate} className="w-full">
            <Shuffle className="h-4 w-4 mr-1.5" aria-hidden />
            뽑기
          </Button>

          {!caseEnabled && (
            <p role="alert" className="text-[11px] text-destructive">
              대문자 또는 소문자 중 하나 이상을 선택하세요.
            </p>
          )}
          {exceedsUnique && (
            <p role="alert" className="text-[11px] text-destructive">
              중복 없이 뽑으려면 {ALPHABET_SIZE}개를 넘길 수 없습니다. 중복 허용을
              켜거나 개수를 줄이세요.
            </p>
          )}
        </div>

        {letters.length > 0 && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                결과 ({letters.length}개)
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={copyAll}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" aria-hidden />
                )}
                {copied ? '복사됨' : copyError ? '복사 실패' : '전체 복사'}
              </Button>
            </div>
            <div
              className="flex flex-wrap justify-center gap-2"
              aria-live="polite"
            >
              {letters.map((letter, i) => (
                <span
                  key={`${letter}-${i}`}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border bg-background text-3xl font-bold tabular-nums"
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <code className="font-mono">crypto.getRandomValues</code> 기반의 균등한
          무작위 추출입니다. 모든 처리는 브라우저에서 즉시 이루어집니다.
        </p>
      </main>
    </div>
  );
}
