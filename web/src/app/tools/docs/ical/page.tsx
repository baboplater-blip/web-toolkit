'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerDownload } from '@/lib/tools/file-utils';

const CRLF = '\r\n';

interface EventForm {
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  allDay: boolean;
}

const INITIAL_FORM: EventForm = {
  title: '',
  start: '',
  end: '',
  location: '',
  description: '',
  allDay: false,
};

interface BuildResult {
  ics: string;
  error: string | null;
}

/**
 * iCal TEXT 값 이스케이프 (RFC 5545 §3.3.11).
 * 백슬래시·세미콜론·콤마·줄바꿈을 이스케이프한다.
 */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/** 두 자리 0 패딩 */
function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Date → UTC 기준 DTSTAMP/UTC 형식 (YYYYMMDDTHHMMSSZ) */
function toUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

/**
 * `datetime-local` 값(예: "2026-06-07T14:30")을 로컬 시각 형식(YYYYMMDDTHHMMSS)으로 변환.
 * 로컬 타임존 그대로 floating time 으로 기록한다.
 */
function toLocalDateTime(value: string): string {
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  return `${year}${month}${day}T${hour}${minute}00`;
}

/** `datetime-local` 또는 날짜의 날짜 부분만 DATE 형식(YYYYMMDD)으로 변환. */
function toDateValue(value: string): string {
  const datePart = value.split('T')[0];
  return datePart.replace(/-/g, '');
}

/** YYYYMMDD 문자열에 하루를 더한다 (종일 DTEND 는 배타적이므로). */
function addOneDay(dateValue: string): string {
  const year = Number(dateValue.slice(0, 4));
  const month = Number(dateValue.slice(4, 6));
  const day = Number(dateValue.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}`;
}

/**
 * 75 옥텟 초과 라인을 RFC 5545 §3.1 에 따라 접는다(line folding).
 * 단순화를 위해 문자 길이 기준 75 로 자르고 이어지는 줄 앞에 공백을 붙인다.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return chunks.join(CRLF);
}

/** 안정적인 UID 생성 (도메인 suffix 포함) */
function generateUid(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${random}@web-toolkit`;
}

function buildIcs(form: EventForm): BuildResult {
  if (!form.title.trim()) {
    return { ics: '', error: '제목을 입력해 주세요.' };
  }
  if (!form.start) {
    return { ics: '', error: '시작 시간을 입력해 주세요.' };
  }

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//web-toolkit//iCal Generator//KO');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${generateUid()}`);
  lines.push(`DTSTAMP:${toUtcStamp(new Date())}`);

  if (form.allDay) {
    const startDate = toDateValue(form.start);
    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    // 종일 일정의 DTEND 는 배타적: 종료 입력이 있으면 그 다음 날, 없으면 시작+1일
    const endSource = form.end ? toDateValue(form.end) : startDate;
    if (form.end && endSource < startDate) {
      return { ics: '', error: '종료 날짜가 시작 날짜보다 앞설 수 없습니다.' };
    }
    lines.push(`DTEND;VALUE=DATE:${addOneDay(endSource)}`);
  } else {
    const startLocal = toLocalDateTime(form.start);
    lines.push(`DTSTART:${startLocal}`);
    if (form.end) {
      const endLocal = toLocalDateTime(form.end);
      if (endLocal < startLocal) {
        return { ics: '', error: '종료 시간이 시작 시간보다 앞설 수 없습니다.' };
      }
      lines.push(`DTEND:${endLocal}`);
    }
  }

  lines.push(`SUMMARY:${escapeIcsText(form.title.trim())}`);
  if (form.location.trim()) {
    lines.push(`LOCATION:${escapeIcsText(form.location.trim())}`);
  }
  if (form.description.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(form.description.trim())}`);
  }
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  const ics = lines.map(foldLine).join(CRLF) + CRLF;
  return { ics, error: null };
}

export default function IcalGenPage() {
  const [form, setForm] = useState<EventForm>(INITIAL_FORM);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => buildIcs(form), [form]);

  function update<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function copy() {
    if (!result.ics) return;
    navigator.clipboard?.writeText(result.ics);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!result.ics) return;
    const blob = new Blob([result.ics], { type: 'text/calendar;charset=utf-8' });
    const slug = form.title.trim().replace(/[^\w가-힣-]+/g, '_').slice(0, 40) || 'event';
    triggerDownload(blob, `${slug}.ics`);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="iCal 일정 생성기" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          제목·시간·장소를 입력해 캘린더에 추가할 .ics 파일을 만듭니다.
        </p>

      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <label htmlFor="ical-title" className="text-xs font-medium">
              제목 *
            </label>
            <Input
              id="ical-title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="회의, 약속 등"
            />
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update('allDay', e.target.checked)}
            />
            종일 일정
          </label>

          <div className="space-y-1">
            <label htmlFor="ical-start" className="text-xs font-medium">
              시작 *
            </label>
            <Input
              id="ical-start"
              type={form.allDay ? 'date' : 'datetime-local'}
              value={form.allDay ? form.start.split('T')[0] : form.start}
              onChange={(e) => update('start', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ical-end" className="text-xs font-medium">
              종료
            </label>
            <Input
              id="ical-end"
              type={form.allDay ? 'date' : 'datetime-local'}
              value={form.allDay ? form.end.split('T')[0] : form.end}
              onChange={(e) => update('end', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ical-location" className="text-xs font-medium">
              장소
            </label>
            <Input
              id="ical-location"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="서울 강남구 …"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ical-description" className="text-xs font-medium">
              설명
            </label>
            <textarea
              id="ical-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm resize-y"
              placeholder="메모, 안건 등"
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <span className="text-xs font-medium">미리보기 (.ics)</span>
          <textarea
            value={result.ics}
            readOnly
            rows={14}
            className="w-full rounded-lg border bg-muted/40 px-2.5 py-2 font-mono text-xs resize-y"
            aria-label="ICS 미리보기"
            spellCheck={false}
          />
        </div>
      </div>

      {result.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {result.error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!result.ics}>
          {copied ? (
            <>
              <Check className="mr-1 h-4 w-4" /> 복사됨
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" /> 복사
            </>
          )}
        </Button>
        <Button variant="outline" onClick={download} disabled={!result.ics}>
          <Download className="mr-1 h-4 w-4" /> .ics 다운로드
        </Button>
      </div>
    </main>
    </div>
  );
}
