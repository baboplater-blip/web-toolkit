'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type DogSize = 'small' | 'medium' | 'large' | 'giant';

interface SizeOption {
  id: DogSize;
  label: string;
  /** 2년 이후 1년당 더해지는 사람 나이. 소형견은 느리게, 대형견은 빠르게 노화한다. */
  perYearAfterTwo: number;
}

/**
 * 크기별 환산 계수. 첫 해 ≈ 15세, 둘째 해 ≈ +9세(누적 24세)는 공통이고,
 * 이후 1년당 증가폭이 크기에 따라 달라진다(소형 < 중형 < 대형 < 초대형).
 */
const SIZE_OPTIONS: SizeOption[] = [
  { id: 'small', label: '소형견 (~9kg)', perYearAfterTwo: 4 },
  { id: 'medium', label: '중형견 (10~22kg)', perYearAfterTwo: 5 },
  { id: 'large', label: '대형견 (23~40kg)', perYearAfterTwo: 6 },
  { id: 'giant', label: '초대형견 (41kg~)', perYearAfterTwo: 7 },
];

const FIRST_YEAR_HUMAN = 15;
const SECOND_YEAR_HUMAN = 24;

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm';

/** 입력 문자열을 0 이상의 유한한 수로 파싱. 무효하면 null. */
function parseAge(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * 강아지 나이(년)를 크기별 곡선으로 사람 나이로 환산한다.
 * - 0~1년 구간: 0 → 15세로 선형 보간
 * - 1~2년 구간: 15 → 24세로 선형 보간
 * - 2년 초과: 1년당 크기별 perYearAfterTwo 만큼 가산
 */
function toHumanYears(dogYears: number, perYearAfterTwo: number): number {
  if (dogYears <= 1) {
    return dogYears * FIRST_YEAR_HUMAN;
  }
  if (dogYears <= 2) {
    return FIRST_YEAR_HUMAN + (dogYears - 1) * (SECOND_YEAR_HUMAN - FIRST_YEAR_HUMAN);
  }
  return SECOND_YEAR_HUMAN + (dogYears - 2) * perYearAfterTwo;
}

export default function DogAgeCalcPage() {
  const [age, setAge] = useState('');
  const [size, setSize] = useState<DogSize>('medium');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<{ humanYears: number } | null>(() => {
    const dogYears = parseAge(age);
    if (dogYears === null) return null;

    const option = SIZE_OPTIONS.find((o) => o.id === size) ?? SIZE_OPTIONS[1];
    const humanYears = toHumanYears(dogYears, option.perYearAfterTwo);
    if (!Number.isFinite(humanYears)) return null;

    return { humanYears };
  }, [age, size]);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`사람 나이 약 ${Math.round(result.humanYears)}세`);
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
    setAge('');
    setSize('medium');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="강아지 나이 계산기"
        widthClass="max-w-xl"
        onReset={age ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          강아지의 나이를 크기에 따라 사람 나이로 환산합니다. 단순 ×7 보다 정확한
          크기별 곡선을 사용합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">강아지 나이 (년)</span>
            <Input
              inputMode="decimal"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="예: 3.5"
              aria-label="강아지 나이 (년)"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">크기</span>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as DogSize)}
              className={selectClass}
              aria-label="강아지 크기"
            >
              {SIZE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {result && (
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">사람 나이 환산</p>
              <p className="text-3xl font-bold tabular-nums">
                약 {Math.round(result.humanYears)}
                <span className="ml-1 text-lg font-medium">세</span>
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
          이 값은 일반적인 환산 공식을 따른 추정치이며 품종·건강 상태에 따라 달라질 수
          있습니다. 정확한 건강 평가는 수의사와 상담하세요.
        </p>
      </main>
    </div>
  );
}
