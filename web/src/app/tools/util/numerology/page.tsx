'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 마스터수 — 더 이상 줄이지 않고 보존한다. */
const MASTER_NUMBERS = new Set([11, 22, 33]);

/** life path 숫자별 한 줄 설명. */
const MEANINGS: Record<number, string> = {
  1: '독립적이고 주도적인 개척자형',
  2: '협력과 조화를 중시하는 중재자형',
  3: '창의적이고 표현력이 풍부한 예술가형',
  4: '성실하고 체계적인 건설자형',
  5: '자유와 변화를 추구하는 모험가형',
  6: '책임감 있고 배려 깊은 양육자형',
  7: '탐구심 깊은 사색가·분석가형',
  8: '추진력 있는 성취·경영자형',
  9: '이타적이고 포용력 있는 인도주의자형',
  11: '직관이 뛰어난 영감가형 (마스터수)',
  22: '비전을 현실로 만드는 대건설자형 (마스터수)',
  33: '헌신과 사랑의 마스터 교사형 (마스터수)',
};

/**
 * 한 자리(또는 마스터수)가 될 때까지 자릿수 합을 반복.
 * 합산 도중 11/22/33 이 나오면 마스터수로 보존한다.
 */
function reduceToLifePath(sum: number): number {
  let current = sum;
  while (current > 9 && !MASTER_NUMBERS.has(current)) {
    let next = 0;
    let n = current;
    while (n > 0) {
      next += n % 10;
      n = Math.floor(n / 10);
    }
    current = next;
  }
  return current;
}

/** "YYYY-MM-DD" 의 모든 숫자를 합산해 life path 를 계산. 유효하지 않으면 null. */
function lifePathFromBirth(birth: string): number | null {
  const match = birth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  // 각 구성요소를 먼저 줄인 뒤 합산 (널리 쓰이는 표준 방식).
  const reducedMonth = reduceToLifePath(month);
  const reducedDay = reduceToLifePath(day);
  const reducedYear = reduceToLifePath(
    String(year)
      .split('')
      .reduce((acc, digit) => acc + Number(digit), 0),
  );
  return reduceToLifePath(reducedMonth + reducedDay + reducedYear);
}

/** 피타고라스식 알파벳→숫자(1~9) 매핑으로 이름의 숫자를 계산. 영문자만 반영. */
function expressionFromName(name: string): number | null {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length === 0) return null;
  let sum = 0;
  for (const char of letters) {
    // 'A'(65) → 0, ((code - 65) % 9) + 1 로 1~9 순환.
    sum += ((char.charCodeAt(0) - 65) % 9) + 1;
  }
  return reduceToLifePath(sum);
}

export default function NumerologyPage() {
  const [birth, setBirth] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 입력 기반 결정적 — 실시간 useMemo 안전.
  const lifePath = useMemo(() => lifePathFromBirth(birth), [birth]);
  const expression = useMemo(() => expressionFromName(name), [name]);

  function handleReset() {
    setBirth('');
    setName('');
  }

  async function copyResult() {
    if (lifePath === null) return;
    const parts = [`생명수(Life Path): ${lifePath} — ${MEANINGS[lifePath] ?? ''}`];
    if (expression !== null) {
      parts.push(`이름수(Expression): ${expression} — ${MEANINGS[expression] ?? ''}`);
    }
    try {
      await navigator.clipboard.writeText(parts.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="수비학 계산기"
        widthClass="max-w-xl"
        onReset={birth || name ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          생년월일로 생명수(Life Path)를, 이름(선택)으로 이름수를 계산합니다. 마스터수
          11·22·33 은 줄이지 않고 보존합니다. 재미로 봐 주세요.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">생년월일</span>
            <input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              aria-label="생년월일"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">이름 (선택, 영문)</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: John Smith"
            />
          </label>
        </div>

        {birth && lifePath === null && (
          <p role="alert" className="text-sm text-destructive">
            유효한 날짜를 입력하세요.
          </p>
        )}

        {lifePath !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">계산 결과</p>
              <Button variant="outline" size="sm" onClick={copyResult}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
                </span>
              </Button>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">생명수 (Life Path)</p>
              <p className="text-4xl font-bold tabular-nums text-primary">{lifePath}</p>
              <p className="mt-1 text-sm text-muted-foreground">{MEANINGS[lifePath]}</p>
            </div>

            {expression !== null && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">이름수 (Expression)</p>
                <p className="text-4xl font-bold tabular-nums text-primary">{expression}</p>
                <p className="mt-1 text-sm text-muted-foreground">{MEANINGS[expression]}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
