/**
 * 5 필드 cron 파서 (분 시 일 월 요일).
 *
 * 지원:
 *   - 숫자 (예: 30, 0)
 *   - 와일드카드 *
 *   - 목록 a,b,c (예: 1,15,45)
 *   - 범위 a-b (예: 9-17)
 *   - 스텝 a/b, a-b/c, *\/b  (예: *\/5, 0-30/10)
 *
 * 표준을 지키지만 초·연도·닉네임 (@hourly 등) 은 지원하지 않는다.
 */

export interface CronFields {
  minute: Set<number>;
  hour: Set<number>;
  day: Set<number>;
  month: Set<number>;
  weekday: Set<number>;
}

function parseField(raw: string, min: number, max: number): Set<number> {
  const out = new Set<number>();
  const parts = raw.split(',');
  for (const p of parts) {
    const m = p.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) throw new Error(`cron 필드 파싱 실패: "${p}"`);
    const base = m[1];
    const step = m[2] ? parseInt(m[2], 10) : 1;
    if (!Number.isFinite(step) || step < 1) throw new Error(`잘못된 step: "${p}"`);

    let from: number;
    let to: number;
    if (base === '*') {
      from = min;
      to = max;
    } else if (base.includes('-')) {
      const [a, b] = base.split('-').map((s) => parseInt(s, 10));
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < min || b > max || a > b) {
        throw new Error(`잘못된 범위: "${p}"`);
      }
      from = a;
      to = b;
    } else {
      const v = parseInt(base, 10);
      if (!Number.isFinite(v) || v < min || v > max) {
        throw new Error(`범위 초과: "${p}" (허용 ${min}-${max})`);
      }
      from = v;
      to = m[2] ? max : v; // a/b 는 a 부터 max 까지
    }
    for (let v = from; v <= to; v += step) out.add(v);
  }
  return out;
}

export function parseCron(expr: string): CronFields {
  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 5) {
    throw new Error(`cron 은 5개 필드여야 함: "${expr}"`);
  }
  const [m, h, d, mo, w] = tokens;
  return {
    minute: parseField(m, 0, 59),
    hour: parseField(h, 0, 23),
    day: parseField(d, 1, 31),
    month: parseField(mo, 1, 12),
    weekday: parseField(w, 0, 6),
  };
}

/**
 * 주어진 cron 표현식의 다음 실행 시각을 계산한다 (from 이후 첫 번째).
 * 로컬 시간대를 기준으로 하며, 1년 내에 찾지 못하면 오류.
 */
export function nextCronRun(expr: string, from: Date = new Date()): Date {
  const fields = parseCron(expr);

  // from 의 다음 분부터 탐색 (동일 분 내 재실행 방지)
  const start = new Date(from.getTime() + 60_000);
  start.setSeconds(0, 0);

  const limit = new Date(start.getTime() + 366 * 24 * 60 * 60_000);
  const t = new Date(start);
  while (t <= limit) {
    if (
      fields.month.has(t.getMonth() + 1) &&
      fields.day.has(t.getDate()) &&
      fields.weekday.has(t.getDay()) &&
      fields.hour.has(t.getHours()) &&
      fields.minute.has(t.getMinutes())
    ) {
      return new Date(t);
    }
    t.setMinutes(t.getMinutes() + 1);
  }
  throw new Error(`cron "${expr}" 의 다음 실행 시각을 찾지 못했습니다`);
}
