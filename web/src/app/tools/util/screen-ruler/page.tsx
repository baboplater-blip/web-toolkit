'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';

interface ScreenInfo {
  /** 인치당 픽셀. */
  ppi: number;
  /** 대각선 픽셀 수. */
  diagonalPixels: number;
  /** 가로 물리 크기(인치). */
  widthInch: number;
  /** 세로 물리 크기(인치). */
  heightInch: number;
  /** 총 픽셀 수(메가픽셀). */
  megapixels: number;
  /** 점 간격(mm) = 25.4 / ppi. */
  dotPitchMm: number;
}

/** 입력 문자열을 양수로 파싱한다. 유효하지 않으면 null. */
function parsePositive(value: string): number | null {
  const trimmed = value.replace(/,/g, '').trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export default function ScreenRulerPage() {
  const [widthPx, setWidthPx] = useState('1920');
  const [heightPx, setHeightPx] = useState('1080');
  const [diagonalInch, setDiagonalInch] = useState('24');

  const info = useMemo<ScreenInfo | null>(() => {
    const width = parsePositive(widthPx);
    const height = parsePositive(heightPx);
    const diagonal = parsePositive(diagonalInch);
    if (width === null || height === null || diagonal === null) return null;

    const diagonalPixels = Math.sqrt(width * width + height * height);
    const ppi = diagonalPixels / diagonal;
    return {
      ppi: Math.round(ppi * 10) / 10,
      diagonalPixels: Math.round(diagonalPixels),
      widthInch: Math.round((width / ppi) * 100) / 100,
      heightInch: Math.round((height / ppi) * 100) / 100,
      megapixels: Math.round((width * height) / 1_000_000 * 10) / 10,
      dotPitchMm: Math.round((25.4 / ppi) * 1000) / 1000,
    };
  }, [widthPx, heightPx, diagonalInch]);

  // CSS 눈금: 1cm 마다 굵은 눈금, 1mm 마다 가는 눈금을 반복 배경으로 표현한다.
  const rulerBackground =
    'repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent calc(1cm / 10)),' +
    'repeating-linear-gradient(to right, var(--foreground) 0, var(--foreground) 1px, transparent 1px, transparent 1cm)';

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Ruler className="h-5 w-5" />
            <h1 className="font-semibold text-base">화면 자·PPI 계산기</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          해상도와 대각선 크기를 입력하면 PPI(인치당 픽셀)와 화면 정보를 계산합니다.
        </p>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium">가로 해상도 (px)</span>
              <Input
                inputMode="numeric"
                value={widthPx}
                onChange={(e) => setWidthPx(e.target.value)}
                placeholder="예: 1920"
                aria-label="가로 해상도 (px)"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium">세로 해상도 (px)</span>
              <Input
                inputMode="numeric"
                value={heightPx}
                onChange={(e) => setHeightPx(e.target.value)}
                placeholder="예: 1080"
                aria-label="세로 해상도 (px)"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium">대각선 크기 (인치)</span>
            <Input
              inputMode="decimal"
              value={diagonalInch}
              onChange={(e) => setDiagonalInch(e.target.value)}
              placeholder="예: 24"
              aria-label="대각선 크기 (인치)"
            />
          </label>
        </div>

        {info === null ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            가로·세로 해상도와 대각선 크기에 0보다 큰 숫자를 입력하세요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{info.ppi}</p>
                <p className="text-xs text-muted-foreground mt-1">PPI</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{info.megapixels}</p>
                <p className="text-xs text-muted-foreground mt-1">메가픽셀</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {info.diagonalPixels.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">대각선 픽셀</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{info.widthInch}&quot;</p>
                <p className="text-xs text-muted-foreground mt-1">가로 크기</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{info.heightInch}&quot;</p>
                <p className="text-xs text-muted-foreground mt-1">세로 크기</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{info.dotPitchMm}</p>
                <p className="text-xs text-muted-foreground mt-1">점 간격 (mm)</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">픽셀 눈금자</p>
                <p className="text-[10px] text-muted-foreground">
                  굵은 눈금 1cm · 가는 눈금 1mm (CSS 기준)
                </p>
              </div>
              <div
                className="h-12 w-full rounded-md border bg-background"
                style={{ backgroundImage: rulerBackground }}
                aria-hidden="true"
              />
              <p className="text-[10px] text-muted-foreground">
                실제 화면 크기는 브라우저·OS 배율 설정에 따라 달라질 수 있습니다.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
