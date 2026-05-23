'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface ParsedField {
  raw: string;
  values: number[];
  description: string;
}

interface ParseResult {
  fields: {
    minute: ParsedField;
    hour: ParsedField;
    dayOfMonth: ParsedField;
    month: ParsedField;
    dayOfWeek: ParsedField;
  };
  description: string;
  errors: string[];
}

const FIELDS = [
  { name: 'minute', label: '분', min: 0, max: 59 },
  { name: 'hour', label: '시', min: 0, max: 23 },
  { name: 'dayOfMonth', label: '일', min: 1, max: 31 },
  { name: 'month', label: '월', min: 1, max: 12 },
  { name: 'dayOfWeek', label: '요일', min: 0, max: 6 },
] as const;

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const DOW_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const MONTH_ALIAS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DOW_ALIAS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function parseField(
  spec: string,
  min: number,
  max: number,
  fieldName: string,
  alias?: Record<string, number>,
): ParsedField {
  const raw = spec.trim();
  const resolveName = (s: string): number | null => {
    const lower = s.toLowerCase();
    return alias?.[lower] ?? null;
  };

  if (raw === '*' || raw === '?') {
    return {
      raw,
      values: Array.from({ length: max - min + 1 }, (_, i) => min + i),
      description: '모든',
    };
  }

  const parts = raw.split(',');
  const set = new Set<number>();
  for (const part of parts) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    let base = part;
    let step = 1;
    if (stepMatch) {
      base = stepMatch[1];
      step = Number(stepMatch[2]);
    }

    let lo: number;
    let hi: number;
    if (base === '*') {
      lo = min;
      hi = max;
    } else if (base.includes('-')) {
      const [a, b] = base.split('-');
      const av = /^\d+$/.test(a) ? Number(a) : resolveName(a);
      const bv = /^\d+$/.test(b) ? Number(b) : resolveName(b);
      if (av === null || bv === null) throw new Error(`${fieldName}: '${base}' 해석 불가`);
      lo = av;
      hi = bv;
    } else {
      const v = /^\d+$/.test(base) ? Number(base) : resolveName(base);
      if (v === null) throw new Error(`${fieldName}: '${base}' 해석 불가`);
      lo = v;
      hi = v;
    }
    if (lo < min || hi > max || lo > hi) {
      throw new Error(`${fieldName}: 범위 [${min}-${max}] 벗어남 (${lo}-${hi})`);
    }
    for (let i = lo; i <= hi; i += step) set.add(i);
  }
  const values = [...set].sort((a, b) => a - b);
  return { raw, values, description: describeField(raw, values, min, max) };
}

function describeField(raw: string, values: number[], min: number, max: number): string {
  if (raw === '*' || raw === '?') return '매';
  if (values.length === max - min + 1) return '매';
  if (values.length === 1) return `${values[0]}에`;
  const stepMatch = raw.match(/\/(\d+)$/);
  if (stepMatch) return `${stepMatch[1]}마다`;
  if (values.length <= 3) return `${values.join(', ')}에`;
  return `${values.length}개 시점에`;
}

function parseCron(expression: string): ParseResult {
  const tokens = expression.trim().split(/\s+/);
  if (tokens.length !== 5) {
    return {
      fields: emptyFields(),
      description: '',
      errors: [`표현식은 5개 필드여야 합니다 (현재 ${tokens.length}개). 형식: 분 시 일 월 요일`],
    };
  }
  const errors: string[] = [];
  const parseOrError = (
    spec: string,
    min: number,
    max: number,
    name: string,
    alias?: Record<string, number>,
  ): ParsedField => {
    try {
      return parseField(spec, min, max, name, alias);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      return { raw: spec, values: [], description: '' };
    }
  };

  const fields = {
    minute: parseOrError(tokens[0], 0, 59, '분'),
    hour: parseOrError(tokens[1], 0, 23, '시'),
    dayOfMonth: parseOrError(tokens[2], 1, 31, '일'),
    month: parseOrError(tokens[3], 1, 12, '월', MONTH_ALIAS),
    dayOfWeek: parseOrError(tokens[4], 0, 6, '요일', DOW_ALIAS),
  };

  return {
    fields,
    description: humanize(fields),
    errors,
  };
}

function emptyFields(): ParseResult['fields'] {
  const e: ParsedField = { raw: '', values: [], description: '' };
  return { minute: e, hour: e, dayOfMonth: e, month: e, dayOfWeek: e };
}

function humanize(f: ParseResult['fields']): string {
  const parts: string[] = [];

  const allMonth = f.month.values.length === 12;
  const allDay = f.dayOfMonth.values.length === 31 && f.dayOfMonth.raw !== '?';
  const allDow = f.dayOfWeek.values.length === 7 && f.dayOfWeek.raw !== '?';

  if (!allMonth) parts.push(f.month.values.map((m) => MONTH_NAMES[m - 1]).join(', '));
  if (!allDay) parts.push(`${f.dayOfMonth.values.join(', ')}일`);
  if (!allDow) parts.push(f.dayOfWeek.values.map((d) => DOW_NAMES[d % 7] + '요일').join(', '));

  if (f.minute.values.length === 1 && f.hour.values.length === 1) {
    parts.push(`${String(f.hour.values[0]).padStart(2, '0')}:${String(f.minute.values[0]).padStart(2, '0')}`);
  } else if (f.minute.raw === '0' && f.hour.values.length > 0 && f.hour.values.length < 24) {
    parts.push(`${f.hour.values.join(', ')}시 정각`);
  } else if (f.hour.values.length === 24) {
    parts.push(`${f.minute.description} 분`);
  } else {
    parts.push(`${f.hour.description} 시 ${f.minute.description} 분`);
  }

  return parts.join(' · ');
}

/** 다음 N회 실행 시각 계산 (단순 grid traversal) */
function nextRuns(parsed: ParseResult, count: number, from: Date = new Date()): Date[] {
  const { fields, errors } = parsed;
  if (errors.length > 0) return [];
  const minutes = fields.minute.values;
  const hours = fields.hour.values;
  const days = fields.dayOfMonth.values;
  const months = fields.month.values;
  const dows = fields.dayOfWeek.values;
  if (
    minutes.length === 0 ||
    hours.length === 0 ||
    days.length === 0 ||
    months.length === 0 ||
    dows.length === 0
  ) {
    return [];
  }

  const results: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const maxIterations = 366 * 24 * 60;
  let iter = 0;
  while (results.length < count && iter < maxIterations) {
    iter++;
    const m = cursor.getMonth() + 1;
    const d = cursor.getDate();
    const dow = cursor.getDay();
    const h = cursor.getHours();
    const min = cursor.getMinutes();

    if (
      months.includes(m) &&
      days.includes(d) &&
      dows.includes(dow) &&
      hours.includes(h) &&
      minutes.includes(min)
    ) {
      results.push(new Date(cursor));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return results;
}

const PRESETS = [
  { expr: '* * * * *', label: '매분' },
  { expr: '*/5 * * * *', label: '5분마다' },
  { expr: '0 * * * *', label: '매 정시' },
  { expr: '0 9 * * *', label: '매일 오전 9시' },
  { expr: '0 0 * * 0', label: '매주 일요일 자정' },
  { expr: '0 0 1 * *', label: '매월 1일 자정' },
  { expr: '0 0 1 1 *', label: '매년 1월 1일' },
  { expr: '0 9-18 * * 1-5', label: '평일 업무시간 정각' },
];

export default function CronExplainerPage() {
  const [expression, setExpression] = useState('0 9 * * 1-5');

  const parsed = useMemo(() => parseCron(expression), [expression]);
  const upcoming = useMemo(() => nextRuns(parsed, 7), [parsed]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CalendarClock className="h-5 w-5" />
            <h1 className="font-semibold text-base">cron 표현식 해석기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <label className="text-[11px] font-medium text-muted-foreground">
            cron 표현식 (분 시 일 월 요일)
          </label>
          <Input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="0 9 * * 1-5"
            className="h-10 font-mono text-sm tracking-wider"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                type="button"
                onClick={() => setExpression(p.expr)}
                className="text-[10px] h-6 px-2 rounded-md border bg-background hover:bg-muted"
                title={p.expr}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {parsed.errors.length > 0 ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
            {parsed.errors.map((err, i) => (
              <div key={i} className="font-mono">• {err}</div>
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                해석
              </p>
              <p className="text-sm font-medium">{parsed.description}</p>
            </div>

            <div className="rounded-xl border bg-card p-3 space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                필드 분석
              </h2>
              <div className="grid grid-cols-5 gap-1.5">
                {FIELDS.map((f) => {
                  const field = parsed.fields[f.name];
                  return (
                    <div key={f.name} className="rounded-lg border p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">{f.label}</p>
                      <p className="text-xs font-mono font-semibold mt-0.5 truncate">
                        {field.raw || '-'}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {field.values.length}개
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {upcoming.length > 0 && (
              <div className="rounded-xl border bg-card p-3 space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  다음 실행 시각 (현지)
                </h2>
                <Separator />
                <ul className="space-y-1">
                  {upcoming.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs font-mono py-1 border-b last:border-0"
                    >
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{d.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          표준 5필드 cron · 별칭 지원(JAN-DEC · SUN-SAT) · 범위(a-b) · 스텝(*/n) · 다중(a,b,c)
        </p>
      </main>
    </div>
  );
}
