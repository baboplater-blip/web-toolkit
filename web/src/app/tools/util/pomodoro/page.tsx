'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, TimerReset } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Phase = 'focus' | 'break';

const DEFAULT_FOCUS_MIN = 25;
const DEFAULT_BREAK_MIN = 5;
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

function clampMinutes(value: string, fallback: number): number {
  const n = Number(value.trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), MIN_MINUTES), MAX_MINUTES);
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 단계 종료 비프음 — AudioContext 오실레이터로 짧게 재생 */
function playBeep(): void {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.42);
    oscillator.onended = () => {
      void ctx.close();
    };
  } catch (err) {
    // 오디오 정책상 실패해도 타이머 동작에는 영향 없음
    console.warn('[pomodoro] beep failed', err);
  }
}

function notify(phase: Phase): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  const title =
    phase === 'focus' ? '집중 시간 종료 — 휴식하세요' : '휴식 종료 — 다시 집중!';
  try {
    new Notification('뽀모도로 타이머', { body: title });
  } catch (err) {
    console.warn('[pomodoro] notification failed', err);
  }
}

export default function PomodoroPage() {
  const [focusMin, setFocusMin] = useState(String(DEFAULT_FOCUS_MIN));
  const [breakMin, setBreakMin] = useState(String(DEFAULT_BREAK_MIN));
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState(DEFAULT_FOCUS_MIN * 60);
  const [running, setRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 단계 전환을 인터벌 콜백 안에서 안전하게 처리하기 위한 최신값 ref
  const phaseRef = useRef<Phase>(phase);
  const focusMinRef = useRef(DEFAULT_FOCUS_MIN);
  const breakMinRef = useRef(DEFAULT_BREAK_MIN);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    focusMinRef.current = clampMinutes(focusMin, DEFAULT_FOCUS_MIN);
  }, [focusMin]);
  useEffect(() => {
    breakMinRef.current = clampMinutes(breakMin, DEFAULT_BREAK_MIN);
  }, [breakMin]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 인터벌은 한 번만 설치하고 ref 로 최신 단계를 참조해 전환한다.
  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }
    if (intervalRef.current !== null) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1;

        // 현재 단계 종료 → 알림·비프 후 다음 단계로 전환
        const finishedPhase = phaseRef.current;
        notify(finishedPhase);
        playBeep();

        if (finishedPhase === 'focus') {
          setCompletedCycles((c) => c + 1);
          setPhase('break');
          phaseRef.current = 'break';
          return breakMinRef.current * 60;
        }
        setPhase('focus');
        phaseRef.current = 'focus';
        return focusMinRef.current * 60;
      });
    }, 1000);

    return clearTimer;
  }, [running, clearTimer]);

  // 언마운트 시 인터벌 정리
  useEffect(() => clearTimer, [clearTimer]);

  async function start() {
    // 첫 시작 시 알림 권한 요청 (거부돼도 비프는 동작)
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn('[pomodoro] permission request failed', err);
      }
    }
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    clearTimer();
    setPhase('focus');
    phaseRef.current = 'focus';
    setRemaining(clampMinutes(focusMin, DEFAULT_FOCUS_MIN) * 60);
    setCompletedCycles(0);
  }

  // 정지 상태에서 분 설정을 바꾸면 현재 단계 남은 시간을 동기화
  function handleFocusChange(value: string) {
    setFocusMin(value);
    if (!running && phase === 'focus') {
      setRemaining(clampMinutes(value, DEFAULT_FOCUS_MIN) * 60);
    }
  }
  function handleBreakChange(value: string) {
    setBreakMin(value);
    if (!running && phase === 'break') {
      setRemaining(clampMinutes(value, DEFAULT_BREAK_MIN) * 60);
    }
  }

  const phaseLabel = phase === 'focus' ? '집중' : '휴식';
  const phaseColor =
    phase === 'focus'
      ? 'text-red-500 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <TimerReset className="h-5 w-5 text-primary" aria-hidden />
          뽀모도로 타이머
        </h1>
        <p className="text-sm text-muted-foreground">
          25분 집중 + 5분 휴식 사이클을 반복하는 생산성 타이머입니다.
        </p>
      </header>

      <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
        <p className={`text-sm font-semibold ${phaseColor}`}>{phaseLabel}</p>
        <p
          className="text-6xl font-bold tabular-nums"
          aria-live="polite"
          aria-label={`남은 시간 ${formatClock(remaining)}`}
        >
          {formatClock(remaining)}
        </p>
        <div className="flex justify-center gap-2">
          {running ? (
            <Button onClick={pause}>
              <Pause className="h-4 w-4" />
              일시정지
            </Button>
          ) : (
            <Button onClick={start}>
              <Play className="h-4 w-4" />
              시작
            </Button>
          )}
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            리셋
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          완료한 집중 사이클: <span className="font-semibold tabular-nums">{completedCycles}</span>회
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">집중 시간 (분)</span>
          <Input
            inputMode="numeric"
            value={focusMin}
            onChange={(e) => handleFocusChange(e.target.value)}
            placeholder="25"
            aria-label="집중 시간(분)"
            disabled={running}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">휴식 시간 (분)</span>
          <Input
            inputMode="numeric"
            value={breakMin}
            onChange={(e) => handleBreakChange(e.target.value)}
            placeholder="5"
            aria-label="휴식 시간(분)"
            disabled={running}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          단계가 끝나면 브라우저 알림과 짧은 알림음이 울립니다. (1~180분)
        </p>
      </div>
    </main>
  );
}
