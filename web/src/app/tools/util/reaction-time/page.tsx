'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 빨강 → 초록 전환까지의 무작위 대기 시간 범위(ms). */
const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 4000;

/**
 * 측정 상태 머신.
 * - idle:    시작 전 / 측정 완료 후 대기
 * - waiting: 빨강 화면, 초록으로 바뀌길 기다리는 중 (이때 클릭하면 무효)
 * - ready:   초록 화면, 클릭하면 반응 시간 기록
 * - tooSoon: 초록 전에 클릭해 무효 처리됨
 */
type Phase = 'idle' | 'waiting' | 'ready' | 'tooSoon';

/** 숫자 배열의 평균을 정수로 반올림해 반환한다. 빈 배열이면 0. */
function averageMs(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / values.length);
}

export default function ReactionTimePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  // 'ready' 진입 시각(ms)과 대기 타이머 핸들.
  const greenAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 언마운트 시 예약된 타이머 정리 (메모리 누수·콜백 방지).
  useEffect(() => clearPendingTimer, [clearPendingTimer]);

  const startWaiting = useCallback(() => {
    clearPendingTimer();
    setLastTime(null);
    setPhase('waiting');
    greenAtRef.current = null;

    const delay =
      MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      greenAtRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, [clearPendingTimer]);

  const handleAreaClick = useCallback(() => {
    switch (phase) {
      case 'idle':
      case 'tooSoon':
        startWaiting();
        break;
      case 'waiting':
        // 초록 전에 클릭 → 무효.
        clearPendingTimer();
        greenAtRef.current = null;
        setPhase('tooSoon');
        break;
      case 'ready': {
        const greenAt = greenAtRef.current;
        if (greenAt === null) return;
        const reaction = Math.round(performance.now() - greenAt);
        greenAtRef.current = null;
        setLastTime(reaction);
        setHistory((prev) => [...prev, reaction]);
        setPhase('idle');
        break;
      }
      default:
        break;
    }
  }, [phase, startWaiting, clearPendingTimer]);

  const resetHistory = useCallback(() => {
    clearPendingTimer();
    greenAtRef.current = null;
    setHistory([]);
    setLastTime(null);
    setPhase('idle');
  }, [clearPendingTimer]);

  const average = averageMs(history);
  const best = history.length > 0 ? Math.min(...history) : 0;

  const areaStyles: Record<Phase, string> = {
    idle: 'bg-slate-700 text-white',
    waiting: 'bg-red-600 text-white',
    ready: 'bg-green-600 text-white',
    tooSoon: 'bg-amber-500 text-white',
  };

  const areaText: Record<Phase, string> = {
    idle:
      lastTime !== null
        ? `${lastTime} ms — 다시 측정하려면 클릭`
        : '클릭하면 시작합니다',
    waiting: '초록색으로 바뀌면 클릭하세요...',
    ready: '지금 클릭!',
    tooSoon: '너무 빨랐습니다. 다시 클릭해 재시도',
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="반응속도 테스트"
        onReset={history.length > 0 ? resetHistory : undefined}
      />

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          화면이 초록색으로 바뀌는 순간 클릭하세요. 초록 전에 클릭하면 무효입니다.
        </p>

        <button
          type="button"
          onClick={handleAreaClick}
          aria-label="반응 측정 영역"
          aria-live="polite"
          className={`w-full select-none rounded-2xl border text-center text-lg font-semibold transition-colors h-64 flex items-center justify-center px-4 ${areaStyles[phase]}`}
        >
          {areaText[phase]}
        </button>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {average > 0 ? `${average}` : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">평균 (ms)</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {best > 0 ? `${best}` : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">최고 (ms)</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{history.length}</p>
            <p className="text-xs text-muted-foreground mt-1">측정 횟수</p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">측정 기록</p>
              <Button variant="outline" size="sm" onClick={resetHistory}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                기록 초기화
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((value, i) => (
                <span
                  key={i}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-mono tabular-nums"
                >
                  {value} ms
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
