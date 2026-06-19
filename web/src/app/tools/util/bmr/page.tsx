'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Sex = 'male' | 'female';

interface ActivityLevel {
  label: string;
  /** TDEE 계산용 활동 계수. */
  multiplier: number;
  /** 활동 강도 설명. */
  description: string;
}

/** 일반적인 Mifflin-St Jeor TDEE 활동 계수 5단계. */
const ACTIVITY_LEVELS: ActivityLevel[] = [
  { label: '거의 안 함', multiplier: 1.2, description: '운동 없음·좌식 생활' },
  { label: '가벼움', multiplier: 1.375, description: '주 1~3회 가벼운 운동' },
  { label: '보통', multiplier: 1.55, description: '주 3~5회 운동' },
  { label: '활발함', multiplier: 1.725, description: '주 6~7회 강한 운동' },
  { label: '매우 활발함', multiplier: 1.9, description: '하루 2회·육체 노동' },
];

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Mifflin-St Jeor 공식으로 기초대사량(BMR, kcal/day)을 계산한다.
 * 남: 10·kg + 6.25·cm − 5·age + 5
 * 여: 10·kg + 6.25·cm − 5·age − 161
 */
function computeBmr(
  sex: Sex,
  ageYears: number,
  heightCm: number,
  weightKg: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export default function BmrCalculatorPage() {
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const bmr = useMemo<number | null>(() => {
    const ageYears = parseNum(age);
    const heightCm = parseNum(height);
    const weightKg = parseNum(weight);
    if (ageYears === null || heightCm === null || weightKg === null) return null;
    const value = computeBmr(sex, ageYears, heightCm, weightKg);
    // 극단 입력으로 음수가 나오면 무효 처리.
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [sex, age, height, weight]);

  async function copy() {
    if (bmr === null) return;
    try {
      await navigator.clipboard.writeText(`${Math.round(bmr)} kcal`);
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
    setSex('male');
    setAge('');
    setHeight('');
    setWeight('');
  }

  const hasInput = Boolean(age || height || weight) || sex !== 'male';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="기초대사량(BMR) 계산기"
        widthClass="max-w-xl"
        onReset={hasInput ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          Mifflin-St Jeor 공식으로 기초대사량(BMR)과 활동량별 일일 권장 섭취
          칼로리(TDEE)를 추정합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-1.5" role="group" aria-label="성별 선택">
            <Button
              type="button"
              variant={sex === 'male' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              aria-pressed={sex === 'male'}
              onClick={() => setSex('male')}
            >
              남
            </Button>
            <Button
              type="button"
              variant={sex === 'female' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              aria-pressed={sex === 'female'}
              onClick={() => setSex('female')}
            >
              여
            </Button>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">나이 (세)</span>
            <Input
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="예: 30"
              aria-label="나이 (세)"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">키 (cm)</span>
            <Input
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="예: 170"
              aria-label="키 (cm)"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">몸무게 (kg)</span>
            <Input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="예: 65"
              aria-label="몸무게 (kg)"
            />
          </label>
        </div>

        {bmr !== null && (
          <div className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">기초대사량 (BMR)</p>
                <p className="text-3xl font-bold tabular-nums">
                  {Math.round(bmr).toLocaleString()}
                  <span className="ml-1 text-sm text-muted-foreground">
                    kcal/일
                  </span>
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

            <div className="space-y-1.5 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                활동량별 일일 소비 칼로리 (TDEE) 추정
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1 font-medium">활동량</th>
                    <th className="py-1 font-medium tabular-nums">계수</th>
                    <th className="py-1 text-right font-medium">kcal/일</th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITY_LEVELS.map((level) => (
                    <tr key={level.multiplier} className="border-t">
                      <td className="py-1.5">
                        <span className="font-medium">{level.label}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {level.description}
                        </span>
                      </td>
                      <td className="py-1.5 align-top tabular-nums text-muted-foreground">
                        {level.multiplier}
                      </td>
                      <td className="py-1.5 text-right align-top font-semibold tabular-nums">
                        {Math.round(bmr * level.multiplier).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              추정치입니다. 실제 대사량은 체구성·건강 상태에 따라 달라질 수
              있으며, 의학적 판단의 근거로 사용하지 마세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
