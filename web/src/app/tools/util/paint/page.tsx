'use client';

import { useMemo, useState } from 'react';
import { Paintbrush, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Wall {
  id: number;
  width: string;
  height: string;
}

/** 0 이상의 유한 실수만 반환, 그 외에는 0. */
function parseNonNegative(value: string): number {
  const n = Number(value.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const EMPTY_WALL = (id: number): Wall => ({ id, width: '', height: '' });

export default function PaintCalcPage() {
  // 면적 입력 방식: 'walls' = 벽 치수(여러 개), 'area' = 총 면적 직접 입력
  const [mode, setMode] = useState<'walls' | 'area'>('walls');
  const [walls, setWalls] = useState<Wall[]>([EMPTY_WALL(1)]);
  const [totalAreaInput, setTotalAreaInput] = useState('');
  const [openings, setOpenings] = useState('');
  const [coats, setCoats] = useState('2');
  const [coverage, setCoverage] = useState('10');
  const [canSize, setCanSize] = useState('4');

  const result = useMemo(() => {
    const grossArea =
      mode === 'walls'
        ? walls.reduce(
            (sum, w) => sum + parseNonNegative(w.width) * parseNonNegative(w.height),
            0,
          )
        : parseNonNegative(totalAreaInput);

    const openingArea = parseNonNegative(openings);
    const netArea = Math.max(0, grossArea - openingArea);

    const coatCount = parseNonNegative(coats) || 1;
    const coveragePerLiter = parseNonNegative(coverage);
    const litersPerCan = parseNonNegative(canSize);

    if (netArea <= 0 || coveragePerLiter <= 0) return null;

    const liters = (netArea * coatCount) / coveragePerLiter;
    const litersRounded = Math.ceil(liters);
    const cans = litersPerCan > 0 ? Math.ceil(liters / litersPerCan) : null;

    return { grossArea, netArea, liters, litersRounded, cans, litersPerCan };
  }, [mode, walls, totalAreaInput, openings, coats, coverage, canSize]);

  const updateWall = (id: number, key: 'width' | 'height', value: string) => {
    setWalls((prev) => prev.map((w) => (w.id === id ? { ...w, [key]: value } : w)));
  };

  const addWall = () => {
    setWalls((prev) => [...prev, EMPTY_WALL(prev.length ? prev[prev.length - 1].id + 1 : 1)]);
  };

  const removeWall = (id: number) => {
    setWalls((prev) => (prev.length > 1 ? prev.filter((w) => w.id !== id) : prev));
  };

  const reset = () => {
    setMode('walls');
    setWalls([EMPTY_WALL(1)]);
    setTotalAreaInput('');
    setOpenings('');
    setCoats('2');
    setCoverage('10');
    setCanSize('4');
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard?.writeText(
      `면적 ${result.netArea.toFixed(2)}㎡ · 페인트 ${result.litersRounded}L` +
        (result.cans !== null ? ` · ${result.litersPerCan}L 통 ${result.cans}개` : ''),
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="페인트 양 계산기" onReset={reset} />

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          벽 면적과 도포율로 필요한 페인트 양을 계산합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'walls' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('walls')}
            >
              벽 치수로 입력
            </Button>
            <Button
              type="button"
              variant={mode === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('area')}
            >
              총 면적 직접 입력
            </Button>
          </div>

          {mode === 'walls' ? (
            <div className="space-y-2">
              <span className="text-sm font-medium">벽 치수 (가로 × 세로, m)</span>
              {walls.map((wall, index) => (
                <div key={wall.id} className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={wall.width}
                    onChange={(e) => updateWall(wall.id, 'width', e.target.value)}
                    placeholder="가로(m)"
                    aria-label={`벽 ${index + 1} 가로(m)`}
                  />
                  <span className="text-muted-foreground" aria-hidden>
                    ×
                  </span>
                  <Input
                    inputMode="decimal"
                    value={wall.height}
                    onChange={(e) => updateWall(wall.id, 'height', e.target.value)}
                    placeholder="세로(m)"
                    aria-label={`벽 ${index + 1} 세로(m)`}
                  />
                  <button
                    type="button"
                    onClick={() => removeWall(wall.id)}
                    disabled={walls.length <= 1}
                    aria-label={`벽 ${index + 1} 삭제`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addWall}>
                <Plus className="mr-1 h-4 w-4" />벽 추가
              </Button>
            </div>
          ) : (
            <label className="block space-y-1">
              <span className="text-sm font-medium">총 면적 (㎡)</span>
              <Input
                inputMode="decimal"
                value={totalAreaInput}
                onChange={(e) => setTotalAreaInput(e.target.value)}
                placeholder="예: 40"
              />
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium">문·창문 등 제외 면적 (㎡, 선택)</span>
            <Input
              inputMode="decimal"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              placeholder="예: 3"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">도장 횟수</span>
              <Input
                inputMode="numeric"
                value={coats}
                onChange={(e) => setCoats(e.target.value)}
                placeholder="2"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">도포율 (㎡/L)</span>
              <Input
                inputMode="decimal"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                placeholder="10"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">통 용량 (L)</span>
              <Input
                inputMode="decimal"
                value={canSize}
                onChange={(e) => setCanSize(e.target.value)}
                placeholder="4"
              />
            </label>
          </div>
        </div>

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                결과
              </h2>
              <Button variant="outline" size="sm" onClick={copy}>
                복사
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">도장 면적</p>
                <p className="text-xl font-bold tabular-nums">{result.netArea.toFixed(2)}㎡</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">필요 페인트</p>
                <p className="text-xl font-bold tabular-nums">{result.litersRounded}L</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  정확히 {result.liters.toFixed(2)}L
                </p>
              </div>
              {result.cans !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">{result.litersPerCan}L 통</p>
                  <p className="text-xl font-bold tabular-nums">{result.cans}개</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            필요량 = (총 면적 − 제외 면적) × 도장 횟수 ÷ 도포율. 통 개수는 올림 처리합니다. 실제
            소요량은 표면 상태·흡수율·롤러 손실에 따라 달라질 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
