'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'sleepNow' | 'wakeAt';

const CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 14;
const CYCLE_COUNTS = [6, 5, 4]; // 권장 우선순위(많은 주기 먼저)
const SECONDS_PER_DAY = 24 * 60;

/** "HH:MM" → 0~1439 분. 형식 오류는 null. */
function parseTimeOfDay(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parts = trimmed.split(':');
  if (parts.length !== 2) return null;
  const [hours, minutes] = parts.map((part) => Number(part));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatTimeOfDay(totalMinutes: number): string {
  const normalized = ((totalMinutes % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

interface Suggestion {
  cycles: number;
  totalSleepMinutes: number;
  time: number;
}

export default function SleepCalcPage() {
  const [mode, setMode] = useState<Mode>('sleepNow');
  // 하이드레이션 안전: 빈 값으로 시작하고 마운트 후 현재 시각 주입.
  const [time, setTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const now = new Date();
    const value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(value);
  }, []);

  const baseMinutes = useMemo(() => parseTimeOfDay(time), [time]);

  const suggestions = useMemo<Suggestion[] | null>(() => {
    if (baseMinutes === null) return null;

    return CYCLE_COUNTS.map((cycles) => {
      const sleepMinutes = cycles * CYCLE_MINUTES;
      // 취침: 기상시각 - (수면 + 잠드는 시간). 기상: 취침시각 + 잠드는 시간 + 수면.
      const offset = mode === 'sleepNow' ? FALL_ASLEEP_MINUTES + sleepMinutes : -(FALL_ASLEEP_MINUTES + sleepMinutes);
      return {
        cycles,
        totalSleepMinutes: sleepMinutes,
        time: baseMinutes + offset,
      };
    });
  }, [baseMinutes, mode]);

  function reset() {
    setMode('sleepNow');
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setCopied(false);
  }

  async function copy() {
    if (!suggestions) return;
    const heading = mode === 'sleepNow' ? '추천 기상 시각' : '추천 취침 시각';
    const lines = suggestions.map(
      (s) => `${formatTimeOfDay(s.time)} (${s.cycles}주기 · ${(s.totalSleepMinutes / 60).toFixed(1)}시간)`,
    );
    try {
      await navigator.clipboard.writeText([heading, ...lines].join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 사용 불가 — 무시
    }
  }

  const inputLabel = mode === 'sleepNow' ? '잠드는 시각 (HH:MM)' : '기상 시각 (HH:MM)';
  const resultHeading = mode === 'sleepNow' ? '추천 기상 시각' : '추천 취침 시각';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="수면 시간 계산기" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          90분 수면 주기에 맞춰 개운하게 일어날 수 있는 시각을 추천합니다. 잠드는 데 걸리는 시간 약{' '}
          {FALL_ASLEEP_MINUTES}분을 반영합니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'sleepNow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('sleepNow')}
            >
              지금 자면 언제 일어날까
            </Button>
            <Button
              type="button"
              variant={mode === 'wakeAt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('wakeAt')}
            >
              이 시각에 일어나려면
            </Button>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">{inputLabel}</span>
            <Input
              inputMode="text"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="예: 23:30"
            />
          </label>
        </div>

        {time.trim() !== '' && !suggestions && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            시각을 HH:MM (00:00~23:59) 형식으로 입력해 주세요.
          </p>
        )}

        {suggestions && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{resultHeading}</p>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            <ul className="space-y-2">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.cycles}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                >
                  <span className="text-2xl font-bold tabular-nums text-primary">
                    {formatTimeOfDay(suggestion.time)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {suggestion.cycles}주기 · {(suggestion.totalSleepMinutes / 60).toFixed(1)}시간
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              위쪽일수록 권장 수면 시간(7.5~9시간)에 가깝습니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
