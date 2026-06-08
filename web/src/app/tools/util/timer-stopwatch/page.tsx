'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Pause,
  Play,
  RotateCcw,
  Square,
  Timer as TimerIcon,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Mode = 'stopwatch' | 'timer';

function formatTime(ms: number, withMs = false): string {
  const total = Math.max(0, Math.floor(ms));
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const base =
    h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return withMs ? `${base}.${pad(cs)}` : base;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    /* noop */
  }
}

export default function TimerStopwatchPage() {
  const [mode, setMode] = useState<Mode>('stopwatch');

  // 공통 시간 상태 (epoch ms 단위)
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // 타이머 종료 시각(epoch ms)과 백업 타이머. 백그라운드 탭에서 RAF 가 멈춰도
  // 벽시계(Date.now) 와 setTimeout 으로 정확한 시점에 알람을 발화한다.
  const timerEndAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 스톱워치 랩
  const [laps, setLaps] = useState<number[]>([]);

  // 타이머 설정
  const [timerH, setTimerH] = useState(0);
  const [timerM, setTimerM] = useState(5);
  const [timerS, setTimerS] = useState(0);
  const totalTarget = (timerH * 3600 + timerM * 60 + timerS) * 1000;
  const [done, setDone] = useState(false);

  const clearBackupTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const fireDone = useCallback(() => {
    clearBackupTimeout();
    timerEndAtRef.current = null;
    setRunning(false);
    setElapsed(totalTarget);
    setDone(true);
    playBeep();
    try {
      if (typeof document !== 'undefined') document.title = '⏰ 타이머 — Web Toolkit';
    } catch {
      /* noop */
    }
  }, [clearBackupTimeout, totalTarget]);

  const tick = useCallback(() => {
    // 타이머 모드: 벽시계 기준 남은 시간 계산(백그라운드 탭에서 RAF 가
    // 느려져도 표시·종료 판정이 실제 경과 시간과 어긋나지 않는다).
    if (timerEndAtRef.current !== null) {
      const remainingMs = timerEndAtRef.current - Date.now();
      if (remainingMs <= 0) {
        fireDone();
        return;
      }
      setElapsed(totalTarget - remainingMs);
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const now = performance.now();
    if (lastTickRef.current !== null) {
      const delta = now - lastTickRef.current;
      setElapsed((prev) => prev + delta);
    }
    lastTickRef.current = now;
    rafRef.current = requestAnimationFrame(tick);
  }, [fireDone, totalTarget]);

  useEffect(() => {
    if (running) {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [running, tick]);

  // 언마운트 시 백업 setTimeout 정리(언마운트 후 setState 방지).
  useEffect(() => clearBackupTimeout, [clearBackupTimeout]);

  const start = () => {
    if (mode === 'timer' && totalTarget === 0) return;
    if (mode === 'timer') {
      // 현재 남은 시간 기준으로 절대 종료시각 고정 + 백그라운드 백업 타이머 설정.
      const remainingMs = Math.max(0, totalTarget - elapsed);
      timerEndAtRef.current = Date.now() + remainingMs;
      clearBackupTimeout();
      timeoutRef.current = setTimeout(fireDone, remainingMs);
    }
    setRunning(true);
    setDone(false);
  };
  const pause = () => {
    clearBackupTimeout();
    timerEndAtRef.current = null;
    setRunning(false);
  };
  const reset = () => {
    clearBackupTimeout();
    timerEndAtRef.current = null;
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    setDone(false);
  };
  const lap = () => {
    if (!running) return;
    setLaps((prev) => [elapsed, ...prev]);
  };

  const remaining = Math.max(0, totalTarget - elapsed);
  const display =
    mode === 'stopwatch' ? formatTime(elapsed, true) : formatTime(remaining, true);

  const progress =
    mode === 'timer' && totalTarget > 0
      ? Math.min(100, (elapsed / totalTarget) * 100)
      : 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({
              variant: 'ghost',
              size: 'icon',
              className: 'h-8 w-8',
            })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <TimerIcon className="h-5 w-5" />
          <h1 className="font-semibold text-base">타이머·스톱워치</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('stopwatch');
              reset();
            }}
            className={`h-10 text-sm rounded-md border font-medium ${
              mode === 'stopwatch'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
            aria-pressed={mode === 'stopwatch'}
          >
            스톱워치
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('timer');
              reset();
            }}
            className={`h-10 text-sm rounded-md border font-medium ${
              mode === 'timer'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
            aria-pressed={mode === 'timer'}
          >
            타이머
          </button>
        </div>

        {mode === 'timer' && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              목표 시간
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="시"
                value={timerH}
                onChange={setTimerH}
                max={23}
                disabled={running}
              />
              <NumberField
                label="분"
                value={timerM}
                onChange={setTimerM}
                max={59}
                disabled={running}
              />
              <NumberField
                label="초"
                value={timerS}
                onChange={setTimerS}
                max={59}
                disabled={running}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '1분', h: 0, m: 1, s: 0 },
                { label: '3분', h: 0, m: 3, s: 0 },
                { label: '5분', h: 0, m: 5, s: 0 },
                { label: '10분', h: 0, m: 10, s: 0 },
                { label: '25분(뽀모도로)', h: 0, m: 25, s: 0 },
                { label: '1시간', h: 1, m: 0, s: 0 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={running}
                  onClick={() => {
                    setTimerH(p.h);
                    setTimerM(p.m);
                    setTimerS(p.s);
                  }}
                  className="text-[11px] rounded-full border px-2 py-0.5 hover:bg-muted disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={cn(
            'rounded-xl border bg-card p-6 text-center space-y-4',
            done && 'border-emerald-500/50 bg-emerald-500/5',
          )}
        >
          <p
            className="text-5xl sm:text-7xl font-bold font-mono tabular-nums"
            aria-live="polite"
          >
            {display}
          </p>
          {mode === 'timer' && totalTarget > 0 && (
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="타이머 진행률"
            >
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {done && (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Bell className="h-4 w-4" />
              시간이 끝났습니다.
            </p>
          )}

          <div className="flex justify-center gap-2 flex-wrap">
            {!running && (
              <Button onClick={start} disabled={mode === 'timer' && totalTarget === 0}>
                <Play className="h-4 w-4 mr-1" />
                {elapsed > 0 ? '재개' : '시작'}
              </Button>
            )}
            {running && (
              <Button onClick={pause} variant="secondary">
                <Pause className="h-4 w-4 mr-1" />
                일시정지
              </Button>
            )}
            {mode === 'stopwatch' && running && (
              <Button onClick={lap} variant="outline">
                <Square className="h-4 w-4 mr-1" />
                랩
              </Button>
            )}
            <Button onClick={reset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-1" />
              리셋
            </Button>
          </div>
        </div>

        {mode === 'stopwatch' && laps.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              랩 ({laps.length}개)
            </h2>
            <ol className="space-y-1">
              {laps.map((t, i) => {
                const idx = laps.length - i;
                const diff = i < laps.length - 1 ? t - laps[i + 1] : t;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums border-b last:border-b-0 py-1"
                  >
                    <span className="text-muted-foreground">랩 {idx}</span>
                    <span>+{formatTime(diff, true)}</span>
                    <span className="font-semibold">{formatTime(t, true)}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            <code className="font-mono">requestAnimationFrame</code> +{' '}
            <code className="font-mono">performance.now</code> 기반 정밀 표시. 타이머는 절대
            종료시각(<code className="font-mono">Date.now</code>)과{' '}
            <code className="font-mono">setTimeout</code> 백업으로 백그라운드 탭에서도 정확한 시점에 알람이 울립니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  max,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
        {label}
      </label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))
        }
        disabled={disabled}
        className="text-center"
        aria-label={label}
      />
    </div>
  );
}
