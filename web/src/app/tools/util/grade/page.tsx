'use client';

import { useMemo, useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface GradeRow {
  /** 안정적인 React key (배열 인덱스 대신 사용) */
  id: number;
  /** 항목명 (예: 중간고사) */
  name: string;
  /** 점수 입력 문자열 (0~100) */
  score: string;
  /** 가중치 입력 문자열 (%) */
  weight: string;
}

/** 가중 평균을 등급 문자로 매핑하는 구간 (내림차순). */
const LETTER_GRADES: { min: number; letter: string }[] = [
  { min: 90, letter: 'A' },
  { min: 80, letter: 'B' },
  { min: 70, letter: 'C' },
  { min: 60, letter: 'D' },
  { min: 0, letter: 'F' },
];

let nextRowId = 0;
function makeRow(name = ''): GradeRow {
  nextRowId += 1;
  return { id: nextRowId, name, score: '', weight: '' };
}

function makeInitialRows(): GradeRow[] {
  return [makeRow('중간고사'), makeRow('기말고사'), makeRow('과제')];
}

/** 0~100 범위 점수로 파싱. 무효하면 null. */
function parseScore(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const score = Number(trimmed);
  if (!Number.isFinite(score) || score < 0 || score > 100) return null;
  return score;
}

/** 0 초과 가중치로 파싱. 무효하면 null. */
function parseWeight(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const weight = Number(trimmed);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  return weight;
}

function letterFor(average: number): string {
  const match = LETTER_GRADES.find((grade) => average >= grade.min);
  return match ? match.letter : 'F';
}

interface GradeResult {
  /** 가중치 합으로 정규화한 가중 평균 (0~100) */
  average: number;
  /** 등급 문자 */
  letter: string;
  /** 입력된 가중치 총합 */
  totalWeight: number;
  /** 가중치 합이 100 이 아니면 true (정규화로 계산은 진행) */
  weightMismatch: boolean;
}

export default function GradeCalcPage() {
  const [rows, setRows] = useState<GradeRow[]>(makeInitialRows);

  function updateRow(id: number, patch: Partial<GradeRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.id !== id) : prev,
    );
  }

  function handleReset() {
    setRows(makeInitialRows());
  }

  const result = useMemo<GradeResult | null>(() => {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const row of rows) {
      const score = parseScore(row.score);
      const weight = parseWeight(row.weight);
      // 점수·가중치가 모두 유효한 행만 합산에 포함한다.
      if (score === null || weight === null) continue;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    if (totalWeight <= 0) return null;

    const average = weightedSum / totalWeight;
    return {
      average,
      letter: letterFor(average),
      totalWeight,
      // 부동소수 오차를 감안해 0.01 허용오차로 100 비교.
      weightMismatch: Math.abs(totalWeight - 100) > 0.01,
    };
  }, [rows]);

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="성적 계산기"
        widthClass="max-w-xl"
        onReset={handleReset}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          항목별 점수와 가중치(%)로 가중 평균과 등급을 계산합니다. 가중치 합이
          100이 아니어도 합계로 정규화해 계산합니다.
        </p>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="hidden grid-cols-[1fr_5rem_5rem_2rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
            <span>항목명</span>
            <span>점수</span>
            <span>가중치(%)</span>
            <span />
          </div>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_5rem_5rem_2rem] items-center gap-2"
            >
              <Input
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder={`항목 ${index + 1}`}
                aria-label={`항목 ${index + 1} 이름`}
              />
              <Input
                inputMode="decimal"
                value={row.score}
                onChange={(e) => updateRow(row.id, { score: e.target.value })}
                placeholder="0~100"
                aria-label={`항목 ${index + 1} 점수`}
              />
              <Input
                inputMode="decimal"
                value={row.weight}
                onChange={(e) => updateRow(row.id, { weight: e.target.value })}
                placeholder="%"
                aria-label={`항목 ${index + 1} 가중치`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
                aria-label={`항목 ${index + 1} 삭제`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addRow}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            항목 추가
          </Button>
        </div>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
                <p className="text-sm font-medium">가중 평균</p>
              </div>
              <p className="flex items-center gap-2">
                <span className="text-3xl font-bold tabular-nums">
                  {result.average.toFixed(2).replace(/\.?0+$/, '')}
                </span>
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  {result.letter}
                </span>
              </p>
            </div>
            <p className="border-t pt-3 text-xs text-muted-foreground">
              가중치 합계: {result.totalWeight.toLocaleString()}%
            </p>
            {result.weightMismatch && (
              <p role="alert" className="text-xs text-amber-600">
                가중치 합이 100%가 아닙니다. 입력한 합계({' '}
                {result.totalWeight.toLocaleString()}% )를 기준으로 정규화해
                계산했습니다.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          가중 평균 = Σ(점수 × 가중치) ÷ Σ(가중치). 등급은 A 90↑ · B 80↑ · C 70↑
          · D 60↑ · F 60 미만 기준입니다. 모든 계산은 브라우저에서 즉시
          처리됩니다.
        </p>
      </main>
    </div>
  );
}
