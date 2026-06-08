'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 마지막으로 사용자가 입력한 변 — 반대편을 자동 계산할 기준 */
type LastEdited = 'width' | 'height';

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '21:9', w: 21, h: 9 },
  { label: '1:1', w: 1, h: 1 },
  { label: '3:2', w: 3, h: 2 },
  { label: '9:16', w: 9, h: 16 },
];

function parsePositive(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 소수점 둘째 자리까지, 불필요한 0 제거 */
function formatDimension(n: number): string {
  if (!Number.isFinite(n)) return '';
  return Number(n.toFixed(2)).toString();
}

export default function AspectRatioPage() {
  const [ratioW, setRatioW] = useState('16');
  const [ratioH, setRatioH] = useState('9');
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('');
  const [lastEdited, setLastEdited] = useState<LastEdited>('width');

  const ratio = useMemo(() => {
    const rw = parsePositive(ratioW);
    const rh = parsePositive(ratioH);
    if (rw === null || rh === null) return null;
    return { rw, rh };
  }, [ratioW, ratioH]);

  // 기준 변에서 반대편을 계산. 입력은 표시용 원본을 유지하고 결과만 파생한다.
  const computed = useMemo(() => {
    if (!ratio) return null;
    const { rw, rh } = ratio;

    if (lastEdited === 'width') {
      const w = parsePositive(width);
      if (w === null) return null;
      return { width: w, height: (w * rh) / rw };
    }
    const h = parsePositive(height);
    if (h === null) return null;
    return { width: (h * rw) / rh, height: h };
  }, [ratio, lastEdited, width, height]);

  // 표시 값: 사용자가 마지막으로 만진 칸은 원본 그대로, 반대편은 계산값
  const displayWidth =
    lastEdited === 'width' ? width : computed ? formatDimension(computed.width) : '';
  const displayHeight =
    lastEdited === 'height' ? height : computed ? formatDimension(computed.height) : '';

  function applyPreset(w: number, h: number) {
    setRatioW(String(w));
    setRatioH(String(h));
  }

  function copy() {
    if (computed) {
      navigator.clipboard?.writeText(
        `${formatDimension(computed.width)} × ${formatDimension(computed.height)}`,
      );
    }
  }

  function handleReset() {
    setRatioW('16');
    setRatioH('9');
    setWidth('1920');
    setHeight('');
    setLastEdited('width');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="화면비 계산기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          가로·세로 중 하나를 바꾸면 지정한 화면비(16:9 등)로 나머지를 계산합니다.
        </p>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <span className="text-sm font-medium">화면비 (W:H)</span>
          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              value={ratioW}
              onChange={(e) => setRatioW(e.target.value)}
              placeholder="16"
              aria-label="화면비 가로"
              className="w-20 text-center"
            />
            <span className="text-lg font-semibold text-muted-foreground">:</span>
            <Input
              inputMode="decimal"
              value={ratioH}
              onChange={(e) => setRatioH(e.target.value)}
              placeholder="9"
              aria-label="화면비 세로"
              className="w-20 text-center"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant="outline"
              size="xs"
              onClick={() => applyPreset(p.w, p.h)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">가로 (px)</span>
          <Input
            inputMode="decimal"
            value={displayWidth}
            onChange={(e) => {
              setWidth(e.target.value);
              setLastEdited('width');
            }}
            placeholder="예: 1920"
            aria-label="가로 픽셀"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">세로 (px)</span>
          <Input
            inputMode="decimal"
            value={displayHeight}
            onChange={(e) => {
              setHeight(e.target.value);
              setLastEdited('height');
            }}
            placeholder="예: 1080"
            aria-label="세로 픽셀"
          />
        </label>
      </div>

      {!ratio && (ratioW !== '' || ratioH !== '') && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          화면비는 0보다 큰 숫자로 입력해 주세요.
        </p>
      )}

      {computed && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {ratio ? `${ratioW}:${ratioH}` : ''} 해상도
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {formatDimension(computed.width)} × {formatDimension(computed.height)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>
            복사
          </Button>
        </div>
      )}
      </main>
    </div>
  );
}
