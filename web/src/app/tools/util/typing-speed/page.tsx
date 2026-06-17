'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 측정에 사용할 예시 문장 세트. 무작위로 하나를 골라 표시한다. */
const SENTENCES: readonly string[] = [
  '느린 거북이도 꾸준히 걸으면 결국 목적지에 도착한다.',
  '맑은 하늘 아래 푸른 바다가 끝없이 펼쳐져 있었다.',
  '작은 습관이 모여 큰 변화를 만들어 내는 법이다.',
  '오늘 흘린 땀방울은 내일의 값진 결실로 돌아온다.',
  '책을 한 장씩 넘길 때마다 새로운 세계가 열린다.',
  'The quick brown fox jumps over the lazy dog every morning.',
  'Practice makes perfect when you keep typing with focus.',
  '바람이 부는 언덕 위에서 우리는 함께 노래를 불렀다.',
];

type Phase = 'ready' | 'typing' | 'done';

interface Result {
  /** 분당 단어 수 (5자 = 1단어 표준). */
  wpm: number;
  /** 정확도(%) — 정답 문장과 일치하는 문자 비율. */
  accuracy: number;
  /** 경과 시간(초). */
  seconds: number;
  /** 입력한 총 문자 수. */
  chars: number;
}

/** 무작위 문장 인덱스를 반환한다. */
function pickSentenceIndex(exclude: number): number {
  if (SENTENCES.length <= 1) return 0;
  let next = exclude;
  while (next === exclude) {
    next = Math.floor(Math.random() * SENTENCES.length);
  }
  return next;
}

/**
 * 입력값과 정답 문장을 문자 단위로 비교해 일치 개수를 센다.
 * 길이가 다르면 짧은 쪽 길이까지만 비교한다.
 */
function countCorrectChars(typed: string, target: string): number {
  const limit = Math.min(typed.length, target.length);
  let correct = 0;
  for (let i = 0; i < limit; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return correct;
}

export default function TypingSpeedPage() {
  // SSR↔클라이언트 문장 불일치(하이드레이션) 방지 — 0 으로 시작하고 마운트 후 무작위 선택.
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState<Result | null>(null);

  // 입력이 시작된 시각(ms). 첫 글자 입력 시점에 기록한다.
  const startTimeRef = useRef<number | null>(null);

  const sentence = SENTENCES[sentenceIndex];

  // 마운트 후 무작위 문장으로 교체(첫 렌더는 결정적 0번).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSentenceIndex(Math.floor(Math.random() * SENTENCES.length));
  }, []);

  const finishMeasurement = useCallback(
    (typed: string) => {
      const startTime = startTimeRef.current;
      if (startTime === null) return;

      const elapsedMs = Math.max(1, performance.now() - startTime);
      const seconds = elapsedMs / 1000;
      const minutes = seconds / 60;

      // WPM: 표준 단어 길이 5자 기준. (총 문자 수 / 5) / 분.
      const wpm = Math.round(typed.length / 5 / minutes);
      const correct = countCorrectChars(typed, sentence);
      const accuracy =
        typed.length === 0
          ? 0
          : Math.round((correct / typed.length) * 1000) / 10;

      setResult({ wpm, accuracy, seconds: Math.round(seconds * 10) / 10, chars: typed.length });
      setPhase('done');
    },
    [sentence],
  );

  const handleChange = useCallback(
    (value: string) => {
      if (phase === 'done') return;

      // 첫 입력 순간부터 측정 시작.
      if (phase === 'ready') {
        if (value.length === 0) return;
        startTimeRef.current = performance.now();
        setPhase('typing');
      }

      setInput(value);

      // 정답 문장 길이만큼 입력하면 자동 완료.
      if (value.length >= sentence.length) {
        finishMeasurement(value);
      }
    },
    [phase, sentence.length, finishMeasurement],
  );

  const restart = useCallback(
    (newSentence: boolean) => {
      startTimeRef.current = null;
      setInput('');
      setResult(null);
      setPhase('ready');
      if (newSentence) {
        setSentenceIndex((prev) => pickSentenceIndex(prev));
      }
    },
    [],
  );

  // 입력 중인 문자가 정답과 맞는지에 따라 색을 입힌 미리보기.
  const coloredSentence = useMemo(() => {
    return sentence.split('').map((char, i) => {
      let className = 'text-muted-foreground';
      if (i < input.length) {
        className =
          input[i] === char
            ? 'text-primary'
            : 'text-destructive underline decoration-wavy';
      } else if (i === input.length && phase !== 'done') {
        className = 'text-foreground bg-primary/20 rounded-sm';
      }
      return (
        <span key={i} className={className}>
          {char}
        </span>
      );
    });
  }, [sentence, input, phase]);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="타자 속도 테스트"
        onReset={input || phase === 'done' ? () => restart(false) : undefined}
      />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          아래 문장을 입력하세요. 첫 글자를 입력하는 순간부터 측정이 시작됩니다.
        </p>

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-base font-mono leading-relaxed break-keep">
            {coloredSentence}
          </div>

          <textarea
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            disabled={phase === 'done'}
            placeholder="여기에 입력하세요"
            rows={3}
            aria-label="타자 입력"
            className="w-full rounded-lg border bg-background px-3 py-2 text-base font-mono resize-y disabled:opacity-60"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground tabular-nums">
              {input.length} / {sentence.length}자
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => restart(false)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                다시 시작
              </Button>
              <Button size="sm" onClick={() => restart(true)}>
                새 문장
              </Button>
            </div>
          </div>
        </div>

        {phase === 'done' && result && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">측정 결과</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{result.wpm}</p>
                <p className="text-xs text-muted-foreground mt-1">WPM</p>
              </div>
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{result.accuracy}%</p>
                <p className="text-xs text-muted-foreground mt-1">정확도</p>
              </div>
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{result.seconds}s</p>
                <p className="text-xs text-muted-foreground mt-1">소요 시간</p>
              </div>
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{result.chars}</p>
                <p className="text-xs text-muted-foreground mt-1">입력 문자</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
