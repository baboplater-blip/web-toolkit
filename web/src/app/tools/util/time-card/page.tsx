'use client';

import { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface DayRow {
  /** 요일 라벨 (월~일) */
  label: string;
  /** 출근 시각 "HH:MM" */
  clockIn: string;
  /** 퇴근 시각 "HH:MM" */
  clockOut: string;
  /** 휴게 시간(분) 입력 문자열 */
  breakMinutes: string;
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

const timeInputClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

function makeInitialRows(): DayRow[] {
  return DAY_LABELS.map((label) => ({
    label,
    clockIn: '',
    clockOut: '',
    breakMinutes: '',
  }));
}

/** "HH:MM" 을 자정 기준 분(minute)으로 변환. 무효하면 null. */
function parseTimeToMinutes(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 0 이상 정수 분으로 파싱. 빈 값은 0, 무효하면 null. */
function parseBreakMinutes(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return 0;
  if (!/^\d+$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return Number.isFinite(minutes) ? minutes : null;
}

/** 양수 시급으로 파싱. 빈 값·무효하면 null. */
function parseRate(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const rate = Number(trimmed);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

/** 한 행의 근무 분을 계산. 야간(퇴근<출근)은 +24h 처리. null = 미입력/무효. */
function computeRowMinutes(row: DayRow): number | null {
  const inMin = parseTimeToMinutes(row.clockIn);
  const outMin = parseTimeToMinutes(row.clockOut);
  if (inMin === null || outMin === null) return null;

  const breakMin = parseBreakMinutes(row.breakMinutes);
  if (breakMin === null) return null;

  // 퇴근이 출근보다 빠르면 자정을 넘긴 야간 근무로 보고 24시간을 더한다.
  const span = outMin >= inMin ? outMin - inMin : outMin + 24 * 60 - inMin;
  const worked = span - breakMin;
  return worked > 0 ? worked : 0;
}

/** 분을 "H시간 M분" 으로 포맷. */
function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}시간 ${minutes}분`;
}

/** 분을 소수 시간(소수점 2자리, 불필요한 0 제거)으로 포맷. */
function formatDecimalHours(totalMinutes: number): string {
  return (totalMinutes / 60).toFixed(2).replace(/\.?0+$/, '');
}

export default function TimeCardCalcPage() {
  const [rows, setRows] = useState<DayRow[]>(makeInitialRows);
  const [hourlyRate, setHourlyRate] = useState('');

  function updateRow(index: number, patch: Partial<DayRow>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  const rowMinutes = useMemo(
    () => rows.map((row) => computeRowMinutes(row)),
    [rows],
  );

  const totalMinutes = useMemo(
    () => rowMinutes.reduce<number>((sum, minutes) => sum + (minutes ?? 0), 0),
    [rowMinutes],
  );

  const rate = parseRate(hourlyRate);
  const totalPay = rate !== null ? (totalMinutes / 60) * rate : null;

  function handleReset() {
    setRows(makeInitialRows());
    setHourlyRate('');
  }

  const hasInput =
    rows.some((row) => row.clockIn || row.clockOut || row.breakMinutes) ||
    hourlyRate !== '';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="근무시간 계산기"
        widthClass="max-w-2xl"
        onReset={hasInput ? handleReset : undefined}
      />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          요일별 출퇴근 시각과 휴게 시간으로 주간 근무시간을 합산합니다. 퇴근이
          출근보다 빠르면 야간 근무로 보고 자동으로 다음날까지 계산합니다.
        </p>

        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-2 py-2 text-left font-medium">요일</th>
                <th className="px-2 py-2 text-left font-medium">출근</th>
                <th className="px-2 py-2 text-left font-medium">퇴근</th>
                <th className="px-2 py-2 text-left font-medium">휴게(분)</th>
                <th className="px-2 py-2 text-right font-medium">근무</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const minutes = rowMinutes[index];
                return (
                  <tr key={row.label} className="border-b last:border-b-0">
                    <td className="px-2 py-2 font-medium">{row.label}</td>
                    <td className="px-2 py-2">
                      <input
                        type="time"
                        value={row.clockIn}
                        onChange={(e) =>
                          updateRow(index, { clockIn: e.target.value })
                        }
                        className={timeInputClass}
                        aria-label={`${row.label}요일 출근 시각`}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="time"
                        value={row.clockOut}
                        onChange={(e) =>
                          updateRow(index, { clockOut: e.target.value })
                        }
                        className={timeInputClass}
                        aria-label={`${row.label}요일 퇴근 시각`}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        inputMode="numeric"
                        value={row.breakMinutes}
                        onChange={(e) =>
                          updateRow(index, { breakMinutes: e.target.value })
                        }
                        placeholder="0"
                        className="h-8"
                        aria-label={`${row.label}요일 휴게 시간(분)`}
                      />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {minutes === null ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <span className="font-medium">
                          {formatHoursMinutes(minutes)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({formatDecimalHours(minutes)}h)
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">시급 (선택)</span>
            <Input
              inputMode="decimal"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="예: 10030"
              aria-label="시급"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" aria-hidden />
              <p className="text-sm font-medium">주간 합계</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatHoursMinutes(totalMinutes)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">소수 시간</dt>
              <dd className="font-medium tabular-nums">
                {formatDecimalHours(totalMinutes)} 시간
              </dd>
            </div>
            {totalPay !== null && (
              <div>
                <dt className="text-xs text-muted-foreground">예상 급여</dt>
                <dd className="font-medium tabular-nums">
                  {Math.round(totalPay).toLocaleString()} 원
                </dd>
              </div>
            )}
          </dl>
        </div>

        <p className="text-xs text-muted-foreground">
          근무시간 = (퇴근 − 출근) − 휴게. 휴게가 근무시간보다 길면 0으로
          처리됩니다. 모든 계산은 브라우저에서 즉시 처리됩니다.
        </p>
      </main>
    </div>
  );
}
