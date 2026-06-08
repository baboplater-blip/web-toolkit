'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Sex = 'male' | 'female';
type UnitSystem = 'metric' | 'imperial';

interface ActivityLevel {
  id: string;
  label: string;
  hint: string;
  factor: number;
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary', label: '거의 안 함', hint: '운동 안 함, 사무직', factor: 1.2 },
  { id: 'light', label: '가벼움', hint: '주 1~3회 운동', factor: 1.375 },
  { id: 'moderate', label: '보통', hint: '주 3~5회 운동', factor: 1.55 },
  { id: 'active', label: '활발함', hint: '주 6~7회 운동', factor: 1.725 },
  { id: 'veryActive', label: '매우 활발', hint: '하루 2회/육체노동', factor: 1.9 },
];

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

/** 입력 문자열을 양수로 파싱 (쉼표 허용). null = 무효. */
function parsePositive(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Mifflin-St Jeor 공식으로 BMR(kcal/일) 계산.
 * 남성: 10·kg + 6.25·cm − 5·age + 5
 * 여성: 10·kg + 6.25·cm − 5·age − 161
 */
function calcBmr(
  sex: Sex,
  ageYears: number,
  heightCm: number,
  weightKg: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

function fmtKcal(value: number): string {
  return Math.round(value).toLocaleString();
}

export default function TdeePage() {
  const [sex, setSex] = useState<Sex>('male');
  const [unit, setUnit] = useState<UnitSystem>('metric');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityId, setActivityId] = useState<string>('moderate');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo(() => {
    const ageNum = parsePositive(age);
    const heightNum = parsePositive(height);
    const weightNum = parsePositive(weight);
    if (ageNum === null || heightNum === null || weightNum === null) {
      return null;
    }
    if (ageNum > 120) return null;

    const heightCm = unit === 'metric' ? heightNum : heightNum * CM_PER_INCH;
    const weightKg = unit === 'metric' ? weightNum : weightNum * KG_PER_LB;

    const bmr = calcBmr(sex, ageNum, heightCm, weightKg);
    if (!Number.isFinite(bmr) || bmr <= 0) return null;

    const activity =
      ACTIVITY_LEVELS.find((level) => level.id === activityId) ??
      ACTIVITY_LEVELS[2];
    const tdee = bmr * activity.factor;

    return {
      bmr,
      tdee,
      activityLabel: activity.label,
      factor: activity.factor,
    };
  }, [sex, unit, age, height, weight, activityId]);

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        `BMR ${fmtKcal(result.bmr)} kcal / TDEE ${fmtKcal(result.tdee)} kcal`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // 보안 컨텍스트(HTTPS) 아님·권한 거부 시 클립보드 API 가 거부될 수 있다.
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  const heightLabel = unit === 'metric' ? '키 (cm)' : '키 (inch)';
  const weightLabel = unit === 'metric' ? '몸무게 (kg)' : '몸무게 (lb)';

  function handleReset() {
    setSex('male');
    setUnit('metric');
    setAge('');
    setHeight('');
    setWeight('');
    setActivityId('moderate');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="칼로리·TDEE 계산기"
        widthClass="max-w-xl"
        onReset={age || height || weight ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          키·몸무게·활동량으로 기초대사량과 하루 권장 칼로리를 계산합니다.
        </p>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-sm font-medium">성별</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'male', label: '남성' },
                  { id: 'female', label: '여성' },
                ] as const
              ).map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={sex === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSex(option.id)}
                  aria-pressed={sex === option.id}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium">단위</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'metric', label: '미터' },
                  { id: 'imperial', label: '임페리얼' },
                ] as const
              ).map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={unit === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUnit(option.id)}
                  aria-pressed={unit === option.id}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">나이 (세)</span>
            <Input
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="예: 30"
              aria-label="나이"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{heightLabel}</span>
            <Input
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={unit === 'metric' ? '예: 175' : '예: 69'}
              aria-label={heightLabel}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{weightLabel}</span>
            <Input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unit === 'metric' ? '예: 70' : '예: 154'}
              aria-label={weightLabel}
            />
          </label>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium">활동량</span>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setActivityId(level.id)}
                aria-pressed={activityId === level.id}
                className={`rounded-md border px-2.5 py-1.5 text-left text-sm ${
                  activityId === level.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                <span className="font-medium">{level.label}</span>
                <span
                  className={`block text-[11px] ${
                    activityId === level.id
                      ? 'text-primary-foreground/80'
                      : 'text-muted-foreground'
                  }`}
                >
                  {level.hint} (×{level.factor})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {!result &&
        (age !== '' || height !== '' || weight !== '') && (
          <p role="alert" className="text-sm text-destructive">
            나이(1~120)·키·몸무게를 올바른 양수로 입력하세요.
          </p>
        )}

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                기초대사량 (BMR)
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {fmtKcal(result.bmr)}
                <span className="ml-1 text-sm text-muted-foreground">
                  kcal
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                하루 권장 (TDEE)
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {fmtKcal(result.tdee)}
                <span className="ml-1 text-sm text-muted-foreground">
                  kcal
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              {result.activityLabel} (활동계수 ×{result.factor})
            </p>
            <Button variant="outline" size="sm" onClick={copyResult}>
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
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Mifflin-St Jeor 공식 기반 추정치입니다. 개인차가 있으니 참고용으로
        사용하세요. 모든 계산은 브라우저에서 즉시 처리됩니다.
      </p>
      </main>
    </div>
  );
}
