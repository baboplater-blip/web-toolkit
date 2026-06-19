'use client';

import { useMemo, useState } from 'react';
import { Blend, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** HEX 문자열(#rgb / #rrggbb / 접두사 생략 허용)을 RGB 로 파싱. 실패 시 null. */
function parseHex(raw: string): Rgb | null {
  const match = HEX_RE.exec(raw.trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** RGB 를 #rrggbb 로 직렬화. */
function toHex({ r, g, b }: Rgb): string {
  const part = (value: number) => value.toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** 비율 t(0~1)로 두 색을 채널별 선형 보간. t=0 이면 A, t=1 이면 B. */
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const channel = (ca: number, cb: number) => Math.round(ca * (1 - t) + cb * t);
  return { r: channel(a.r, b.r), g: channel(a.g, b.g), b: channel(a.b, b.b) };
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-16 w-full rounded-lg border"
        style={{ backgroundColor: hex }}
        aria-label={`${label} 색상 미리보기`}
      />
      <span className="font-mono text-xs">{hex}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function ColorMixPage() {
  const [hexA, setHexA] = useState('#ff0000');
  const [hexB, setHexB] = useState('#0000ff');
  const [ratio, setRatio] = useState(50);
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedRgb, setCopiedRgb] = useState(false);

  const rgbA = useMemo(() => parseHex(hexA), [hexA]);
  const rgbB = useMemo(() => parseHex(hexB), [hexB]);

  const mixed = useMemo(() => {
    if (!rgbA || !rgbB) return null;
    return mix(rgbA, rgbB, ratio / 100);
  }, [rgbA, rgbB, ratio]);

  const mixedHex = mixed ? toHex(mixed) : null;
  const mixedRgb = mixed ? `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})` : null;

  async function copyValue(value: string, mark: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(value);
      mark(true);
      window.setTimeout(() => mark(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setHexA('#ff0000');
    setHexB('#0000ff');
    setRatio(50);
    setCopiedHex(false);
    setCopiedRgb(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="색상 혼합" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Blend className="h-4 w-4 text-primary" aria-hidden />
          두 HEX 색을 비율로 섞어 중간 색을 계산합니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-medium">색 A</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rgbA ? toHex(rgbA) : '#000000'}
                onChange={(event) => setHexA(event.target.value)}
                className="h-9 w-10 shrink-0 rounded border bg-transparent"
                aria-label="색 A 선택기"
              />
              <Input
                value={hexA}
                onChange={(event) => setHexA(event.target.value)}
                placeholder="#ff0000"
                aria-label="색 A HEX"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </div>
            {!rgbA && hexA.trim() !== '' && (
              <p className="text-xs text-destructive">유효한 HEX 색상이 아닙니다.</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium">색 B</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rgbB ? toHex(rgbB) : '#000000'}
                onChange={(event) => setHexB(event.target.value)}
                className="h-9 w-10 shrink-0 rounded border bg-transparent"
                aria-label="색 B 선택기"
              />
              <Input
                value={hexB}
                onChange={(event) => setHexB(event.target.value)}
                placeholder="#0000ff"
                aria-label="색 B HEX"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </div>
            {!rgbB && hexB.trim() !== '' && (
              <p className="text-xs text-destructive">유효한 HEX 색상이 아닙니다.</p>
            )}
          </div>
        </div>

        <div className="space-y-1 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">혼합 비율</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              A {100 - ratio}% / B {ratio}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={ratio}
            onChange={(event) => setRatio(Number(event.target.value))}
            className="w-full"
            aria-label="혼합 비율"
          />
        </div>

        {mixed && mixedHex && mixedRgb && rgbA && rgbB && (
          <div className="space-y-4 rounded-xl border bg-card p-4">
            <div className="grid grid-cols-3 gap-3">
              <Swatch label="A" hex={toHex(rgbA)} />
              <Swatch label="혼합" hex={mixedHex} />
              <Swatch label="B" hex={toHex(rgbB)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm">{mixedHex}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyValue(mixedHex, setCopiedHex)}
                  aria-label="HEX 복사"
                >
                  {copiedHex ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedHex ? '복사됨' : 'HEX'}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm">{mixedRgb}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyValue(mixedRgb, setCopiedRgb)}
                  aria-label="rgb 복사"
                >
                  {copiedRgb ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedRgb ? '복사됨' : 'rgb()'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
