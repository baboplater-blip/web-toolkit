'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'between' | 'addsub';
type Op = 'add' | 'subtract';

const SECONDS_PER_DAY = 86400;

/** "HH:MM" 또는 "HH:MM:SS" → 0~86399 초. 형식 오류는 null. */
function parseTimeOfDay(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) return null;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0)) return null;

  const [hours, minutes, seconds = 0] = numbers;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;

  return hours * 3600 + minutes * 60 + seconds;
}

function parseIntField(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  return Number(trimmed);
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}시간 ${minutes}분 ${seconds}초`;
}

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface BetweenResult {
  totalSeconds: number;
  crossedMidnight: boolean;
}

interface AddSubResult {
  resultSeconds: number;
  dayOffset: number;
}

export default function TimeDurationPage() {
  const [mode, setMode] = useState<Mode>('between');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [baseTime, setBaseTime] = useState('');
  const [op, setOp] = useState<Op>('add');
  const [deltaHours, setDeltaHours] = useState('');
  const [deltaMinutes, setDeltaMinutes] = useState('');
  const [deltaSeconds, setDeltaSeconds] = useState('');
  const [copied, setCopied] = useState(false);

  const betweenResult = useMemo<BetweenResult | null>(() => {
    if (mode !== 'between') return null;
    const start = parseTimeOfDay(startTime);
    const end = parseTimeOfDay(endTime);
    if (start === null || end === null) return null;

    // 종료가 시작보다 빠르면 자정을 넘긴 것으로 간주.
    const crossedMidnight = end < start;
    const diff = crossedMidnight ? end + SECONDS_PER_DAY - start : end - start;
    return { totalSeconds: diff, crossedMidnight };
  }, [mode, startTime, endTime]);

  const addSubResult = useMemo<AddSubResult | null>(() => {
    if (mode !== 'addsub') return null;
    const base = parseTimeOfDay(baseTime);
    if (base === null) return null;

    const h = parseIntField(deltaHours);
    const m = parseIntField(deltaMinutes);
    const s = parseIntField(deltaSeconds);
    if (![h, m, s].every((part) => Number.isInteger(part) && part >= 0)) return null;

    const deltaSecondsTotal = h * 3600 + m * 60 + s;
    const signed = op === 'add' ? deltaSecondsTotal : -deltaSecondsTotal;
    const raw = base + signed;

    // 0~86399 로 정규화하고 일자 이월(±N일)을 분리.
    const dayOffset = Math.floor(raw / SECONDS_PER_DAY);
    const resultSeconds = ((raw % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
    return { resultSeconds, dayOffset };
  }, [mode, baseTime, op, deltaHours, deltaMinutes, deltaSeconds]);

  const betweenHasInput = startTime.trim() !== '' && endTime.trim() !== '';
  const addSubHasInput = baseTime.trim() !== '';

  function reset() {
    setMode('between');
    setStartTime('');
    setEndTime('');
    setBaseTime('');
    setOp('add');
    setDeltaHours('');
    setDeltaMinutes('');
    setDeltaSeconds('');
    setCopied(false);
  }

  async function copy() {
    let text = '';
    if (betweenResult) {
      text = formatDuration(betweenResult.totalSeconds);
    } else if (addSubResult) {
      const dayNote =
        addSubResult.dayOffset === 0
          ? ''
          : ` (${addSubResult.dayOffset > 0 ? '+' : ''}${addSubResult.dayOffset}일)`;
      text = `${formatClock(addSubResult.resultSeconds)}${dayNote}`;
    }
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 사용 불가 — 무시
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="시간 계산기" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          두 시각 사이의 간격을 구하거나, 기준 시간에 시·분·초를 더하고 뺍니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'between' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('between')}
            >
              두 시각 간격
            </Button>
            <Button
              type="button"
              variant={mode === 'addsub' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('addsub')}
            >
              시간 더하기·빼기
            </Button>
          </div>

          {mode === 'between' ? (
            <>
              <label className="block space-y-1">
                <span className="text-sm font-medium">시작 시각 (HH:MM 또는 HH:MM:SS)</span>
                <Input
                  inputMode="text"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  placeholder="예: 09:00"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">종료 시각 (HH:MM 또는 HH:MM:SS)</span>
                <Input
                  inputMode="text"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  placeholder="예: 17:30"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-1">
                <span className="text-sm font-medium">기준 시각 (HH:MM 또는 HH:MM:SS)</span>
                <Input
                  inputMode="text"
                  value={baseTime}
                  onChange={(event) => setBaseTime(event.target.value)}
                  placeholder="예: 14:20"
                />
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={op === 'add' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOp('add')}
                >
                  더하기 (+)
                </Button>
                <Button
                  type="button"
                  variant={op === 'subtract' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOp('subtract')}
                >
                  빼기 (−)
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="block space-y-1">
                  <span className="text-sm font-medium">시</span>
                  <Input
                    inputMode="numeric"
                    value={deltaHours}
                    onChange={(event) => setDeltaHours(event.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">분</span>
                  <Input
                    inputMode="numeric"
                    value={deltaMinutes}
                    onChange={(event) => setDeltaMinutes(event.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">초</span>
                  <Input
                    inputMode="numeric"
                    value={deltaSeconds}
                    onChange={(event) => setDeltaSeconds(event.target.value)}
                    placeholder="0"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {((mode === 'between' && betweenHasInput && !betweenResult) ||
          (mode === 'addsub' && addSubHasInput && !addSubResult)) && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            시각은 HH:MM 또는 HH:MM:SS (00:00~23:59:59) 형식으로, 더하고 뺄 값은 0 이상의 정수로 입력해 주세요.
          </p>
        )}

        {betweenResult && (
          <div className="flex items-start justify-between gap-2 rounded-xl border bg-card p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">간격</p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {formatDuration(betweenResult.totalSeconds)}
              </p>
              {betweenResult.crossedMidnight && (
                <p className="text-xs text-muted-foreground">자정을 넘긴 것으로 계산했습니다.</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}

        {addSubResult && (
          <div className="flex items-start justify-between gap-2 rounded-xl border bg-card p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">결과 시각</p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {formatClock(addSubResult.resultSeconds)}
              </p>
              {addSubResult.dayOffset !== 0 && (
                <p className="text-xs text-muted-foreground">
                  {addSubResult.dayOffset > 0 ? `${addSubResult.dayOffset}일 후` : `${-addSubResult.dayOffset}일 전`}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
