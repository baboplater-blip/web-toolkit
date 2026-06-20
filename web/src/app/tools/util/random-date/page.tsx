'use client';

import { useState } from 'react';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MAX_COUNT = 200;
const MS_PER_DAY = 86_400_000;

/** crypto 기반 균등 정수 [0, bound) (rejection sampling). bound 는 1 이상. */
function randomBelow(bound: number): number {
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - ((maxUint32 + 1) % bound);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value > limit);
  return value % bound;
}

/** 'YYYY-MM-DD' 문자열을 UTC 자정 타임스탬프(일 단위)로 파싱. 잘못된 형식이면 null. */
function parseDateUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);
  // 롤오버(예: 2월 30일) 검출.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return ms;
}

/** UTC 타임스탬프를 'YYYY-MM-DD' 로 포맷. */
function formatDateUtc(ms: number): string {
  const date = new Date(ms);
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RandomDatePage() {
  const [start, setStart] = useState('2000-01-01');
  const [end, setEnd] = useState('2025-12-31');
  const [count, setCount] = useState('5');
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 난수는 클릭 시에만 생성 → 초기 렌더는 결정적(하이드레이션 안전).
  function generate(): void {
    const startMs = parseDateUtc(start);
    const endMs = parseDateUtc(end);

    if (startMs === null || endMs === null) {
      setError('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
      setResults(null);
      return;
    }
    if (startMs > endMs) {
      setError('시작 날짜가 종료 날짜보다 늦을 수 없습니다.');
      setResults(null);
      return;
    }

    const howMany = Math.floor(Number(count));
    if (!Number.isFinite(howMany) || howMany < 1 || howMany > MAX_COUNT) {
      setError(`개수는 1~${MAX_COUNT} 사이여야 합니다.`);
      setResults(null);
      return;
    }

    // 시작·종료 포함(inclusive)이므로 일수에 +1.
    const dayRange = Math.round((endMs - startMs) / MS_PER_DAY) + 1;
    const dates: string[] = [];
    for (let i = 0; i < howMany; i += 1) {
      const offsetDays = randomBelow(dayRange);
      dates.push(formatDateUtc(startMs + offsetDays * MS_PER_DAY));
    }

    setError(null);
    setResults(dates);
    setCopied(false);
  }

  async function copyResults(): Promise<void> {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(results.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[random-date] clipboard write failed', err);
      setCopied(false);
    }
  }

  function reset(): void {
    setStart('2000-01-01');
    setEnd('2025-12-31');
    setCount('5');
    setResults(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="랜덤 날짜 생성기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          지정한 시작·종료 범위(양끝 포함) 안에서 무작위 날짜를 안전 난수로 생성합니다.
        </p>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">시작 날짜</span>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">종료 날짜</span>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">개수 (1~{MAX_COUNT})</span>
            <Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
          </label>
          <Button onClick={generate}>{results ? '다시 생성' : '생성'}</Button>
        </div>

        {error !== null && <p className="text-sm text-destructive">{error}</p>}

        {results !== null && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{results.length}개 생성됨</p>
              <Button variant="outline" size="sm" onClick={copyResults}>
                {copied ? '복사됨' : '전체 복사'}
              </Button>
            </div>
            <ul className="max-h-72 space-y-1 overflow-y-auto font-mono text-sm tabular-nums">
              {results.map((date, index) => (
                <li key={index} className="rounded bg-muted px-2.5 py-1">
                  {date}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
