'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type UnitSystem = 'metric' | 'imperial';

interface BmiCategory {
  label: string;
  /** Tailwind 배경 색상 클래스 (배지·막대 공용) */
  color: string;
  /** 막대 위치 비율 (0~1), 구간 시작 BMI 기준 */
  rangeStart: number;
}

/** WHO 기준 BMI 구간. 막대는 15~40 BMI 범위를 시각화한다. */
const BAR_MIN = 15;
const BAR_MAX = 40;

const CATEGORIES: BmiCategory[] = [
  { label: '저체중', color: 'bg-sky-500', rangeStart: BAR_MIN },
  { label: '정상', color: 'bg-emerald-500', rangeStart: 18.5 },
  { label: '과체중', color: 'bg-amber-500', rangeStart: 25 },
  { label: '비만', color: 'bg-red-500', rangeStart: 30 },
];

const LB_PER_KG = 0.45359237;
const CM_PER_INCH = 2.54;

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return CATEGORIES[0];
  if (bmi < 25) return CATEGORIES[1];
  if (bmi < 30) return CATEGORIES[2];
  return CATEGORIES[3];
}

interface BmiResult {
  bmi: number;
  category: BmiCategory;
  /** 막대 위 마커 위치 (0~100%) */
  markerPercent: number;
}

export default function BmiCalcPage() {
  const [unit, setUnit] = useState<UnitSystem>('metric');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<BmiResult | null>(() => {
    const rawHeight = parseNum(height);
    const rawWeight = parseNum(weight);
    if (rawHeight === null || rawWeight === null) return null;

    // 미터법: cm·kg, 야드파운드법: in·lb → SI 단위로 정규화
    const meters =
      unit === 'metric'
        ? rawHeight / 100
        : (rawHeight * CM_PER_INCH) / 100;
    const kilograms =
      unit === 'metric' ? rawWeight : rawWeight * LB_PER_KG;

    if (meters <= 0) return null;
    const bmi = kilograms / (meters * meters);
    if (!Number.isFinite(bmi)) return null;

    const clamped = Math.min(Math.max(bmi, BAR_MIN), BAR_MAX);
    const markerPercent = ((clamped - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100;

    return { bmi, category: classifyBmi(bmi), markerPercent };
  }, [unit, height, weight]);

  const heightLabel = unit === 'metric' ? '키 (cm)' : '키 (in)';
  const weightLabel = unit === 'metric' ? '몸무게 (kg)' : '몸무게 (lb)';
  const heightPlaceholder = unit === 'metric' ? '예: 170' : '예: 67';
  const weightPlaceholder = unit === 'metric' ? '예: 65' : '예: 143';

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.bmi.toFixed(1));
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
    setUnit('metric');
    setHeight('');
    setWeight('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="BMI 계산기"
        widthClass="max-w-xl"
        onReset={height || weight ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          키와 몸무게로 체질량지수(BMI)를 계산하고 비만도 구간을 보여줍니다.
        </p>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex gap-1.5" role="group" aria-label="단위계 선택">
          <Button
            type="button"
            variant={unit === 'metric' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            aria-pressed={unit === 'metric'}
            onClick={() => setUnit('metric')}
          >
            미터법 (cm·kg)
          </Button>
          <Button
            type="button"
            variant={unit === 'imperial' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            aria-pressed={unit === 'imperial'}
            onClick={() => setUnit('imperial')}
          >
            야드파운드법 (in·lb)
          </Button>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">{heightLabel}</span>
          <Input
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={heightPlaceholder}
            aria-label={heightLabel}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{weightLabel}</span>
          <Input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={weightPlaceholder}
            aria-label={weightLabel}
          />
        </label>
      </div>

      {result && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">BMI</p>
              <p className="flex items-center gap-2">
                <span className="text-3xl font-bold tabular-nums">
                  {result.bmi.toFixed(1)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${result.category.color}`}
                >
                  {result.category.label}
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

          <div className="space-y-1.5">
            <div className="relative h-3 overflow-hidden rounded-full">
              {/* WHO 구간 색상 막대 (저체중→정상→과체중→비만) */}
              <div className="absolute inset-0 flex">
                <div className="bg-sky-500" style={{ width: '14%' }} />
                <div className="bg-emerald-500" style={{ width: '26%' }} />
                <div className="bg-amber-500" style={{ width: '20%' }} />
                <div className="bg-red-500" style={{ width: '40%' }} />
              </div>
              {/* 현재 BMI 위치 마커 */}
              <div
                className="absolute top-0 h-3 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background"
                style={{ left: `${result.markerPercent}%` }}
                aria-hidden
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            WHO 기준 — 저체중 18.5 미만 · 정상 18.5–24.9 · 과체중 25–29.9 · 비만 30 이상
          </p>
        </div>
      )}
      </main>
    </div>
  );
}
