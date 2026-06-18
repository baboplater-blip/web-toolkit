'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Sex = 'male' | 'female';

/** cm 입력을 inch 로 변환 (Devine·Robinson 공식은 inch 기준). */
function cmToInch(cm: number): number {
  return cm / 2.54;
}

interface FormulaResult {
  /** 공식 이름. */
  name: string;
  /** 표준체중(kg). */
  kg: number;
  /** 설명. */
  note: string;
}

/**
 * 키(cm)·성별로 여러 공식의 표준체중(kg)을 계산.
 * Devine·Robinson 은 152.4cm(60inch) 초과분에 대해서만 가중.
 */
function computeWeights(heightCm: number, sex: Sex): FormulaResult[] {
  const inches = cmToInch(heightCm);
  const inchesOver60 = Math.max(0, inches - 60);
  const meters = heightCm / 100;

  // Devine (1974): 남 50 + 2.3/inch, 여 45.5 + 2.3/inch.
  const devineBase = sex === 'male' ? 50 : 45.5;
  const devine = devineBase + 2.3 * inchesOver60;

  // Robinson (1983): 남 52 + 1.9/inch, 여 49 + 1.7/inch.
  const robinsonBase = sex === 'male' ? 52 : 49;
  const robinsonStep = sex === 'male' ? 1.9 : 1.7;
  const robinson = robinsonBase + robinsonStep * inchesOver60;

  // BMI 22 기준 (성별 무관): 체중 = 22 × 키(m)².
  const bmi22 = 22 * meters * meters;

  return [
    {
      name: 'Devine 공식',
      kg: devine,
      note: '임상에서 약물 용량 계산에 널리 쓰이는 표준체중 공식',
    },
    {
      name: 'Robinson 공식',
      kg: robinson,
      note: 'Devine 을 보정한 변형 공식',
    },
    {
      name: 'BMI 22 기준',
      kg: bmi22,
      note: '정상 BMI 중앙값(22)으로 환산한 적정 체중',
    },
  ];
}

/** kg 값을 소수 1자리로 포맷. */
function formatKg(kg: number): string {
  return `${kg.toFixed(1)}kg`;
}

export default function IdealWeightPage() {
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // 입력 기반 결정적 — 실시간 useMemo 안전.
  const result = useMemo(() => {
    if (height.trim() === '') return null;
    const heightCm = Number(height.replace(/,/g, ''));
    // 사람 키의 합리적 범위로 가드.
    if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) return null;
    return computeWeights(heightCm, sex);
  }, [height, sex]);

  // BMI 정상 범위(18.5~24.9)에 대응하는 적정 체중 구간.
  const healthyRange = useMemo(() => {
    if (height.trim() === '') return null;
    const heightCm = Number(height.replace(/,/g, ''));
    if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) return null;
    const meters = heightCm / 100;
    return {
      min: 18.5 * meters * meters,
      max: 24.9 * meters * meters,
    };
  }, [height]);

  function handleReset() {
    setHeight('');
    setSex('male');
  }

  async function copyResult() {
    if (!result || !healthyRange) return;
    const lines = result.map((item) => `${item.name}: ${formatKg(item.kg)}`);
    lines.push(
      `정상 BMI 범위: ${formatKg(healthyRange.min)} ~ ${formatKg(healthyRange.max)}`,
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
      <ToolHeader
        title="표준 체중 계산기"
        widthClass="max-w-xl"
        onReset={height ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          키·성별로 여러 공식의 표준체중과 정상 BMI 범위를 계산합니다. 참고용 추정치입니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">키 (cm)</span>
            <Input
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="예: 170"
            />
          </label>
          <div className="space-y-1">
            <span className="text-sm font-medium">성별</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sex === 'male' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSex('male')}
              >
                남성
              </Button>
              <Button
                type="button"
                variant={sex === 'female' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSex('female')}
              >
                여성
              </Button>
            </div>
          </div>
        </div>

        {height && !result && (
          <p role="alert" className="text-sm text-destructive">
            100~250cm 사이의 키를 입력하세요.
          </p>
        )}

        {result && healthyRange && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">계산 결과</p>
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

            <ul className="space-y-2 border-t pt-3">
              {result.map((item) => (
                <li key={item.name} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.note}</p>
                  </div>
                  <span className="shrink-0 text-lg font-bold tabular-nums">
                    {formatKg(item.kg)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">정상 BMI(18.5~24.9) 범위</p>
              <p className="text-lg font-bold tabular-nums">
                {formatKg(healthyRange.min)} ~ {formatKg(healthyRange.max)}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
