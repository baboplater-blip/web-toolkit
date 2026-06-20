'use client';

import { useMemo, useState } from 'react';
import { Palette, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

const DEFAULT_HEX = '#3b82f6';
const STEP_OPTIONS = [5, 7, 9, 11, 13] as const;
const DEFAULT_STEPS = 9;
// 램프 양 끝 명도(L, 0~1). 가장 어두운 음영 ~ 가장 밝은 하이라이트.
const MIN_LIGHTNESS = 0.1;
const MAX_LIGHTNESS = 0.97;

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

/** #RGB·#RRGGBB HEX 문자열을 RGB 로 파싱한다. 실패 시 null. */
function parseHex(input: string): RGB | null {
  const value = input.trim().replace(/^#/, '').toLowerCase();
  let hex = value;
  if (/^[0-9a-f]{3}$/.test(hex)) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = chroma; g = x; }
  else if (h < 120) { r = x; g = chroma; }
  else if (h < 180) { g = chroma; b = x; }
  else if (h < 240) { g = x; b = chroma; }
  else if (h < 300) { r = x; b = chroma; }
  else { r = chroma; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function toHex({ r, g, b }: RGB): string {
  const part = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

interface Shade { index: number; hex: string; lightness: number; isBase: boolean }

/**
 * 기준 색의 색상(H)·채도(S)를 유지하며 명도(L)를 균등 보간해 음영~하이라이트 램프를 만든다.
 * 기준 색의 명도와 가장 가까운 단계를 base 로 표시한다.
 */
function buildRamp(base: RGB, steps: number): Shade[] {
  const { h, s, l } = rgbToHsl(base);
  let baseIndex = 0;
  let minDiff = Infinity;
  const shades: Shade[] = [];
  // 밝은 단계가 위로 오도록 가장 밝은 L 부터 채운다.
  for (let i = 0; i < steps; i += 1) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const lightness = MAX_LIGHTNESS - t * (MAX_LIGHTNESS - MIN_LIGHTNESS);
    const diff = Math.abs(lightness - l);
    if (diff < minDiff) {
      minDiff = diff;
      baseIndex = i;
    }
    shades.push({ index: i, hex: toHex(hslToRgb({ h, s, l: lightness })), lightness, isBase: false });
  }
  shades[baseIndex] = { ...shades[baseIndex], isBase: true };
  return shades;
}

export default function ColorShadesPage() {
  const [input, setInput] = useState(DEFAULT_HEX);
  const [steps, setSteps] = useState<number>(DEFAULT_STEPS);
  const [copied, setCopied] = useState<number | null>(null);

  const base = useMemo(() => parseHex(input), [input]);
  const shades = useMemo(() => (base ? buildRamp(base, steps) : null), [base, steps]);

  async function copyShade(index: number, hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(index);
      window.setTimeout(() => setCopied((cur) => (cur === index ? null : cur)), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  async function copyAll() {
    if (!shades) return;
    const text = shades.map((shade) => shade.hex).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(-1);
      window.setTimeout(() => setCopied((cur) => (cur === -1 ? null : cur)), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setInput(DEFAULT_HEX);
    setSteps(DEFAULT_STEPS);
    setCopied(null);
  }

  const changed = input !== DEFAULT_HEX || steps !== DEFAULT_STEPS;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="색상 명도 스케일" widthClass="max-w-2xl" onReset={changed ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="h-4 w-4 text-primary" aria-hidden />
          기준 색에서 음영~하이라이트까지 HSL 명도 램프를 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">기준 색 (HEX)</span>
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={DEFAULT_HEX}
                className="font-mono"
                aria-label="기준 HEX 색"
              />
              <input
                type="color"
                value={base ? toHex(base) : '#000000'}
                onChange={(e) => setInput(e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-0"
                aria-label="색상 피커"
              />
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">단계 수</span>
            <select
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="단계 수"
            >
              {STEP_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}단계</option>
              ))}
            </select>
          </label>
          {!base && input.trim() !== '' && (
            <p className="text-xs text-destructive">
              HEX 색을 인식하지 못했습니다. 예: <code>#3b82f6</code> 또는 <code>#39f</code>
            </p>
          )}
        </div>

        {shades && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={copyAll}
                className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs hover:bg-muted"
              >
                {copied === -1 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === -1 ? '복사됨' : '전체 복사'}
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card">
              {shades.map((shade) => (
                <button
                  key={shade.index}
                  type="button"
                  onClick={() => copyShade(shade.index, shade.hex)}
                  className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                  aria-label={`${shade.hex} 복사`}
                >
                  <span className="h-8 w-12 shrink-0 rounded-md border" style={{ backgroundColor: shade.hex }} />
                  <span className="w-12 text-sm font-medium tabular-nums text-muted-foreground">
                    {Math.round(shade.lightness * 100)}%
                  </span>
                  <code className="flex-1 font-mono text-sm uppercase">{shade.hex}</code>
                  {shade.isBase && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] text-primary">기준</span>
                  )}
                  {copied === shade.index ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
