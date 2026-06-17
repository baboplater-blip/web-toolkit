'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Intensity = 'low' | 'medium' | 'high';

const INTENSITY_OPTIONS: ReadonlyArray<{ value: Intensity; label: string; range: readonly [number, number] }> = [
  { value: 'low', label: '약함', range: [1, 3] },
  { value: 'medium', label: '보통', range: [2, 6] },
  { value: 'high', label: '강함', range: [4, 10] },
];

// 결합 분음부호(combining diacritical marks) — 위/중간/아래.
const MARKS_UP: readonly string[] = [
  '̀', '́', '̂', '̃', '̄', '̅', '̆', '̇',
  '̈', '̉', '̊', '̋', '̌', '̍', '̎', '̏',
  '̐', '̑', '̒', '̽', '̾', '̿', '͂', '͆',
  '͊', '͋', '͌', '͐', '͑', '͒', '͗', '͛',
];
const MARKS_MID: readonly string[] = [
  '̴', '̵', '̶', '̷', '̸', '҉',
];
const MARKS_DOWN: readonly string[] = [
  '̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟',
  '̠', '̣', '̤', '̥', '̦', '̧', '̨', '̩',
  '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱',
  '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͙',
];

function pick(marks: readonly string[]): string {
  return marks[Math.floor(Math.random() * marks.length)];
}

function randomCount(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 글자마다 위/중간/아래 결합 마크를 강도 범위 내 무작위 개수로 덧붙인다. */
function buildZalgo(input: string, range: readonly [number, number]): string {
  const [min, max] = range;
  const chars = [...input];
  return chars
    .map((char) => {
      if (/\s/.test(char)) return char;
      let result = char;
      const up = randomCount(min, max);
      const mid = randomCount(0, Math.max(0, Math.floor(min / 2)));
      const down = randomCount(min, max);
      for (let i = 0; i < up; i += 1) result += pick(MARKS_UP);
      for (let i = 0; i < mid; i += 1) result += pick(MARKS_MID);
      for (let i = 0; i < down; i += 1) result += pick(MARKS_DOWN);
      return result;
    })
    .join('');
}

export default function ZalgoTextPage() {
  const [input, setInput] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // 결과가 무작위라 useMemo 파생값이 아닌 명시적 생성 액션으로 둔다.
  function generate() {
    if (!input) {
      setOutput('');
      return;
    }
    const option = INTENSITY_OPTIONS.find((opt) => opt.value === intensity);
    const range = option ? option.range : INTENSITY_OPTIONS[1].range;
    setOutput(buildZalgo(input, range));
  }

  function reset() {
    setInput('');
    setIntensity('medium');
    setOutput('');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="글리치(자고) 텍스트" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">결합 문자로 글리치 효과의 텍스트를 만듭니다.</p>

        <textarea
          className="min-h-32 w-full resize-y rounded-xl border bg-card p-3 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />

        <div className="space-y-1">
          <span className="text-sm font-medium">강도</span>
          <div className="flex flex-wrap gap-2">
            {INTENSITY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={intensity === opt.value ? 'default' : 'outline'}
                onClick={() => setIntensity(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={!input}>
          생성
        </Button>

        <textarea
          className="min-h-40 w-full resize-y rounded-xl border bg-muted/40 p-3 text-base leading-loose"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />

        <div className="flex gap-2">
          <Button onClick={copy} disabled={!output}>
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
      </main>
    </div>
  );
}
