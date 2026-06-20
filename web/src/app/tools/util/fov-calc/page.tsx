'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface SensorPreset {
  label: string;
  /** 센서 가로(mm) */
  width: number;
  /** 센서 세로(mm) — 대각 화각 계산용 */
  height: number;
}

const SENSOR_PRESETS: SensorPreset[] = [
  { label: '풀프레임 (36×24)', width: 36, height: 24 },
  { label: 'APS-C (23.6×15.7)', width: 23.6, height: 15.7 },
  { label: 'APS-C 캐논 (22.3×14.9)', width: 22.3, height: 14.9 },
  { label: 'M4/3 (17.3×13)', width: 17.3, height: 13 },
  { label: '1형 (13.2×8.8)', width: 13.2, height: 8.8 },
];

const RAD_TO_DEG = 180 / Math.PI;

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** 화각(도) = 2 · atan(dimension / (2 · focal)) */
function fovDegrees(dimensionMm: number, focalMm: number): number {
  return 2 * Math.atan(dimensionMm / (2 * focalMm)) * RAD_TO_DEG;
}

interface FovResult {
  horizontal: number;
  vertical: number | null;
  diagonal: number | null;
}

export default function FovCalcPage() {
  const [sensorWidth, setSensorWidth] = useState('36');
  const [sensorHeight, setSensorHeight] = useState('24');
  const [focal, setFocal] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<FovResult | null>(() => {
    const width = parseNum(sensorWidth);
    const focalLength = parseNum(focal);
    if (width === null || focalLength === null) return null;
    if (width <= 0 || focalLength <= 0) return null;

    const height = parseNum(sensorHeight);
    const validHeight = height !== null && height > 0 ? height : null;

    const horizontal = fovDegrees(width, focalLength);
    const vertical = validHeight !== null ? fovDegrees(validHeight, focalLength) : null;
    const diagonal =
      validHeight !== null
        ? fovDegrees(Math.sqrt(width * width + validHeight * validHeight), focalLength)
        : null;

    return { horizontal, vertical, diagonal };
  }, [sensorWidth, sensorHeight, focal]);

  const invalid =
    (sensorWidth !== '' && parseNum(sensorWidth) === null) ||
    (sensorHeight !== '' && parseNum(sensorHeight) === null) ||
    (focal !== '' && parseNum(focal) === null);

  function applyPreset(preset: SensorPreset) {
    setSensorWidth(String(preset.width));
    setSensorHeight(String(preset.height));
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`${result.horizontal.toFixed(1)}°`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setSensorWidth('36');
    setSensorHeight('24');
    setFocal('');
  }

  const dirty = focal !== '' || sensorWidth !== '36' || sensorHeight !== '24';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="화각 계산기"
        widthClass="max-w-xl"
        onReset={dirty ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          센서 크기와 초점거리로 화각(FOV)을 계산합니다. 공식: 2·atan(센서 / (2·초점거리)).
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <span className="text-sm font-medium">센서 프리셋</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="센서 프리셋">
              {SENSOR_PRESETS.map((preset) => {
                const active =
                  parseNum(sensorWidth) === preset.width &&
                  parseNum(sensorHeight) === preset.height;
                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    aria-pressed={active}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">센서 가로 (mm)</span>
              <Input
                inputMode="decimal"
                value={sensorWidth}
                onChange={(e) => setSensorWidth(e.target.value)}
                placeholder="예: 36"
                aria-label="센서 가로"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">센서 세로 (mm, 선택)</span>
              <Input
                inputMode="decimal"
                value={sensorHeight}
                onChange={(e) => setSensorHeight(e.target.value)}
                placeholder="예: 24"
                aria-label="센서 세로"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">초점거리 (mm)</span>
            <Input
              inputMode="decimal"
              value={focal}
              onChange={(e) => setFocal(e.target.value)}
              placeholder="예: 50"
              aria-label="초점거리"
            />
          </label>
        </div>

        {invalid && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            0보다 큰 숫자만 입력해 주세요.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">수평 화각</p>
                <p className="text-3xl font-bold tabular-nums">
                  {result.horizontal.toFixed(1)}
                  <span className="ml-0.5 text-base font-normal text-muted-foreground">°</span>
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

            {(result.vertical !== null || result.diagonal !== null) && (
              <div className="grid grid-cols-2 gap-3">
                {result.vertical !== null && (
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground">수직 화각</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {result.vertical.toFixed(1)}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">°</span>
                    </p>
                  </div>
                )}
                {result.diagonal !== null && (
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground">대각 화각</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {result.diagonal.toFixed(1)}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">°</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
