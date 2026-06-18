'use client';

import { useMemo, useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
// 각 스텝의 목표 명도(L, 0~1). Tailwind 스케일과 유사한 곡선.
const TARGET_LIGHTNESS: Record<number, number> = {
  50: 0.97, 100: 0.94, 200: 0.86, 300: 0.76, 400: 0.66,
  500: 0.56, 600: 0.48, 700: 0.39, 800: 0.31, 900: 0.24, 950: 0.16,
};

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** #RGB·#RRGGBB HEX 문자열을 RGB 로 파싱한다. 실패 시 null. */
function parseHex(input: string): RGB | null {
  const v = input.trim().replace(/^#/, '').toLowerCase();
  let hex = v;
  if (/^[0-9a-f]{3}$/.test(hex)) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
  }
  h = h * 60;
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = C; g = X; }
  else if (h < 120) { r = X; g = C; }
  else if (h < 180) { g = C; b = X; }
  else if (h < 240) { g = X; b = C; }
  else if (h < 300) { r = X; b = C; }
  else { r = C; b = X; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

interface Shade { step: number; hex: string; isBase: boolean }

/** 기준 HEX 의 색상(H)·채도(S)를 유지하며 스텝별 목표 명도로 음영 스케일을 만든다. */
function buildScale(base: RGB): Shade[] {
  const { h, s, l } = rgbToHsl(base);
  // 기준 색과 명도가 가장 가까운 스텝을 base 로 표시한다.
  let baseStep: number = STEPS[0];
  let minDiff = Infinity;
  for (const step of STEPS) {
    const diff = Math.abs(TARGET_LIGHTNESS[step] - l);
    if (diff < minDiff) {
      minDiff = diff;
      baseStep = step;
    }
  }
  return STEPS.map((step) => {
    if (step === baseStep) return { step, hex: toHex(base), isBase: true };
    const targetL = TARGET_LIGHTNESS[step];
    // 매우 밝거나 어두운 끝단은 채도를 약간 낮춰 자연스럽게.
    const adjS = clamp(s * (targetL > 0.9 || targetL < 0.2 ? 0.85 : 1), 0, 1);
    return { step, hex: toHex(hslToRgb({ h, s: adjS, l: targetL })), isBase: false };
  });
}

export default function TailwindShadesPage() {
  const [input, setInput] = useState('#3b82f6');
  const [copied, setCopied] = useState<number | null>(null);

  const base = useMemo(() => parseHex(input), [input]);
  const shades = useMemo(() => (base ? buildScale(base) : null), [base]);

  async function copyShade(step: number, hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(step);
      window.setTimeout(() => setCopied((cur) => (cur === step ? null : cur)), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  async function copyAll() {
    if (!shades) return;
    const text = shades.map((s) => `${s.step}: ${s.hex}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(-1);
      window.setTimeout(() => setCopied((cur) => (cur === -1 ? null : cur)), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setInput('#3b82f6');
    setCopied(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Tailwind 색상 음영" widthClass="max-w-2xl" onReset={input !== '#3b82f6' ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="h-4 w-4 text-primary" aria-hidden />
          기준 HEX 색에서 50~950 음영 스케일을 명도 보간으로 생성합니다.
        </p>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium">기준 색 (HEX)</span>
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="#3b82f6"
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
                  key={shade.step}
                  type="button"
                  onClick={() => copyShade(shade.step, shade.hex)}
                  className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                  aria-label={`${shade.step} ${shade.hex} 복사`}
                >
                  <span className="h-8 w-12 shrink-0 rounded-md border" style={{ backgroundColor: shade.hex }} />
                  <span className="w-12 text-sm font-medium tabular-nums">{shade.step}</span>
                  <code className="flex-1 font-mono text-sm uppercase">{shade.hex}</code>
                  {shade.isBase && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] text-primary">기준</span>
                  )}
                  {copied === shade.step ? (
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
