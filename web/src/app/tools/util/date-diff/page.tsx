'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Mode = 'diff' | 'add';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" 를 UTC 자정 ms 로 파싱 (시간대 영향 제거). null = 무효. */
function parseDate(value: string): number | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  const utc = Date.UTC(y, mo - 1, d);
  const check = new Date(utc);
  // 윤년·월별 일수 검증 (예: 2026-02-30 거르기).
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return utc;
}

/** UTC ms 를 "YYYY-MM-DD (요일)" 로 포맷. */
function formatDate(utcMillis: number): string {
  const date = new Date(utcMillis);
  const pad = (n: number) => String(n).padStart(2, '0');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getUTCDay()];
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )} (${weekday})`;
}

/** 두 UTC 자정 사이의 연/월/일 차이 (달력 기준). end >= start 가정. */
function calendarBreakdown(
  startMs: number,
  endMs: number,
): { years: number; months: number; days: number } {
  const start = new Date(startMs);
  const end = new Date(endMs);
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months -= 1;
    // 이전 달(= end 기준 직전 달)의 일수를 더해 보정.
    const prevMonthDays = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0),
    ).getUTCDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function DateDiffPage() {
  const [mode, setMode] = useState<Mode>('diff');
  // diff 모드
  const [startDate, setStartDate] = useState<string>(todayInputValue);
  const [endDate, setEndDate] = useState<string>(todayInputValue);
  // add 모드
  const [baseDate, setBaseDate] = useState<string>(todayInputValue);
  const [offsetDays, setOffsetDays] = useState<string>('100');
  // 복사 피드백: 어느 버튼이 방금 복사됐는지(또는 실패했는지) 추적.
  const [copied, setCopied] = useState<'diff' | 'add' | null>(null);
  const [copyError, setCopyError] = useState<'diff' | 'add' | null>(null);

  const dateInputClass =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

  const diffResult = useMemo(() => {
    if (mode !== 'diff') return null;
    const startMs = parseDate(startDate);
    const endMs = parseDate(endDate);
    if (startMs === null || endMs === null) return null;

    const lo = Math.min(startMs, endMs);
    const hi = Math.max(startMs, endMs);
    const totalDays = Math.round((hi - lo) / MS_PER_DAY);
    const breakdown = calendarBreakdown(lo, hi);
    return {
      totalDays,
      weeks: totalDays / 7,
      breakdown,
    };
  }, [mode, startDate, endDate]);

  const addResult = useMemo(() => {
    if (mode !== 'add') return null;
    const baseMs = parseDate(baseDate);
    if (baseMs === null) return null;
    const trimmed = offsetDays.trim().replace(/,/g, '');
    if (!/^[+-]?\d+$/.test(trimmed)) return null;
    const days = Number(trimmed);
    if (!Number.isFinite(days)) return null;
    const targetMs = baseMs + days * MS_PER_DAY;
    return {
      target: formatDate(targetMs),
      days,
    };
  }, [mode, baseDate, offsetDays]);

  async function copyValue(key: 'diff' | 'add', value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(key);
      setTimeout(() => setCopyError(null), 1500);
    }
  }

  function copyDiff() {
    if (diffResult) void copyValue('diff', `${diffResult.totalDays}일`);
  }

  function copyAdd() {
    if (addResult) void copyValue('add', addResult.target);
  }

  function handleReset() {
    const today = todayInputValue();
    setMode('diff');
    setStartDate(today);
    setEndDate(today);
    setBaseDate(today);
    setOffsetDays('100');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="날짜 계산기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          두 날짜 사이의 일수를 구하거나 특정 날짜에 일수를 더합니다.
        </p>

      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            { id: 'diff', label: '날짜 사이' },
            { id: 'add', label: '날짜 + N일' },
          ] as const
        ).map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={mode === option.id ? 'default' : 'outline'}
            onClick={() => setMode(option.id)}
            aria-pressed={mode === option.id}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {mode === 'diff' ? (
        <>
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">시작 날짜</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputClass}
                aria-label="시작 날짜"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">끝 날짜</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={dateInputClass}
                aria-label="끝 날짜"
              />
            </label>
          </div>

          {!diffResult && (
            <p role="alert" className="text-sm text-destructive">
              올바른 두 날짜를 선택하세요.
            </p>
          )}

          {diffResult && (
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">총 일수</p>
                  <p className="text-3xl font-bold tabular-nums">
                    {diffResult.totalDays.toLocaleString()}
                    <span className="ml-1 text-sm text-muted-foreground">
                      일
                    </span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={copyDiff}>
                  {copied === 'diff' ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  <span className="ml-1">
                    {copied === 'diff'
                      ? '복사됨'
                      : copyError === 'diff'
                        ? '복사 실패'
                        : '복사'}
                  </span>
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">주 단위</dt>
                  <dd className="font-medium tabular-nums">
                    {diffResult.weeks
                      .toFixed(2)
                      .replace(/\.?0+$/, '')}{' '}
                    주
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    연·월·일
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {diffResult.breakdown.years > 0 &&
                      `${diffResult.breakdown.years}년 `}
                    {diffResult.breakdown.months > 0 &&
                      `${diffResult.breakdown.months}개월 `}
                    {diffResult.breakdown.days}일
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">기준 날짜</span>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className={dateInputClass}
                aria-label="기준 날짜"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">
                더할 일수 (음수면 빼기)
              </span>
              <Input
                inputMode="numeric"
                value={offsetDays}
                onChange={(e) => setOffsetDays(e.target.value)}
                placeholder="예: 100 또는 -30"
                aria-label="더할 일수"
              />
            </label>
          </div>

          {!addResult && (
            <p role="alert" className="text-sm text-destructive">
              올바른 기준 날짜와 정수 일수를 입력하세요.
            </p>
          )}

          {addResult && (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {addResult.days >= 0
                    ? `${addResult.days}일 후`
                    : `${Math.abs(addResult.days)}일 전`}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {addResult.target}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyAdd}>
                {copied === 'add' ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied === 'add'
                    ? '복사됨'
                    : copyError === 'add'
                      ? '복사 실패'
                      : '복사'}
                </span>
              </Button>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        날짜는 시간대 영향을 받지 않도록 UTC 자정 기준으로 계산됩니다. 모든
        계산은 브라우저에서 즉시 처리됩니다.
      </p>
      </main>
    </div>
  );
}
