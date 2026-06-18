'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

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

/** 처음 화면에 표시할 기본 도시 시간대. */
const DEFAULT_ZONES = ['Asia/Seoul', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

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

/** "Asia/Seoul" → "Seoul" 처럼 도시명만 사람이 읽기 좋게 변환. */
function zoneLabel(timeZone: string): string {
  const city = timeZone.split('/').pop() ?? timeZone;
  return city.replace(/_/g, ' ');
}

/** 주어진 시각(Date)을 특정 시간대의 "HH:mm:ss" 로 포맷. */
function formatTime(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
}

/** 주어진 시각(Date)을 특정 시간대의 "2026-06-18 (목)" 형태 날짜로 포맷. */
function formatDate(now: Date, timeZone: string): string {
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone,
    weekday: 'short',
  }).format(now);
  return `${date} (${weekday})`;
}

export default function WorldClockPage() {
  const zones = useMemo(() => getTimeZones(), []);
  const [cities, setCities] = useState<string[]>(DEFAULT_ZONES);
  const [toAdd, setToAdd] = useState<string>('');
  // 하이드레이션 안전: 서버/클라이언트 시각이 달라 초기 렌더에서 시각을 그리면 불일치가 난다.
  // null 로 시작해 placeholder 를 렌더하고, 마운트 후 setInterval 로만 시각을 주입한다.
  const [now, setNow] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    // 마운트 직후 1회 즉시 채우고, 이후 1초마다 갱신 (의도된 set-state-in-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // 아직 추가되지 않은, 추가 가능한 시간대 목록.
  const available = useMemo(
    () => zones.filter((zone) => !cities.includes(zone)),
    [zones, cities],
  );

  function addCity() {
    if (!toAdd || cities.includes(toAdd)) return;
    setCities((prev) => [...prev, toAdd]);
    setToAdd('');
  }

  function removeCity(timeZone: string) {
    setCities((prev) => prev.filter((zone) => zone !== timeZone));
  }

  function handleReset() {
    setCities(DEFAULT_ZONES);
    setToAdd('');
  }

  async function copyAll() {
    if (!now || cities.length === 0) return;
    const lines = cities.map(
      (zone) => `${zoneLabel(zone)} ${formatDate(now, zone)} ${formatTime(now, zone)}`,
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 비보안 컨텍스트·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="세계 시계" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          여러 도시의 현재 시각을 한 화면에서 봅니다. 모든 시각은 브라우저에서 즉시 계산됩니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">도시 추가</span>
            <div className="flex gap-2">
              <select
                value={toAdd}
                onChange={(e) => setToAdd(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="추가할 시간대"
              >
                <option value="">시간대 선택…</option>
                {available.map((zone) => (
                  <option key={zone} value={zone}>
                    {zoneLabel(zone)} — {zone}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" onClick={addCity} disabled={!toAdd}>
                <Plus className="h-4 w-4" aria-hidden />
                <span className="ml-1">추가</span>
              </Button>
            </div>
          </label>
        </div>

        {cities.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            표시할 도시가 없습니다. 위에서 시간대를 추가하세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {cities.map((zone) => (
              <li
                key={zone}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{zoneLabel(zone)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {now ? formatDate(now, zone) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums">
                    {now ? formatTime(now, zone) : '--:--:--'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCity(zone)}
                    aria-label={`${zoneLabel(zone)} 삭제`}
                    title="삭제"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cities.length > 0 && (
          <Button variant="outline" size="sm" onClick={copyAll} disabled={!now}>
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="ml-1">
              {copied ? '복사됨' : copyError ? '복사 실패' : '전체 복사'}
            </span>
          </Button>
        )}
      </main>
    </div>
  );
}
