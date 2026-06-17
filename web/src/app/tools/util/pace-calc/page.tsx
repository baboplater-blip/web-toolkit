'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'pace' | 'time';
type Unit = 'km' | 'mile';

const KM_PER_MILE = 1.609344;

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

/** "분:초" 또는 "시:분:초" 형태를 초 단위로 파싱. 빈 칸/형식 오류는 null. */
function parseClock(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) return null;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isFinite(part) || part < 0)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = numbers;
    return minutes * 60 + seconds;
  }
  const [hours, minutes, seconds] = numbers;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatHms(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function formatPace(secondsPerUnit: number): string {
  const rounded = Math.round(secondsPerUnit);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface PaceResult {
  perKm: number;
  perMile: number;
}

interface TimeResult {
  totalSeconds: number;
}

export default function PaceCalcPage() {
  const [mode, setMode] = useState<Mode>('pace');
  const [unit, setUnit] = useState<Unit>('km');
  const [distance, setDistance] = useState('');
  const [time, setTime] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [copied, setCopied] = useState(false);

  const distanceKm = useMemo<number | null>(() => {
    const value = parseNumber(distance);
    if (distance.trim() === '' || !Number.isFinite(value) || value <= 0) return null;
    return unit === 'km' ? value : value * KM_PER_MILE;
  }, [distance, unit]);

  const paceResult = useMemo<PaceResult | null>(() => {
    if (mode !== 'pace' || distanceKm === null) return null;
    const totalSeconds = parseClock(time);
    if (totalSeconds === null || totalSeconds <= 0) return null;

    const perKm = totalSeconds / distanceKm;
    const perMile = perKm * KM_PER_MILE;
    return { perKm, perMile };
  }, [mode, distanceKm, time]);

  const timeResult = useMemo<TimeResult | null>(() => {
    if (mode !== 'time' || distanceKm === null) return null;
    const paceSeconds = parseClock(targetPace);
    if (paceSeconds === null || paceSeconds <= 0) return null;

    // 목표 페이스는 선택한 단위 기준(분/단위) → km 환산 후 거리(km)에 곱한다.
    const pacePerKm = unit === 'km' ? paceSeconds : paceSeconds / KM_PER_MILE;
    return { totalSeconds: pacePerKm * distanceKm };
  }, [mode, distanceKm, targetPace, unit]);

  const hasInput =
    distance.trim() !== '' && (mode === 'pace' ? time.trim() !== '' : targetPace.trim() !== '');
  const result = mode === 'pace' ? paceResult : timeResult;

  function reset() {
    setMode('pace');
    setUnit('km');
    setDistance('');
    setTime('');
    setTargetPace('');
    setCopied(false);
  }

  async function copy() {
    let text = '';
    if (paceResult) {
      text = `페이스: ${formatPace(paceResult.perKm)} /km · ${formatPace(paceResult.perMile)} /mile`;
    } else if (timeResult) {
      text = `완주 시간: ${formatHms(timeResult.totalSeconds)}`;
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
      <ToolHeader title="러닝 페이스 계산기" onReset={reset} widthClass="max-w-xl" />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          거리·시간으로 페이스를, 또는 목표 페이스로 완주 시간을 계산합니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'pace' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('pace')}
            >
              거리+시간 → 페이스
            </Button>
            <Button
              type="button"
              variant={mode === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('time')}
            >
              거리+페이스 → 완주 시간
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">거리 단위</span>
            <Button
              type="button"
              variant={unit === 'km' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUnit('km')}
            >
              km
            </Button>
            <Button
              type="button"
              variant={unit === 'mile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUnit('mile')}
            >
              mile
            </Button>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">거리 ({unit})</span>
            <Input
              inputMode="decimal"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              placeholder={unit === 'km' ? '예: 10' : '예: 6.2'}
            />
          </label>

          {mode === 'pace' ? (
            <label className="block space-y-1">
              <span className="text-sm font-medium">시간 (분:초 또는 시:분:초)</span>
              <Input
                inputMode="text"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                placeholder="예: 52:30 또는 1:05:00"
              />
            </label>
          ) : (
            <label className="block space-y-1">
              <span className="text-sm font-medium">목표 페이스 (분:초 /{unit})</span>
              <Input
                inputMode="text"
                value={targetPace}
                onChange={(event) => setTargetPace(event.target.value)}
                placeholder="예: 5:15"
              />
            </label>
          )}
        </div>

        {hasInput && !result && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            입력값을 확인해 주세요. 거리는 0보다 큰 숫자, 시간·페이스는 분:초 또는 시:분:초 형식이어야 합니다.
          </p>
        )}

        {paceResult && (
          <div className="flex items-start justify-between gap-2 rounded-xl border bg-card p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">페이스</p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {formatPace(paceResult.perKm)}
                <span className="ml-1 text-base font-normal text-muted-foreground">/km</span>
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatPace(paceResult.perMile)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/mile</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}

        {timeResult && (
          <div className="flex items-start justify-between gap-2 rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">예상 완주 시간</p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {formatHms(timeResult.totalSeconds)}
              </p>
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
