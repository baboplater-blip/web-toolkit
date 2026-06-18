'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface CronField {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const DEFAULT_FIELDS: CronField = {
  minute: '*',
  hour: '*',
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
};

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEKDAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** 단일 cron 필드를 사람이 읽을 수 있는 한국어 조각으로 설명한다. */
function describeField(value: string, unit: string, names?: string[]): string {
  const trimmed = value.trim();
  if (trimmed === '*' || trimmed === '') return `매 ${unit}`;
  const step = trimmed.match(/^\*\/(\d+)$/);
  if (step) return `${step[1]}${unit}마다`;
  const range = trimmed.match(/^(\d+)-(\d+)$/);
  if (range) return `${range[1]}~${range[2]} ${unit}`;
  const list = trimmed.split(',').map((part) => part.trim());
  const labeled = list.map((part) => {
    const num = Number(part);
    if (names && Number.isInteger(num) && names[num]) return names[num];
    return part;
  });
  return `${labeled.join(', ')} ${unit}`;
}

/** 다섯 필드에서 cron 표현식과 한국어 설명을 만든다. */
function buildCron(fields: CronField): { expression: string; description: string } {
  const expression = [
    fields.minute.trim() || '*',
    fields.hour.trim() || '*',
    fields.dayOfMonth.trim() || '*',
    fields.month.trim() || '*',
    fields.dayOfWeek.trim() || '*',
  ].join(' ');

  const parts = [
    describeField(fields.month, '월', MONTH_NAMES),
    describeField(fields.dayOfMonth, '일'),
    describeField(fields.dayOfWeek, '요일', WEEKDAY_NAMES),
    describeField(fields.hour, '시'),
    describeField(fields.minute, '분'),
  ];
  return { expression, description: parts.join(' · ') };
}

/** cron 필드 한 칸이 주어진 값과 매치되는지 검사한다(별표·스텝·범위·목록 지원). */
function matchField(value: string, current: number, min: number, max: number): boolean {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '*') return true;
  for (const part of trimmed.split(',')) {
    const token = part.trim();
    const step = token.match(/^\*\/(\d+)$/);
    if (step) {
      const n = Number(step[1]);
      if (n > 0 && (current - min) % n === 0) return true;
      continue;
    }
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      const lo = Number(range[1]);
      const hi = Number(range[2]);
      if (current >= lo && current <= hi) return true;
      continue;
    }
    if (Number(token) === current) return true;
  }
  void min;
  void max;
  return false;
}

/** 주어진 시각 이후 cron 식에 매치되는 다음 실행 시각들을 최대 count 개 찾는다. */
function nextRuns(fields: CronField, from: Date, count: number): Date[] {
  const runs: Date[] = [];
  // 분 단위로 1년치(약 525600분)까지 탐색하여 매치되는 시점을 모은다.
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const limit = 60 * 24 * 366;
  for (let i = 0; i < limit && runs.length < count; i++) {
    const minute = cursor.getMinutes();
    const hour = cursor.getHours();
    const dom = cursor.getDate();
    const month = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    const minuteOk = matchField(fields.minute, minute, 0, 59);
    const hourOk = matchField(fields.hour, hour, 0, 23);
    const monthOk = matchField(fields.month, month, 1, 12);

    // cron 규약: 일/요일 둘 다 제한되면 OR, 하나만 제한되면 그 조건만.
    const domRestricted = fields.dayOfMonth.trim() !== '*' && fields.dayOfMonth.trim() !== '';
    const dowRestricted = fields.dayOfWeek.trim() !== '*' && fields.dayOfWeek.trim() !== '';
    const domOk = matchField(fields.dayOfMonth, dom, 1, 31);
    const dowOk = matchField(fields.dayOfWeek, dow, 0, 6);
    let dayOk: boolean;
    if (domRestricted && dowRestricted) dayOk = domOk || dowOk;
    else if (domRestricted) dayOk = domOk;
    else if (dowRestricted) dayOk = dowOk;
    else dayOk = true;

    if (minuteOk && hourOk && monthOk && dayOk) {
      runs.push(new Date(cursor.getTime()));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}

function formatRun(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const week = WEEKDAY_NAMES[date.getDay()];
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} (${week}) ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CrontabBuilderPage() {
  const [fields, setFields] = useState<CronField>(DEFAULT_FIELDS);
  const [copied, setCopied] = useState(false);
  // 다음 실행 시각은 현재 시각 의존 → 마운트 후에만 채운다(하이드레이션 안전).
  const [previews, setPreviews] = useState<string[] | null>(null);

  const setField = <K extends keyof CronField>(key: K, value: CronField[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const { expression, description } = useMemo(() => buildCron(fields), [fields]);

  useEffect(() => {
    // 마운트 후 1회(및 필드 변경 시) 현재 시각 기준으로 계산. 하이드레이션 안전·의도된 패턴.
    const runs = nextRuns(fields, new Date(), 5);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviews(runs.map(formatRun));
  }, [fields]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(expression);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setFields(DEFAULT_FIELDS);
    setCopied(false);
  }

  const isDefault =
    fields.minute === '*' && fields.hour === '*' && fields.dayOfMonth === '*' &&
    fields.month === '*' && fields.dayOfWeek === '*';

  const inputs: { key: keyof CronField; label: string; hint: string }[] = [
    { key: 'minute', label: '분', hint: '0-59' },
    { key: 'hour', label: '시', hint: '0-23' },
    { key: 'dayOfMonth', label: '일', hint: '1-31' },
    { key: 'month', label: '월', hint: '1-12' },
    { key: 'dayOfWeek', label: '요일', hint: '0-6 (일=0)' },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Crontab 생성기" widthClass="max-w-2xl" onReset={isDefault ? undefined : reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          필드별로 cron 표현식을 만들고 다음 실행 시각을 미리봅니다.
        </p>

        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-5">
          {inputs.map((item) => (
            <label key={item.key} className="block space-y-1">
              <span className="text-sm font-medium">{item.label}</span>
              <input
                value={fields[item.key]}
                onChange={(e) => setField(item.key, e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-center font-mono text-sm"
                aria-label={item.label}
              />
              <span className="block text-center text-[0.65rem] text-muted-foreground">{item.hint}</span>
            </label>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <code className="flex-1 break-all font-mono text-lg font-semibold">{expression}</code>
            <Button variant="outline" size="sm" onClick={copy} aria-label="cron 표현식 복사">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium">다음 실행 시각</span>
          {previews === null ? (
            <p className="text-xs text-muted-foreground">계산 중…</p>
          ) : previews.length === 0 ? (
            <p className="text-xs text-muted-foreground">1년 이내에 매치되는 실행 시각이 없습니다. 필드를 확인하세요.</p>
          ) : (
            <ul className="space-y-1 font-mono text-sm tabular-nums">
              {previews.map((run, i) => (
                <li key={i}>{run}</li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
