'use client';

import { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Intl.supportedValuesOf 미지원 브라우저용 폴백 — 주요 도시 시간대. */
const FALLBACK_ZONES = [
  'UTC',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

/** 지원되는 시간대 목록을 안전하게 얻는다 (미지원 시 폴백). */
function getTimeZones(): string[] {
  try {
    const supported = (
      Intl as typeof Intl & {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf;
    if (typeof supported === 'function') {
      const zones = supported('timeZone');
      if (Array.isArray(zones) && zones.length > 0) {
        return zones;
      }
    }
  } catch {
    // 일부 환경은 supportedValuesOf 호출 시 던질 수 있음 — 폴백 사용
  }
  return FALLBACK_ZONES;
}

/** 사용자의 현재 시간대를 안전하게 얻는다. */
function getLocalZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch {
    // 무시하고 폴백
  }
  return 'UTC';
}

/**
 * 주어진 UTC 시각(ms)에서 특정 시간대의 UTC offset(분)을 구한다.
 * 양수 = UTC보다 앞섬(동쪽).
 */
function zoneOffsetMinutes(utcMillis: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(utcMillis));
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = Number(part.value);
    }
  }
  // hour 24 는 자정을 의미 — 0 으로 정규화
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUtc = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    hour,
    map.minute,
    map.second,
  );
  return Math.round((asUtc - utcMillis) / 60000);
}

/** offset(분)을 "+09:00" 형태로 포맷. */
function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

/** "2026-06-07T13:30" 같은 datetime-local 값을, 해당 시간대의 벽시계로 해석해 UTC ms 로 변환. */
function wallTimeToUtc(localValue: string, timeZone: string): number | null {
  const match = localValue.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  // 먼저 입력을 UTC로 가정한 뒤, 해당 시간대 offset 으로 보정.
  const guessUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset = zoneOffsetMinutes(guessUtc, timeZone);
  const candidate = guessUtc - offset * 60000;
  // DST 경계 보정: 후보 시점의 offset 으로 한 번 더 검증.
  const offset2 = zoneOffsetMinutes(candidate, timeZone);
  if (offset2 !== offset) {
    return guessUtc - offset2 * 60000;
  }
  return candidate;
}

/** UTC ms 를 특정 시간대의 "YYYY-MM-DD HH:mm" 문자열로 포맷. */
function formatInZone(utcMillis: number, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // sv-SE 로케일은 "YYYY-MM-DD HH:mm" 형태를 보장.
  return dtf.format(new Date(utcMillis)).replace(',', '');
}

/** 현재 시각을 "datetime-local" 입력 기본값으로 (분 단위). */
function nowLocalInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function TimezonePage() {
  const zones = useMemo(() => getTimeZones(), []);
  const [fromZone, setFromZone] = useState<string>(getLocalZone);
  const [toZone, setToZone] = useState<string>('UTC');
  const [dateTime, setDateTime] = useState<string>(nowLocalInputValue);

  const result = useMemo(() => {
    if (!dateTime) return null;
    if (!zones.includes(fromZone) || !zones.includes(toZone)) return null;
    const utcMillis = wallTimeToUtc(dateTime, fromZone);
    if (utcMillis === null || !Number.isFinite(utcMillis)) return null;

    const fromOffset = zoneOffsetMinutes(utcMillis, fromZone);
    const toOffset = zoneOffsetMinutes(utcMillis, toZone);
    return {
      converted: formatInZone(utcMillis, toZone),
      fromOffset,
      toOffset,
      diffMinutes: toOffset - fromOffset,
    };
  }, [dateTime, fromZone, toZone, zones]);

  function copyResult() {
    if (result) {
      navigator.clipboard?.writeText(result.converted);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Globe className="h-5 w-5 text-primary" aria-hidden />
          시간대 변환기
        </h1>
        <p className="text-sm text-muted-foreground">
          도시·시간대 간 시각을 변환하고 시차를 보여줍니다.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">변환할 시각</span>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            aria-label="변환할 시각"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">출발 시간대</span>
            <select
              value={fromZone}
              onChange={(e) => setFromZone(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="출발 시간대"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">도착 시간대</span>
            <select
              value={toZone}
              onChange={(e) => setToZone(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="도착 시간대"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setFromZone(toZone);
            setToZone(fromZone);
          }}
        >
          시간대 맞바꾸기
        </Button>
      </div>

      {!result && dateTime && (
        <p role="alert" className="text-sm text-destructive">
          유효한 날짜·시각과 시간대를 선택하세요.
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{toZone}</p>
              <p className="text-2xl font-bold tabular-nums">
                {result.converted}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyResult}>
              복사
            </Button>
          </div>

          <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">출발 offset</dt>
              <dd className="font-medium tabular-nums">
                UTC{formatOffset(result.fromOffset)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">도착 offset</dt>
              <dd className="font-medium tabular-nums">
                UTC{formatOffset(result.toOffset)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">시차</dt>
              <dd className="font-medium tabular-nums">
                {result.diffMinutes >= 0 ? '+' : '−'}
                {Math.abs(result.diffMinutes / 60)
                  .toFixed(2)
                  .replace(/\.?0+$/, '')}
                시간
              </dd>
            </div>
          </dl>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        DST(서머타임)는 선택한 날짜 기준으로 자동 반영됩니다. 모든 계산은
        브라우저에서 즉시 처리됩니다.
      </p>
    </main>
  );
}
