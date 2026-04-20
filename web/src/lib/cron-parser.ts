/**
 * 5 필드 cron 파서 — 브라우저에서 스케줄 설명·다음 실행 시각 계산용.
 * 에이전트 측 src/cron-parser.ts 와 동일한 구현을 공유하기 위해 분리.
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
      to = m[2] ? max : v;
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

export function isValidCron(expr: string): boolean {
  try {
    parseCron(expr);
    return true;
  } catch {
    return false;
  }
}

export function nextCronRun(expr: string, from: Date = new Date()): Date {
  const fields = parseCron(expr);
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

const DAY_NAMES_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** 사람이 읽기 쉬운 한국어 설명으로 변환 (가능한 경우). */
export function describeCron(expr: string): string {
  let fields: CronFields;
  try {
    fields = parseCron(expr);
  } catch {
    return expr;
  }
  const { minute, hour, day, month, weekday } = fields;

  const allHour = hour.size === 24;
  const allDay = day.size === 31;
  const allMonth = month.size === 12;
  const allWeekday = weekday.size === 7;

  // 매 N 분 (0부터 시작, 균등 간격)
  if (allHour && allDay && allMonth && allWeekday && minute.size > 1 && minute.size < 60) {
    const arr = [...minute].sort((a, b) => a - b);
    const step = arr[1] - arr[0];
    if (arr.every((v, i) => v === i * step) && 60 % step === 0) {
      return `${step}분마다`;
    }
  }

  // 시간 기반 설명
  const minList = [...minute].sort((a, b) => a - b);
  const hourList = [...hour].sort((a, b) => a - b);
  const weekdayList = [...weekday].sort((a, b) => a - b);
  const dayList = [...day].sort((a, b) => a - b);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const timeStr =
    minute.size === 1 && hour.size === 1
      ? `${pad2(hourList[0])}:${pad2(minList[0])}`
      : null;

  // 매일 H:M
  if (timeStr && allDay && allMonth && allWeekday) return `매일 ${timeStr}`;

  // 평일 (1-5)
  if (
    timeStr &&
    allDay &&
    allMonth &&
    weekdayList.length === 5 &&
    weekdayList.every((d, i) => d === i + 1)
  ) {
    return `평일 ${timeStr}`;
  }

  // 매주 특정 요일
  if (timeStr && allDay && allMonth && weekday.size >= 1 && weekday.size <= 6) {
    const days = weekdayList.map((d) => DAY_NAMES_KO[d]).join('·');
    return `매주 ${days}요일 ${timeStr}`;
  }

  // 매시간 M분
  if (allHour && allDay && allMonth && allWeekday && minute.size === 1) {
    return `매시간 ${minList[0]}분`;
  }

  // 매월 특정 일
  if (timeStr && allMonth && allWeekday && day.size >= 1 && day.size <= 5) {
    return `매월 ${dayList.join('·')}일 ${timeStr}`;
  }

  // 기본: cron 원문 그대로
  return expr;
}
