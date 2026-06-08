'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type ScaleId = '4.5' | '4.3' | '4.0';

interface CourseRow {
  id: number;
  name: string;
  credits: string;
  grade: string;
}

/** 등급 → 스케일별 평점 매핑. */
const GRADE_POINTS: Record<ScaleId, Record<string, number>> = {
  '4.5': {
    'A+': 4.5,
    A: 4.0,
    'B+': 3.5,
    B: 3.0,
    'C+': 2.5,
    C: 2.0,
    'D+': 1.5,
    D: 1.0,
    F: 0.0,
  },
  '4.3': {
    'A+': 4.3,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    F: 0.0,
  },
  '4.0': {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    F: 0.0,
  },
};

const SCALES: { id: ScaleId; label: string }[] = [
  { id: '4.5', label: '4.5 만점' },
  { id: '4.3', label: '4.3 만점' },
  { id: '4.0', label: '4.0 만점' },
];

let rowCounter = 0;
function makeRow(): CourseRow {
  rowCounter += 1;
  return { id: rowCounter, name: '', credits: '', grade: '' };
}

const INITIAL_ROWS: CourseRow[] = [makeRow(), makeRow(), makeRow()];

/** 학점 입력을 양수로 파싱. null = 무효. */
function parseCredits(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export default function GpaPage() {
  const [scale, setScale] = useState<ScaleId>('4.5');
  const [rows, setRows] = useState<CourseRow[]>(INITIAL_ROWS);

  const gradeOptions = useMemo(
    () => Object.keys(GRADE_POINTS[scale]),
    [scale],
  );

  const result = useMemo(() => {
    let totalCredits = 0;
    let weightedSum = 0;
    let countedRows = 0;
    const gradeMap = GRADE_POINTS[scale];

    for (const row of rows) {
      const credits = parseCredits(row.credits);
      const point = row.grade ? gradeMap[row.grade] : undefined;
      if (credits === null || point === undefined) continue;
      totalCredits += credits;
      weightedSum += credits * point;
      countedRows += 1;
    }

    if (totalCredits === 0 || countedRows === 0) return null;
    return {
      gpa: weightedSum / totalCredits,
      totalCredits,
      countedRows,
    };
  }, [rows, scale]);

  function updateRow(id: number, patch: Partial<Omit<CourseRow, 'id'>>) {
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

  function copyResult() {
    if (result) {
      navigator.clipboard?.writeText(
        `GPA ${result.gpa.toFixed(2)} / ${scale} (${result.totalCredits}학점)`,
      );
    }
  }

  function handleReset() {
    setScale('4.5');
    setRows([makeRow(), makeRow(), makeRow()]);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="학점(GPA) 계산기" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          과목별 학점·등급으로 평점평균(GPA)을 계산합니다.
        </p>

      <div className="space-y-1">
        <span className="text-sm font-medium">평점 스케일</span>
        <div className="grid grid-cols-3 gap-1.5">
          {SCALES.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={scale === option.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScale(option.id)}
              aria-pressed={scale === option.id}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="hidden grid-cols-[1fr_5rem_5rem_2rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>과목명</span>
          <span>학점수</span>
          <span>등급</span>
          <span aria-hidden />
        </div>

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_4.5rem_4.5rem_2rem] items-center gap-2 sm:grid-cols-[1fr_5rem_5rem_2rem]"
          >
            <Input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(row.id, { name: e.target.value })}
              placeholder={`과목 ${index + 1}`}
              aria-label={`${index + 1}번째 과목명`}
            />
            <Input
              inputMode="decimal"
              value={row.credits}
              onChange={(e) => updateRow(row.id, { credits: e.target.value })}
              placeholder="3"
              aria-label={`${index + 1}번째 학점수`}
            />
            <select
              value={row.grade}
              onChange={(e) => updateRow(row.id, { grade: e.target.value })}
              aria-label={`${index + 1}번째 등급`}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">—</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              aria-label={`${index + 1}번째 과목 삭제`}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="mt-1"
        >
          <Plus className="h-4 w-4" aria-hidden />
          과목 추가
        </Button>
      </div>

      {!result && (
        <p role="alert" className="text-sm text-destructive">
          최소 한 과목의 학점수(양수)와 등급을 입력하세요.
        </p>
      )}

      {result && (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">
              평점평균 (GPA · {scale} 만점)
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {result.gpa.toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              반영 {result.countedRows}과목 · 총 {result.totalCredits}학점
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyResult}>
            복사
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        학점수와 등급이 모두 입력된 과목만 평균에 반영됩니다. 모든 계산은
        브라우저에서 즉시 처리됩니다.
      </p>
      </main>
    </div>
  );
}
