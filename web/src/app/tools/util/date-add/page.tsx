'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Unit = 'day' | 'week' | 'month' | 'year';
type Operation = 'add' | 'subtract';

const UNIT_OPTIONS: { id: Unit; label: string }[] = [
  { id: 'day', label: '일' },
  { id: 'week', label: '주' },
  { id: 'month', label: '개월' },
  { id: 'year', label: '년' },
];

const OPERATION_OPTIONS: { id: Operation; label: string }[] = [
  { id: 'add', label: '더하기' },
  { id: 'subtract', label: '빼기' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const dateInputClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

/** "YYYY-MM-DD" 를 로컬 자정 Date 로 파싱. 무효한 날짜는 null. */
function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  const date = new Date(y, mo - 1, d);
  // 윤년·월별 일수 검증 (예: 2026-02-30 거르기).
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Date 를 "YYYY-MM-DD (요일)" 로 포맷. */
function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} (${WEEKDAYS[date.getDay()]})`;
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * 기준 날짜에 amount(단위·연산 적용)를 더한 새 Date 를 반환.
 * 월·년 연산 시 setMonth/setFullYear 의 자동 넘침(예: 1/31 + 1개월 → 3/3)을 막아
 * 해당 월 마지막 날로 고정(말일 클램프)한다.
 */
function shiftDate(base: Date, unit: Unit, signedAmount: number): Date {
  const result = new Date(base.getTime());

  switch (unit) {
    case 'day':
      result.setDate(result.getDate() + signedAmount);
      return result;
    case 'week':
      result.setDate(result.getDate() + signedAmount * 7);
      return result;
    case 'month': {
      const targetMonthIndex =
        result.getFullYear() * 12 + result.getMonth() + signedAmount;
      const targetYear = Math.floor(targetMonthIndex / 12);
      const targetMonth = targetMonthIndex - targetYear * 12;
      clampToMonth(result, targetYear, targetMonth);
      return result;
    }
    case 'year': {
      const targetYear = result.getFullYear() + signedAmount;
      clampToMonth(result, targetYear, result.getMonth());
      return result;
    }
    default:
      return result;
  }
}

/** date 의 일(day)을 목표 연·월의 마지막 날 이내로 클램프해 설정. */
function clampToMonth(date: Date, year: number, month: number): void {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDayOfMonth);
  date.setFullYear(year, month, day);
}

export default function DateAddPage() {
  const [startDate, setStartDate] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<Unit>('day');
  const [operation, setOperation] = useState<Operation>('add');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 하이드레이션 안전: 초기 렌더는 빈 값(결정적). 마운트 후에만 오늘 날짜 주입.
  useEffect(() => {
    setStartDate(todayInputValue());
  }, []);

  const result = useMemo(() => {
    const base = parseDate(startDate);
    if (base === null) return null;

    const trimmed = amount.trim().replace(/,/g, '');
    if (!/^[+-]?\d+$/.test(trimmed)) return null;
    const magnitude = Number(trimmed);
    if (!Number.isFinite(magnitude)) return null;

    const signedAmount = operation === 'subtract' ? -magnitude : magnitude;
    const target = shiftDate(base, unit, signedAmount);
    if (Number.isNaN(target.getTime())) return null;

    return { formatted: formatDate(target) };
  }, [startDate, amount, unit, operation]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setStartDate(todayInputValue());
    setAmount('');
    setUnit('day');
    setOperation('add');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="날짜 더하기/빼기"
        widthClass="max-w-xl"
        onReset={handleReset}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          기준 날짜에 일·주·개월·년을 더하거나 빼서 결과 날짜와 요일을 구합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">기준 날짜</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={dateInputClass}
              aria-label="기준 날짜"
            />
          </label>

          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="연산 선택">
            {OPERATION_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={operation === option.id ? 'default' : 'outline'}
                onClick={() => setOperation(option.id)}
                aria-pressed={operation === option.id}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">값</span>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 30"
                aria-label="더하거나 뺄 값"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">단위</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className={selectClass}
                aria-label="단위"
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {result && (
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">결과 날짜</p>
              <p className="text-2xl font-bold tabular-nums">
                {result.formatted}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="ml-1">
                {copied ? '복사됨' : copyError ? '복사 실패' : '복사'}
              </span>
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          월·년 단위 계산에서 기준일이 말일을 넘기면 해당 월의 마지막 날로
          맞춥니다(예: 1월 31일 + 1개월 = 2월 말일). 모든 계산은 브라우저에서
          즉시 처리됩니다.
        </p>
      </main>
    </div>
  );
}
