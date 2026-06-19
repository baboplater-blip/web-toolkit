'use client';

import { useEffect, useMemo, useState } from 'react';
import { Baby } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** 네겔레 법칙: 임신 기간 = 마지막 생리일 + 280일. */
const GESTATION_DAYS = 280;
/** 표준 주기(28일) 기준. 주기가 다르면 (주기 − 28)일만큼 보정. */
const STANDARD_CYCLE = 28;

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

/** 두 로컬 자정 Date 사이의 일수 차이 (정수). */
function dayDiff(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 로컬 자정으로 정규화된 오늘 Date (시·분 영향 제거). null = 마운트 전. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 양의 정수 주기일로 파싱. 빈 값은 표준(28). 무효하면 null. */
function parseCycle(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return STANDARD_CYCLE;
  if (!/^\d+$/.test(trimmed)) return null;
  const cycle = Number(trimmed);
  if (!Number.isFinite(cycle) || cycle < 21 || cycle > 45) return null;
  return cycle;
}

interface DueDateResult {
  dueDate: string;
  /** 마운트 후에만 계산되는 현재 임신 주수 (today 의존). */
  gestation: { weeks: number; days: number } | null;
}

export default function PregnancyDueDatePage() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('');
  // 하이드레이션 안전: today 는 마운트 후에만 채워진다(초기 렌더는 결정적).
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setLastPeriod(todayInputValue());
    setToday(startOfDay(new Date()));
  }, []);

  const result = useMemo<DueDateResult | null>(() => {
    const lmp = parseDate(lastPeriod);
    if (lmp === null) return null;

    const cycle = parseCycle(cycleLength);
    if (cycle === null) return null;

    // 주기 보정: 표준(28일)과의 차이만큼 예정일을 가감.
    const cycleAdjustment = cycle - STANDARD_CYCLE;
    const dueDateObj = addDays(lmp, GESTATION_DAYS + cycleAdjustment);

    let gestation: DueDateResult['gestation'] = null;
    if (today !== null) {
      const elapsed = dayDiff(lmp, today);
      // 마지막 생리일이 미래이거나 동일하면 주수는 표시하지 않는다.
      if (elapsed > 0) {
        gestation = {
          weeks: Math.floor(elapsed / 7),
          days: elapsed % 7,
        };
      }
    }

    return { dueDate: formatDate(dueDateObj), gestation };
  }, [lastPeriod, cycleLength, today]);

  function handleReset() {
    setLastPeriod(todayInputValue());
    setCycleLength('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="출산 예정일 계산기"
        widthClass="max-w-xl"
        onReset={handleReset}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          마지막 생리 시작일로 출산 예정일(네겔레 법칙)과 현재 임신 주수를
          계산합니다.
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
            <span className="text-sm font-medium">평균 주기 (선택, 기본 28일)</span>
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
                <Baby className="h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-medium">출산 예정일</p>
              </div>
              <p className="text-xl font-bold tabular-nums">{result.dueDate}</p>
            </div>
            {result.gestation && (
              <dl className="border-t pt-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">현재 임신 주수</dt>
                  <dd className="font-medium tabular-nums">
                    {result.gestation.weeks}주 {result.gestation.days}일
                  </dd>
                </div>
              </dl>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          출산 예정일은 마지막 생리일 + 280일(네겔레 법칙) 기준 추정치이며 실제
          출산일과 다를 수 있습니다. 의학적 진단이 아니므로 정확한 정보는
          전문의와 상담하세요. 모든 계산은 브라우저에서 즉시 처리됩니다.
        </p>
      </main>
    </div>
  );
}
