'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Direction = 'frames-to-tc' | 'tc-to-frames';

const FPS_PRESETS = [24, 25, 30, 60] as const;

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function resolveFps(preset: string, custom: string): number | null {
  if (preset !== 'custom') {
    const n = Number(preset);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = parseNum(custom);
  return n !== null && n > 0 ? n : null;
}

/** 총 프레임 수 → HH:MM:SS:FF (정수 fps 기준, 논드롭) */
function framesToTimecode(totalFrames: number, fps: number): string {
  const fpsInt = Math.round(fps);
  const safeFrames = Math.max(0, Math.floor(totalFrames));
  const frames = safeFrames % fpsInt;
  const totalSeconds = Math.floor(safeFrames / fpsInt);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/** HH:MM:SS:FF → 총 프레임 수. 형식·범위 오류는 null */
function timecodeToFrames(tc: string, fps: number): number | null {
  const fpsInt = Math.round(fps);
  const parts = tc.trim().split(':');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => {
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 ? n : null;
  });
  if (nums.some((n) => n === null)) return null;
  const [hours, minutes, seconds, frames] = nums as number[];
  if (minutes > 59 || seconds > 59 || frames >= fpsInt) return null;
  return ((hours * 60 + minutes) * 60 + seconds) * fpsInt + frames;
}

interface FrameResult {
  label: string;
  value: string;
  totalFrames: number;
  totalSeconds: number;
}

export default function FrameTimeCalcPage() {
  const [direction, setDirection] = useState<Direction>('frames-to-tc');
  const [frames, setFrames] = useState('');
  const [timecode, setTimecode] = useState('');
  const [fpsPreset, setFpsPreset] = useState('30');
  const [customFps, setCustomFps] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const fps = resolveFps(fpsPreset, customFps);

  const result = useMemo<FrameResult | null>(() => {
    if (fps === null) return null;

    if (direction === 'frames-to-tc') {
      const totalFrames = parseNum(frames);
      if (totalFrames === null || totalFrames < 0 || !Number.isInteger(totalFrames)) return null;
      return {
        label: '타임코드 (HH:MM:SS:FF)',
        value: framesToTimecode(totalFrames, fps),
        totalFrames,
        totalSeconds: totalFrames / Math.round(fps),
      };
    }

    const totalFrames = timecodeToFrames(timecode, fps);
    if (totalFrames === null) return null;
    return {
      label: '총 프레임 수',
      value: totalFrames.toLocaleString('ko-KR'),
      totalFrames,
      totalSeconds: totalFrames / Math.round(fps),
    };
  }, [direction, frames, timecode, fps]);

  const invalid =
    (direction === 'frames-to-tc' && frames !== '' && parseNum(frames) === null) ||
    (direction === 'tc-to-frames' && timecode !== '' && fps !== null && result === null) ||
    (fpsPreset === 'custom' && customFps !== '' && resolveFps('custom', customFps) === null);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setDirection('frames-to-tc');
    setFrames('');
    setTimecode('');
    setFpsPreset('30');
    setCustomFps('');
  }

  const dirty = frames !== '' || timecode !== '' || customFps !== '';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="프레임/타임코드 변환"
        widthClass="max-w-xl"
        onReset={dirty ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          프레임 수와 fps로 타임코드(HH:MM:SS:FF)를 양방향 변환합니다. (정수 fps · 논드롭 기준)
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex gap-1.5" role="group" aria-label="변환 방향">
            <Button
              type="button"
              variant={direction === 'frames-to-tc' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={direction === 'frames-to-tc'}
              onClick={() => setDirection('frames-to-tc')}
            >
              프레임 → 타임코드
            </Button>
            <Button
              type="button"
              variant={direction === 'tc-to-frames' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={direction === 'tc-to-frames'}
              onClick={() => setDirection('tc-to-frames')}
            >
              타임코드 → 프레임
            </Button>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">fps (프레임/초)</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="fps 프리셋">
              {FPS_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={fpsPreset === String(preset) ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={fpsPreset === String(preset)}
                  onClick={() => setFpsPreset(String(preset))}
                >
                  {preset}
                </Button>
              ))}
              <Button
                type="button"
                variant={fpsPreset === 'custom' ? 'default' : 'outline'}
                size="sm"
                aria-pressed={fpsPreset === 'custom'}
                onClick={() => setFpsPreset('custom')}
              >
                커스텀
              </Button>
            </div>
            {fpsPreset === 'custom' && (
              <Input
                inputMode="decimal"
                value={customFps}
                onChange={(e) => setCustomFps(e.target.value)}
                placeholder="예: 23.976 → 24 로 반올림"
                aria-label="커스텀 fps"
                className="mt-2"
              />
            )}
          </label>

          {direction === 'frames-to-tc' ? (
            <label className="block space-y-1">
              <span className="text-sm font-medium">프레임 수</span>
              <Input
                inputMode="numeric"
                value={frames}
                onChange={(e) => setFrames(e.target.value)}
                placeholder="예: 5400"
                aria-label="프레임 수"
              />
            </label>
          ) : (
            <label className="block space-y-1">
              <span className="text-sm font-medium">타임코드 (HH:MM:SS:FF)</span>
              <Input
                value={timecode}
                onChange={(e) => setTimecode(e.target.value)}
                placeholder="예: 00:03:00:00"
                aria-label="타임코드"
              />
            </label>
          )}
        </div>

        {invalid && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {direction === 'frames-to-tc'
              ? '0 이상의 정수 프레임 수를 입력해 주세요.'
              : 'HH:MM:SS:FF 형식으로 입력하고, 프레임 값은 fps 미만이어야 합니다.'}
          </p>
        )}

        {result && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">{result.label}</p>
              <p className="text-3xl font-bold tabular-nums">{result.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {result.totalFrames.toLocaleString('ko-KR')} 프레임 · {result.totalSeconds.toFixed(3)}초
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="ml-1">{copied ? '복사됨' : copyError ? '복사 실패' : '복사'}</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
