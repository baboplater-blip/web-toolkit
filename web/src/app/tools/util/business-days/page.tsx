'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

const dateInputClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" 를 로컬 자정 Date 로 파싱. 무효한 날짜는 null. */
function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  const date = new Date(y, mo - 1, d);
  // 윤년·월별 일수 검증(예: 2026-02-30 거르기).
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "YYYY-MM-DD" 형식의 유효한 휴일 날짜 집합을 텍스트에서 추출. */
function parseHolidays(text: string): Set<string> {
  const set = new Set<string>();
  for (const token of text.split(/[\s,]+/)) {
    const trimmed = token.trim();
    if (trimmed && parseDate(trimmed) !== null) {
      set.add(trimmed);
    }
  }
  return set;
}

interface DayCountResult {
  totalDays: number;
  businessDays: number;
}

/**
 * 시작일~종료일(양 끝 포함) 사이의 영업일(월~금, 휴일 제외)을 센다.
 * 시작일이 종료일보다 늦으면 자동으로 두 날짜를 교환한다.
 */
function countBusinessDays(
  start: Date,
  end: Date,
  holidays: Set<string>,
): DayCountResult {
  let from = start;
  let to = end;
  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }

  const totalDays =
    Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;

  const pad = (n: number) => String(n).padStart(2, '0');
  let businessDays = 0;
  const cursor = new Date(from.getTime());
  while (cursor.getTime() <= to.getTime()) {
    const weekday = cursor.getDay(); // 0=일, 6=토
    const isWeekend = weekday === 0 || weekday === 6;
    const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(
      cursor.getDate(),
    )}`;
    if (!isWeekend && !holidays.has(key)) {
      businessDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { totalDays, businessDays };
}

export default function BusinessDaysPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidaysText, setHolidaysText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 하이드레이션 안전: 초기 렌더는 빈 값(결정적). 마운트 후에만 오늘 날짜 주입.
  useEffect(() => {
    const today = todayInputValue();
    setStartDate(today);
    setEndDate(today);
  }, []);

  const result = useMemo<DayCountResult | null>(() => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start === null || end === null) return null;

    const holidays = parseHolidays(holidaysText);
    return countBusinessDays(start, end, holidays);
  }, [startDate, endDate, holidaysText]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        `영업일 ${result.businessDays}일 (총 ${result.totalDays}일)`,
      );
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
    const today = todayInputValue();
    setStartDate(today);
    setEndDate(today);
    setHolidaysText('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="영업일 계산기"
        widthClass="max-w-xl"
        onReset={handleReset}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          두 날짜 사이의 영업일(월~금)을 셉니다. 시작일과 종료일을 모두 포함하며,
          제외할 휴일을 직접 추가할 수 있습니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">시작일</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputClass}
                aria-label="시작일"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">종료일</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={dateInputClass}
                aria-label="종료일"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">
              제외할 휴일 (선택)
            </span>
            <textarea
              value={holidaysText}
              onChange={(e) => setHolidaysText(e.target.value)}
              placeholder={'YYYY-MM-DD 형식으로 입력 (줄바꿈·쉼표·공백 구분)\n예: 2026-01-01, 2026-03-01'}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="제외할 휴일"
            />
          </label>
        </div>

        {result && (
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                영업일 (시작·종료일 포함)
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {result.businessDays.toLocaleString()}
                <span className="ml-1 text-lg font-medium">일</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                전체 기간 {result.totalDays.toLocaleString()}일
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
        )}

        <p className="text-xs text-muted-foreground">
          주말(토·일)과 입력한 휴일을 제외하고 셉니다. 시작일이 종료일보다 늦으면
          자동으로 두 날짜를 바꿔 계산합니다.
        </p>
      </main>
    </div>
  );
}
