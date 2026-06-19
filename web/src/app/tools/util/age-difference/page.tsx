'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

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

interface AgeDifferenceResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export default function AgeDifferencePage() {
  // 하이드레이션 안전: 두 날짜 입력은 항상 빈 값으로 시작(결정적 초기 렌더).
  const [firstDate, setFirstDate] = useState('');
  const [secondDate, setSecondDate] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const dateInputClass =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

  const result = useMemo<AgeDifferenceResult | null>(() => {
    const firstMs = parseDate(firstDate);
    const secondMs = parseDate(secondDate);
    if (firstMs === null || secondMs === null) return null;

    // 순서 무관: 절댓값 차이로 계산.
    const lo = Math.min(firstMs, secondMs);
    const hi = Math.max(firstMs, secondMs);
    const totalDays = Math.round((hi - lo) / MS_PER_DAY);
    const breakdown = calendarBreakdown(lo, hi);
    return { ...breakdown, totalDays };
  }, [firstDate, secondDate]);

  function formatGap(r: AgeDifferenceResult): string {
    const parts: string[] = [];
    if (r.years > 0) parts.push(`${r.years}년`);
    if (r.months > 0) parts.push(`${r.months}개월`);
    parts.push(`${r.days}일`);
    return parts.join(' ');
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatGap(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setFirstDate('');
    setSecondDate('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="나이 차이 계산기"
        widthClass="max-w-xl"
        onReset={firstDate || secondDate ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          두 생년월일 사이의 정확한 나이 차이를 연·월·일로 계산합니다. 입력 순서는
          상관없습니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">첫 번째 생년월일</span>
            <input
              type="date"
              value={firstDate}
              onChange={(e) => setFirstDate(e.target.value)}
              className={dateInputClass}
              aria-label="첫 번째 생년월일"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">두 번째 생년월일</span>
            <input
              type="date"
              value={secondDate}
              onChange={(e) => setSecondDate(e.target.value)}
              className={dateInputClass}
              aria-label="두 번째 생년월일"
            />
          </label>
        </div>

        {!result && (
          <p role="alert" className="text-sm text-destructive">
            올바른 두 생년월일을 선택하세요.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">나이 차이</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatGap(result)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="ml-1">
                  {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
                </span>
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">연·월·일</dt>
                <dd className="font-medium tabular-nums">
                  {result.years > 0 && `${result.years}년 `}
                  {result.months > 0 && `${result.months}개월 `}
                  {result.days}일
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">총 일수</dt>
                <dd className="font-medium tabular-nums">
                  {result.totalDays.toLocaleString()}일
                </dd>
              </div>
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          날짜는 시간대 영향을 받지 않도록 UTC 자정 기준으로 계산됩니다. 모든
          계산은 브라우저에서 즉시 처리됩니다.
        </p>
      </main>
    </div>
  );
}
