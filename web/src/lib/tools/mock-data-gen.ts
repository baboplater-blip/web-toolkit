/** 브라우저 전용 더미 데이터 생성기 (외부 의존성 없음). */

export type FieldType = 'name' | 'email' | 'phone' | 'address' | 'date' | 'uuid' | 'number';

export interface FieldDef {
  type: FieldType;
  /** 출력 키 이름 */
  key: string;
}

const FIRST_NAMES: readonly string[] = [
  '김민준', '이서연', '박지후', '최하은', '정도윤', '강시우', '조유진', '윤건우',
  '임채원', '한지안', '오서준', '서예린', '신주원', '권하준', '황민서',
];

const LAST_WORDS: readonly string[] = [
  '홍길동', '김철수', '이영희', '박보검', '최수지', '정우성', '한지민', '손예진',
];

const CITIES: readonly string[] = ['서울특별시', '부산광역시', '인천광역시', '대구광역시', '대전광역시', '광주광역시', '경기도 성남시', '경기도 수원시'];
const DISTRICTS: readonly string[] = ['강남구', '서초구', '마포구', '종로구', '송파구', '영등포구', '분당구', '일산동구'];
const STREETS: readonly string[] = ['테헤란로', '세종대로', '월드컵로', '한강대로', '올림픽로', '디지털로', '판교역로'];

const EMAIL_DOMAINS: readonly string[] = ['example.com', 'test.co.kr', 'mail.net', 'demo.org', 'sample.io'];

/**
 * crypto 기반 정수 난수(0 이상 max 미만). crypto 미지원 환경은 Math.random 폴백.
 */
function randomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

/** RFC4122 v4 UUID 를 crypto 로 생성한다. */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 폴백: getRandomValues 로 직접 조립.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function randomName(): string {
  return Math.random() < 0.5 ? pick(FIRST_NAMES) : pick(LAST_WORDS);
}

function randomEmail(): string {
  const local = `user${randomInt(90000) + 10000}`;
  return `${local}@${pick(EMAIL_DOMAINS)}`;
}

function randomPhone(): string {
  const mid = String(randomInt(9000) + 1000);
  const last = String(randomInt(9000) + 1000);
  return `010-${mid}-${last}`;
}

function randomAddress(): string {
  const buildingNo = randomInt(200) + 1;
  return `${pick(CITIES)} ${pick(DISTRICTS)} ${pick(STREETS)} ${buildingNo}`;
}

/** 최근 약 10년 범위의 ISO(YYYY-MM-DD) 날짜. */
function randomDate(): string {
  const now = Date.now();
  const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000;
  const ts = now - randomInt(tenYearsMs);
  return new Date(ts).toISOString().slice(0, 10);
}

function generateValue(type: FieldType): string | number {
  switch (type) {
    case 'name':
      return randomName();
    case 'email':
      return randomEmail();
    case 'phone':
      return randomPhone();
    case 'address':
      return randomAddress();
    case 'date':
      return randomDate();
    case 'uuid':
      return generateUuid();
    case 'number':
      return randomInt(10000);
    default:
      return '';
  }
}

export type MockRow = Record<string, string | number>;

/** 필드 정의와 행 수로 더미 행 배열을 생성한다. */
export function generateRows(fields: readonly FieldDef[], count: number): MockRow[] {
  const safeCount = Math.max(0, Math.min(10000, Math.floor(count)));
  const rows: MockRow[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    const row: MockRow = {};
    for (const field of fields) {
      row[field.key] = generateValue(field.type);
    }
    rows.push(row);
  }
  return rows;
}

/** CSV 한 칸을 RFC4180 규칙으로 이스케이프한다. */
function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** 행 배열을 CSV 문자열로 직렬화한다(헤더 포함). */
export function rowsToCsv(rows: readonly MockRow[], fields: readonly FieldDef[]): string {
  const header = fields.map((field) => escapeCsvCell(field.key)).join(',');
  const lines = rows.map((row) =>
    fields.map((field) => escapeCsvCell(row[field.key] ?? '')).join(','),
  );
  return [header, ...lines].join('\r\n');
}
