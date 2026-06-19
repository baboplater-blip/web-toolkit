'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarHeart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const dateInputClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

/** "YYYY-MM-DD" 를 로컬 자정 Date 로 파싱. 무효한 날짜는 null. */
function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  const date = new Date(y, mo - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Date 를 "YYYY-MM-DD (요일)" 로 포맷. */
function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} (${WEEKDAYS[date.getDay()]})`;
}

/** base 에 days 일을 더한 새 Date 를 반환 (음수 허용). */
function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 양의 정수 주기일로 파싱 (21~45 권장 범위). 무효하면 null. */
function parseCycle(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!/^\d+$/.test(trimmed)) return null;
  const cycle = Number(trimmed);
  // 생리학적으로 합리적인 범위로 제한 (배란 = 주기 − 14 가 음수가 되지 않도록).
  if (!Number.isFinite(cycle) || cycle < 21 || cycle > 45) return null;
  return cycle;
}

interface OvulationResult {
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
  nextPeriod: string;
}

export default function OvulationCalcPage() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');

  // 하이드레이션 안전: 초기 렌더는 빈 값(결정적). 마운트 후에만 오늘 날짜 주입.
  useEffect(() => {
    setLastPeriod(todayInputValue());
  }, []);

  const result = useMemo<OvulationResult | null>(() => {
    const lmp = parseDate(lastPeriod);
    if (lmp === null) return null;

    const cycle = parseCycle(cycleLength);
    if (cycle === null) return null;

    // 배란일 ≈ 다음 생리 − 14 = LMP + (주기 − 14).
    const ovulationDate = addDays(lmp, cycle - 14);
    // 가임기 = 배란 5일 전 ~ 배란 1일 후.
    const fertileStartDate = addDays(ovulationDate, -5);
    const fertileEndDate = addDays(ovulationDate, 1);
    const nextPeriodDate = addDays(lmp, cycle);

    return {
      ovulation: formatDate(ovulationDate),
      fertileStart: formatDate(fertileStartDate),
      fertileEnd: formatDate(fertileEndDate),
      nextPeriod: formatDate(nextPeriodDate),
    };
  }, [lastPeriod, cycleLength]);

  function handleReset() {
    setLastPeriod(todayInputValue());
    setCycleLength('28');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="배란일 계산기"
        widthClass="max-w-xl"
        onReset={handleReset}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          마지막 생리 시작일과 평균 주기로 배란 예정일·가임기·다음 생리 예정일을
          추정합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">마지막 생리 시작일</span>
            <input
              type="date"
              value={lastPeriod}
              onChange={(e) => setLastPeriod(e.target.value)}
              className={dateInputClass}
              aria-label="마지막 생리 시작일"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">평균 주기 (일)</span>
            <Input
              inputMode="numeric"
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              placeholder="예: 28"
              aria-label="평균 주기"
            />
          </label>
        </div>

        {!result && (
          <p role="alert" className="text-sm text-destructive">
            올바른 생리 시작일과 주기(21~45일)를 입력하세요.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarHeart className="h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-medium">배란 예정일</p>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {result.ovulation}
              </p>
            </div>
            <dl className="space-y-3 border-t pt-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">가임기</dt>
                <dd className="text-right font-medium tabular-nums">
                  {result.fertileStart}
                  <br className="sm:hidden" />
                  <span className="px-1">~</span>
                  {result.fertileEnd}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">다음 생리 예정일</dt>
                <dd className="text-right font-medium tabular-nums">
                  {result.nextPeriod}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          본 계산은 평균 주기를 가정한 추정치이며 개인차가 큽니다. 의학적 진단이
          아니므로 정확한 정보는 전문의와 상담하세요. 모든 계산은 브라우저에서
          즉시 처리됩니다.
        </p>
      </main>
    </div>
  );
}
