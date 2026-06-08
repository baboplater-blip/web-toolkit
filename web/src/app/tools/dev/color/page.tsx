'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface RGB { r: number; g: number; b: number; a: number }
interface HSL { h: number; s: number; l: number; a: number }

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseAny(input: string): RGB | null {
  const v = input.trim().toLowerCase();
  // hex
  const hex = v.match(/^#?([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6) return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
    if (h.length === 8)
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: parseInt(h.slice(6, 8), 16) / 255,
      };
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean).map((p) => parseFloat(p));
    if (parts.length >= 3) {
      return { r: clamp(parts[0], 0, 255), g: clamp(parts[1], 0, 255), b: clamp(parts[2], 0, 255), a: parts.length === 4 ? clamp(parts[3], 0, 1) : 1 };
    }
  }
  const hsl = v.match(/^hsla?\(([^)]+)\)$/);
  if (hsl) {
    const parts = hsl[1].split(/[,/\s]+/).filter(Boolean).map((p) => parseFloat(p));
    if (parts.length >= 3) {
      return hslToRgb({ h: parts[0], s: parts[1], l: parts[2], a: parts.length === 4 ? clamp(parts[3], 0, 1) : 1 });
    }
  }
  return null;
}

function hslToRgb({ h, s, l, a }: HSL): RGB {
  const S = s / 100;
  const L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = C; g = X; b = 0; }
  else if (h < 120) { r = X; g = C; b = 0; }
  else if (h < 180) { r = 0; g = C; b = X; }
  else if (h < 240) { r = 0; g = X; b = C; }
  else if (h < 300) { r = X; g = 0; b = C; }
  else { r = C; g = 0; b = X; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a };
}

function rgbToHsl({ r, g, b, a }: RGB): HSL {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10, a };
}

function toHex(rgb: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  const base = `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
  return rgb.a < 1 ? `${base}${h(Math.round(rgb.a * 255))}` : base;
}

function toRgbString(rgb: RGB): string {
  return rgb.a < 1
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a.toFixed(2)})`
    : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function toHslString(rgb: RGB): string {
  const hsl = rgbToHsl(rgb);
  return hsl.a < 1
    ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a.toFixed(2)})`
    : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/** sRGB → OKLCH 근사 (Björn Ottosson 공식). 정확도는 디자인 용도 수준. */
function toOklch(rgb: RGB): string {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const r = lin(rgb.r), g = lin(rgb.g), b = lin(rgb.b);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  const Lp = (L * 100).toFixed(1);
  const Cp = C.toFixed(3);
  const Hp = h.toFixed(1);
  return rgb.a < 1
    ? `oklch(${Lp}% ${Cp} ${Hp} / ${rgb.a.toFixed(2)})`
    : `oklch(${Lp}% ${Cp} ${Hp})`;
}

export default function ColorConverterPage() {
  const [input, setInput] = useState('#3b82f6');
  const [rgb, setRgb] = useState<RGB | null>({ r: 59, g: 130, b: 246, a: 1 });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setRgb(parseAny(input));
  }, [input]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  }

  function handleReset() {
    setInput('#3b82f6');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="색상 변환기" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          HEX · RGB · HSL · OKLCH 표기를 상호 변환합니다.
        </p>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">색상 입력</label>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#3b82f6 / rgb(59, 130, 246) / hsl(217, 91%, 60%)"
            className="font-mono" aria-label="색상 입력" />
          <input
            type="color"
            value={rgb ? toHex({ ...rgb, a: 1 }) : '#000000'}
            onChange={(e) => setInput(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-0"
            aria-label="색상 피커"
          />
        </div>
      </div>

      {rgb && (
        <>
          <div
            className="h-24 rounded-xl border"
            style={{
              backgroundColor: toRgbString(rgb),
              backgroundImage:
                rgb.a < 1
                  ? 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)'
                  : undefined,
              backgroundSize: rgb.a < 1 ? '12px 12px' : undefined,
              backgroundPosition: rgb.a < 1 ? '0 0, 0 6px, 6px -6px, -6px 0' : undefined,
            }}
            aria-label="색상 미리보기"
          />

          <div className="space-y-2">
            {(['HEX', 'RGB', 'HSL', 'OKLCH'] as const).map((kind) => {
              const value =
                kind === 'HEX' ? toHex(rgb) : kind === 'RGB' ? toRgbString(rgb) : kind === 'HSL' ? toHslString(rgb) : toOklch(rgb);
              return (
                <div key={kind} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                  <span className="w-16 text-xs font-semibold text-muted-foreground">{kind}</span>
                  <code className="flex-1 truncate text-sm font-mono">{value}</code>
                  <Button variant="ghost" size="sm" onClick={() => copy(kind, value)}>
                    {copied === kind ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!rgb && input.trim() && (
        <p className="text-xs text-destructive">
          색상을 인식하지 못했습니다. 예: <code>#3b82f6</code>, <code>rgb(59, 130, 246)</code>
        </p>
      )}
      </main>
    </div>
  );
}
