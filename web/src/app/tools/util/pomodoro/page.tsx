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
  // 단계 종료 시각(epoch ms)과 백업 타이머 — 백그라운드 탭에서 인터벌이 스로틀돼도
  // 벽시계(Date.now)와 setTimeout 으로 정확한 시점에 단계를 전환한다(timer-stopwatch 패턴).
  const endAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 단계 전환을 인터벌 콜백 안에서 안전하게 처리하기 위한 최신값 ref
  const phaseRef = useRef<Phase>(phase);
  const focusMinRef = useRef(DEFAULT_FOCUS_MIN);
  const breakMinRef = useRef(DEFAULT_BREAK_MIN);
  const finishPhaseRef = useRef<(() => void) | null>(null);

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

  const clearBackupTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 단계 종료 처리 — 알림·비프 후 다음 단계로 전환하고 종료시각·백업 타이머 재설정.
  // 첫 줄의 clearBackupTimeout 이 인터벌·백업 타이머의 이중 발화를 막는다.
  const finishPhase = useCallback(() => {
    clearBackupTimeout();
    const finishedPhase = phaseRef.current;
    notify(finishedPhase);
    playBeep();

    let nextSeconds: number;
    if (finishedPhase === 'focus') {
      setCompletedCycles((c) => c + 1);
      setPhase('break');
      phaseRef.current = 'break';
      nextSeconds = breakMinRef.current * 60;
    } else {
      setPhase('focus');
      phaseRef.current = 'focus';
      nextSeconds = focusMinRef.current * 60;
    }
    endAtRef.current = Date.now() + nextSeconds * 1000;
    timeoutRef.current = setTimeout(
      () => finishPhaseRef.current?.(),
      nextSeconds * 1000,
    );
    setRemaining(nextSeconds);
  }, [clearBackupTimeout]);

  useEffect(() => {
    finishPhaseRef.current = finishPhase;
  }, [finishPhase]);

  // 인터벌은 한 번만 설치하고, 남은 시간은 틱 횟수가 아닌 벽시계(절대 종료시각)로
  // 계산한다 — 백그라운드 탭에서 인터벌이 스로틀돼도 표시·종료 판정이 어긋나지 않는다.
  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }
    if (intervalRef.current !== null) return;

    intervalRef.current = setInterval(() => {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const remainingMs = endAt - Date.now();
      if (remainingMs <= 0) {
        finishPhaseRef.current?.();
        return;
      }
      setRemaining(Math.ceil(remainingMs / 1000));
    }, 1000);

    return clearTimer;
  }, [running, clearTimer]);

  // 언마운트 시 인터벌·백업 타이머 정리
  useEffect(() => clearTimer, [clearTimer]);
  useEffect(() => clearBackupTimeout, [clearBackupTimeout]);

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
    // 현재 남은 시간 기준으로 절대 종료시각 고정 + 백그라운드 백업 타이머 설정.
    // (Date.now() 는 핸들러 안에서만 사용 — 초기 렌더는 결정적으로 유지)
    const remainingMs = Math.max(0, remaining) * 1000;
    endAtRef.current = Date.now() + remainingMs;
    clearBackupTimeout();
    timeoutRef.current = setTimeout(
      () => finishPhaseRef.current?.(),
      remainingMs,
    );
    setRunning(true);
  }

  function pause() {
    clearBackupTimeout();
    // 일시정지 시점의 정확한 남은 시간을 벽시계 기준으로 고정
    if (endAtRef.current !== null) {
      setRemaining(Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000)));
      endAtRef.current = null;
    }
    setRunning(false);
  }

  function reset() {
    clearBackupTimeout();
    endAtRef.current = null;
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
