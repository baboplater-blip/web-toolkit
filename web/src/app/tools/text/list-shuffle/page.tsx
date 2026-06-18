'use client';

import { useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';

/**
 * crypto.getRandomValues 기반 균등 난수(0 이상 maxExclusive 미만)를 거부 표집으로 생성한다.
 * 32비트 범위를 maxExclusive 로 나눈 나머지 편향을 제거한다.
 */
function randomBelow(maxExclusive: number): number {
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % maxExclusive;
}

/** crypto 기반 Fisher–Yates 셔플(원본 불변, 새 배열 반환). */
function cryptoShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomBelow(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function ListShufflePage() {
  const [input, setInput] = useState('');
  // 하이드레이션 안전: 초기·재렌더 시 결과는 항상 입력 그대로(결정적).
  // 무작위 셔플은 오직 버튼 클릭 시에만 수행해 SSR/CSR 출력이 일치하도록 한다.
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  function shuffle() {
    const lines = input.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      setOutput('');
      return;
    }
    setOutput(cryptoShuffle(lines).join('\n'));
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setInput('');
    setOutput('');
    setCopied(false);
  }

  const hasLines = input.split('\n').some((line) => line.trim().length > 0);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="목록 섞기" onReset={reset} widthClass="max-w-3xl" />
      <main className="mx-auto max-w-3xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          줄 단위 목록을 무작위로 섞습니다(추첨·순서 정하기). 섞기 버튼을 누를 때마다 새로 섞습니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-64 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'한 줄에 항목 하나씩 입력하세요\n예) 김철수\n이영희\n박민수'}
            aria-label="입력"
          />
          <textarea
            className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-sm"
            value={output}
            readOnly
            placeholder="섞기 버튼을 누르면 결과가 표시됩니다"
            aria-label="결과"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={shuffle} disabled={!hasLines}>
            섞기
          </Button>
          <Button variant="outline" onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '결과 복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
