'use client';

import { useMemo, useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Specificity {
  a: number; // ID
  b: number; // class / attribute / pseudo-class
  c: number; // type / pseudo-element
}

interface SelectorResult {
  selector: string;
  spec: Specificity;
  score: number;
}

/** 단일 선택자의 명시도 (a, b, c) 계산. */
function calcSpecificity(selector: string): Specificity {
  let working = selector.trim();
  const spec: Specificity = { a: 0, b: 0, c: 0 };

  // 문자열·속성값 내부의 토큰이 오인되지 않도록 속성 셀렉터를 먼저 처리.
  working = working.replace(/\[[^\]]*\]/g, () => {
    spec.b += 1;
    return ' ';
  });

  // ID 선택자.
  working = working.replace(/#[\w-]+/g, () => {
    spec.a += 1;
    return ' ';
  });

  // 클래스 선택자.
  working = working.replace(/\.[\w-]+/g, () => {
    spec.b += 1;
    return ' ';
  });

  // 의사 요소(::before 등)는 type 으로 카운트. 두 콜론을 먼저 처리.
  working = working.replace(/::[\w-]+/g, () => {
    spec.c += 1;
    return ' ';
  });

  // 의사 클래스. :not()·:is()·:where() 등은 의사 클래스 자체를 세지 않고 인자를 평가.
  working = working.replace(/:([\w-]+)(\([^)]*\))?/g, (_match, fnName: string, args?: string) => {
    const lower = fnName.toLowerCase();
    if (args) {
      const inner = args.slice(1, -1);
      if (lower === 'where') return ' '; // :where() 는 명시도 0
      if (lower === 'not' || lower === 'is' || lower === 'has') {
        const innerMax = inner
          .split(',')
          .map((part) => calcSpecificity(part))
          .reduce(
            (best, current) => (toScore(current) > toScore(best) ? current : best),
            { a: 0, b: 0, c: 0 },
          );
        spec.a += innerMax.a;
        spec.b += innerMax.b;
        spec.c += innerMax.c;
        return ' ';
      }
    }
    spec.b += 1; // 일반 의사 클래스
    return ' ';
  });

  // 남은 타입 선택자(요소명). 결합자·전체 선택자(*)는 제외.
  const types = working.match(/[a-zA-Z][\w-]*/g);
  if (types) spec.c += types.length;

  return spec;
}

function toScore(spec: Specificity): number {
  return spec.a * 100 + spec.b * 10 + spec.c;
}

/** 입력을 줄 단위로 분리해 각 선택자의 명시도를 계산. */
function calcAll(input: string): SelectorResult[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((selector) => {
      const spec = calcSpecificity(selector);
      return { selector, spec, score: toScore(spec) };
    });
}

export default function CssSpecificityPage() {
  const [input, setInput] = useState('');

  const results = useMemo(() => (input.trim() ? calcAll(input) : []), [input]);

  const maxScore = useMemo(() => results.reduce((best, item) => Math.max(best, item.score), -1), [results]);
  const winnerCount = useMemo(
    () => results.filter((item) => item.score === maxScore).length,
    [results, maxScore],
  );

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 명시도 계산" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          CSS 선택자의 명시도 (a=ID, b=클래스/속성/의사클래스, c=타입/의사요소)를 계산합니다. 여러 줄 입력 시 각각 계산하고 우선순위가 가장 높은 것을 표시합니다.
        </p>

        <textarea
          className="min-h-32 w-full rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'#nav .item a\nul li.active\n.btn:hover'}
          aria-label="CSS 선택자 입력 (한 줄에 하나)"
          spellCheck={false}
        />

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((item, index) => {
              const isWinner = item.score === maxScore && winnerCount === 1;
              return (
                <div
                  key={`${item.selector}-${index}`}
                  className={`flex items-center justify-between gap-3 rounded-xl border bg-card p-3 ${
                    isWinner ? 'border-primary' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">{item.selector}</p>
                    {isWinner && <p className="text-xs text-primary">가장 높은 우선순위</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm tabular-nums">
                      {item.spec.a},{item.spec.b},{item.spec.c}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">점수 {item.score}</p>
                  </div>
                </div>
              );
            })}
            {results.length > 1 && winnerCount > 1 && (
              <p className="text-sm text-muted-foreground">
                가장 높은 명시도(점수 {maxScore})인 선택자가 {winnerCount}개입니다. 동점일 경우 나중에 선언된 규칙이 적용됩니다.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
