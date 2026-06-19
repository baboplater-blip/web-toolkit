'use client';

import { useEffect, useMemo, useState } from 'react';
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

interface IsoWeekResult {
  /** ISO-8601 주차 번호 (1~53). */
  week: number;
  /** ISO 주-연도 (연초·연말에 달력 연도와 다를 수 있음). */
  weekYear: number;
  /** 해당 날짜의 연중 일수 (1~366). */
  dayOfYear: number;
  /** 그 주 월요일의 UTC ms. */
  mondayMs: number;
  /** 그 주 일요일의 UTC ms. */
  sundayMs: number;
}

/**
 * ISO-8601 주차를 계산한다.
 * - 주는 월요일에 시작한다.
 * - 1주차는 그 해의 첫 목요일을 포함하는 주다.
 * 표준 알고리즘: 대상 날짜를 그 주의 목요일로 옮긴 뒤, 해당 목요일이 속한 연도의
 * 1월 1일부터 며칠째인지로 주차를 산출한다.
 */
function computeIsoWeek(utcMillis: number): IsoWeekResult {
  const date = new Date(utcMillis);
  // getUTCDay(): 일=0…토=6 → ISO 요일 월=1…일=7 로 변환.
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();

  // 같은 주의 목요일로 이동 (주차를 결정하는 기준일).
  const thursday = new Date(utcMillis);
  thursday.setUTCDate(thursday.getUTCDate() + (4 - isoDay));
  const weekYear = thursday.getUTCFullYear();

  // 그 주-연도의 1월 1일과 목요일 사이의 주 수로 주차 산출.
  const yearStart = Date.UTC(weekYear, 0, 1);
  const week =
    Math.floor((thursday.getTime() - yearStart) / MS_PER_DAY / 7) + 1;

  // 연중 일수 (달력 연도 기준).
  const calendarYearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((utcMillis - calendarYearStart) / MS_PER_DAY) + 1;

  // 그 주의 월요일·일요일.
  const mondayMs = utcMillis - (isoDay - 1) * MS_PER_DAY;
  const sundayMs = mondayMs + 6 * MS_PER_DAY;

  return { week, weekYear, dayOfYear, mondayMs, sundayMs };
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function WeekNumberPage() {
  // 하이드레이션 안전: 초기 렌더는 항상 빈 값(결정적). 마운트 후 오늘 날짜 주입.
  const [date, setDate] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    setDate(todayInputValue());
    // 마운트 직후 1회만 오늘 날짜를 채운다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const dateInputClass =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

  const result = useMemo<IsoWeekResult | null>(() => {
    const utcMillis = parseDate(date);
    if (utcMillis === null) return null;
    return computeIsoWeek(utcMillis);
  }, [date]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        `${result.weekYear}-W${String(result.week).padStart(2, '0')}`,
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
    setDate(todayInputValue());
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="주차(Week Number) 계산기"
        widthClass="max-w-xl"
        onReset={date ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          날짜의 ISO-8601 주차 번호를 계산합니다. 주는 월요일에 시작하고, 1주차는
          그 해의 첫 목요일이 포함된 주입니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={dateInputClass}
              aria-label="날짜"
            />
          </label>
        </div>

        {!result && (
          <p role="alert" className="text-sm text-destructive">
            올바른 날짜를 선택하세요.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">ISO 주차</p>
                <p className="text-3xl font-bold tabular-nums">
                  {result.weekYear}-W{String(result.week).padStart(2, '0')}
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
                <dt className="text-xs text-muted-foreground">주차 번호</dt>
                <dd className="font-medium tabular-nums">{result.week}주차</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">ISO 주-연도</dt>
                <dd className="font-medium tabular-nums">{result.weekYear}년</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">연중 일수</dt>
                <dd className="font-medium tabular-nums">
                  {result.dayOfYear}일째
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">주 기간 (월~일)</dt>
                <dd className="font-medium tabular-nums">
                  {formatDate(result.mondayMs)} ~ {formatDate(result.sundayMs)}
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
