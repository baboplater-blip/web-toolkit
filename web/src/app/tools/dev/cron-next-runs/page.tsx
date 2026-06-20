'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** cron 필드 범위(분·시·일·월·요일). */
const FIELD_RANGES: ReadonlyArray<{ min: number; max: number }> = [
  { min: 0, max: 59 }, // 분
  { min: 0, max: 23 }, // 시
  { min: 1, max: 31 }, // 일(day of month)
  { min: 1, max: 12 }, // 월
  { min: 0, max: 6 }, // 요일(day of week, 0=일)
];

const FIELD_LABELS = ['분', '시', '일', '월', '요일'] as const;
const MAX_RUNS = 50;

interface ParsedCron {
  /** 각 필드별 허용 값 집합. */
  minute: Set<number>;
  hour: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
  /** 일(dom)·요일(dow) 둘 다 제한적이면 OR 결합. */
  domRestricted: boolean;
  dowRestricted: boolean;
}

/**
 * 단일 cron 필드를 허용 값 집합으로 파싱한다.
 * 지원: `*`, `* /n`, `a-b`, `a-b/n`, `a,b,c`, 그리고 이들의 조합(콤마 구분).
 * @throws 형식이 올바르지 않으면 Error.
 */
function parseField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();

  for (const part of field.split(',')) {
    const token = part.trim();
    if (token === '') throw new Error('빈 항목이 있습니다.');

    let rangePart = token;
    let step = 1;

    const slashIndex = token.indexOf('/');
    if (slashIndex !== -1) {
      rangePart = token.slice(0, slashIndex);
      const stepText = token.slice(slashIndex + 1);
      step = Number(stepText);
      if (!Number.isInteger(step) || step <= 0) {
        throw new Error(`스텝 값이 올바르지 않습니다: ${token}`);
      }
    }

    let start = min;
    let end = max;

    if (rangePart === '*') {
      // 전체 범위.
    } else if (rangePart.includes('-')) {
      const [startText, endText] = rangePart.split('-');
      start = Number(startText);
      end = Number(endText);
      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new Error(`범위가 올바르지 않습니다: ${token}`);
      }
    } else {
      const single = Number(rangePart);
      if (!Number.isInteger(single)) {
        throw new Error(`숫자가 올바르지 않습니다: ${token}`);
      }
      start = single;
      end = single;
    }

    if (start < min || end > max || start > end) {
      throw new Error(`값이 허용 범위(${min}-${max})를 벗어났습니다: ${token}`);
    }

    for (let value = start; value <= end; value += step) {
      values.add(value);
    }
  }

  return values;
}

/**
 * 표준 5필드 cron 표현식을 파싱한다.
 * 요일은 0·7 모두 일요일로 취급하고, `*` 이외로 지정된 필드만 "제한적"으로 표시한다.
 * @returns 파싱 결과 또는 에러 메시지.
 */
function parseCron(expression: string): { parsed: ParsedCron | null; error: string | null } {
  const trimmed = expression.trim();
  if (!trimmed) return { parsed: null, error: null };

  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    return { parsed: null, error: '크론식은 5개 필드(분 시 일 월 요일)여야 합니다.' };
  }

  try {
    const minute = parseField(fields[0], FIELD_RANGES[0].min, FIELD_RANGES[0].max);
    const hour = parseField(fields[1], FIELD_RANGES[1].min, FIELD_RANGES[1].max);
    const dom = parseField(fields[2], FIELD_RANGES[2].min, FIELD_RANGES[2].max);
    const month = parseField(fields[3], FIELD_RANGES[3].min, FIELD_RANGES[3].max);

    // 요일은 0-7 범위로 파싱한 뒤 7 → 0 으로 정규화(둘 다 일요일).
    const rawDow = parseField(fields[4], 0, 7);
    const dow = new Set<number>();
    for (const value of rawDow) dow.add(value === 7 ? 0 : value);

    return {
      parsed: {
        minute,
        hour,
        dom,
        month,
        dow,
        domRestricted: fields[2].trim() !== '*',
        dowRestricted: fields[4].trim() !== '*',
      },
      error: null,
    };
  } catch (err) {
    return { parsed: null, error: err instanceof Error ? err.message : '크론식을 해석할 수 없습니다.' };
  }
}

/**
 * 주어진 날짜가 cron 일정과 일치하는지 검사한다.
 * dom·dow 가 모두 제한적이면 표준 cron 의미대로 OR 결합한다.
 */
function matches(date: Date, parsed: ParsedCron): boolean {
  if (!parsed.minute.has(date.getMinutes())) return false;
  if (!parsed.hour.has(date.getHours())) return false;
  if (!parsed.month.has(date.getMonth() + 1)) return false;

  const domMatch = parsed.dom.has(date.getDate());
  const dowMatch = parsed.dow.has(date.getDay());

  if (parsed.domRestricted && parsed.dowRestricted) return domMatch || dowMatch;
  if (parsed.domRestricted) return domMatch;
  if (parsed.dowRestricted) return dowMatch;
  return true;
}

/**
 * from 시각 이후의 다음 실행 시각들을 분 단위로 탐색해 count 개 반환한다.
 * 탐색 상한(4년)을 두어 매칭이 없는 경우 무한 루프를 방지한다.
 */
function nextRuns(from: Date, parsed: ParsedCron, count: number): Date[] {
  const runs: Date[] = [];
  const cursor = new Date(from.getTime());
  // 다음 분 경계부터 탐색(현재 분은 이미 지났다고 간주).
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  // 4년 = 약 2,103,840 분. 분 단위 안전 상한.
  const maxIterations = 366 * 4 * 24 * 60;
  for (let i = 0; i < maxIterations && runs.length < count; i += 1) {
    if (matches(cursor, parsed)) runs.push(new Date(cursor.getTime()));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

function formatRun(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const weekday = WEEKDAY_NAMES[date.getDay()];
  return `${yyyy}-${mm}-${dd} (${weekday}) ${hh}:${min}`;
}

export default function CronNextRunsPage() {
  const [expression, setExpression] = useState('0 9 * * 1-5');
  const [count, setCount] = useState(5);
  const [copied, setCopied] = useState(false);
  // 현재 시각은 하이드레이션 안전을 위해 마운트 후 주입한다.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  const { parsed, error } = useMemo(() => parseCron(expression), [expression]);

  const runs = useMemo(() => {
    if (!parsed || !now) return [];
    const safeCount = Math.min(Math.max(count, 1), MAX_RUNS);
    return nextRuns(now, parsed, safeCount);
  }, [parsed, now, count]);

  const copy = async () => {
    if (runs.length === 0) return;
    try {
      await navigator.clipboard.writeText(runs.map(formatRun).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setExpression('0 9 * * 1-5');
    setCount(5);
    setCopied(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="크론 다음 실행 목록" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          크론식(분 시 일 월 요일)을 입력하면 현재 시각 이후 다음 실행 일시들을 계산합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">크론 표현식</span>
          <Input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="예: 0 9 * * 1-5"
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            aria-label="크론 표현식"
          />
          <span className="text-xs text-muted-foreground">
            지원: <code>*</code> <code>*/n</code> <code>a-b</code> <code>a,b,c</code> · 요일 0·7=일요일 · 일+요일은 OR 결합
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">표시 개수 (1~{MAX_RUNS})</span>
          <Input
            type="number"
            min={1}
            max={MAX_RUNS}
            value={count}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (Number.isFinite(value)) setCount(Math.min(Math.max(Math.trunc(value), 1), MAX_RUNS));
            }}
            className="w-32"
            aria-label="표시 개수"
          />
        </label>

        {parsed && (
          <details className="rounded-xl border bg-card p-4 text-sm">
            <summary className="cursor-pointer font-medium">필드 해석</summary>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  [FIELD_LABELS[0], parsed.minute],
                  [FIELD_LABELS[1], parsed.hour],
                  [FIELD_LABELS[2], parsed.dom],
                  [FIELD_LABELS[3], parsed.month],
                  [FIELD_LABELS[4], parsed.dow],
                ] as const
              ).map(([label, set]) => (
                <div key={label} className="rounded-lg border bg-background px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-mono break-all">{[...set].sort((a, b) => a - b).join(', ')}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {parsed && now && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">다음 실행 ({runs.length}회)</span>
              <Button size="sm" variant="outline" onClick={copy} disabled={runs.length === 0}>
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
            {runs.length > 0 ? (
              <ol className="space-y-1 font-mono text-sm">
                {runs.map((run, index) => (
                  <li key={run.getTime()} className="flex gap-3 rounded-lg border bg-background px-3 py-2">
                    <span className="w-6 shrink-0 text-right text-muted-foreground">{index + 1}.</span>
                    <span className="break-all">{formatRun(run)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">향후 4년 내 일치하는 실행 시각이 없습니다.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
