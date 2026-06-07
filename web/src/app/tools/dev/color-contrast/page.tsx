'use client';

import { useMemo, useState } from 'react';
import { Contrast } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** #RGB / #RRGGBB hex 문자열을 0~255 RGB 로 파싱한다. 실패 시 null. */
function parseHex(value: string): Rgb | null {
  const cleaned = value.trim().replace(/^#/, '');
  let hex = cleaned;
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    hex = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** RGB 를 항상 #RRGGBB 형태로 정규화한다(컬러 인풋 동기화용). */
function toHexString(rgb: Rgb): string {
  const part = (n: number) => n.toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

/** WCAG 상대 휘도(relative luminance) 계산. */
function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** 두 색의 WCAG 대비비(1~21)를 계산한다. */
function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function Badge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
        pass
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-destructive/40 bg-destructive/5 text-destructive'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs font-semibold uppercase tracking-wider">
        {pass ? '통과' : '실패'}
      </span>
    </div>
  );
}

export default function ColorContrastPage() {
  const [fgInput, setFgInput] = useState('#1a1a1a');
  const [bgInput, setBgInput] = useState('#ffffff');

  const fg = useMemo(() => parseHex(fgInput), [fgInput]);
  const bg = useMemo(() => parseHex(bgInput), [bgInput]);

  const ratio = fg && bg ? contrastRatio(fg, bg) : null;
  const error = !fg || !bg ? '유효한 hex 색상(예: #1a1a1a 또는 #abc)을 입력해 주세요.' : null;

  const fgHex = fg ? toHexString(fg) : '#000000';
  const bgHex = bg ? toHexString(bg) : '#ffffff';

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Contrast className="h-5 w-5 text-primary" aria-hidden />
          색상 대비 검사기
        </h1>
        <p className="text-sm text-muted-foreground">
          두 색의 WCAG 명도 대비비를 계산하고 AA·AAA 통과 여부를 보여줍니다.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium">전경색 (텍스트)</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fgHex}
              onChange={(e) => setFgInput(e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
              aria-label="전경색 선택"
            />
            <Input
              value={fgInput}
              onChange={(e) => setFgInput(e.target.value)}
              placeholder="#1a1a1a"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              aria-label="전경색 hex"
              aria-invalid={!fg}
            />
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium">배경색</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgHex}
              onChange={(e) => setBgInput(e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
              aria-label="배경색 선택"
            />
            <Input
              value={bgInput}
              onChange={(e) => setBgInput(e.target.value)}
              placeholder="#ffffff"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              aria-label="배경색 hex"
              aria-invalid={!bg}
            />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {ratio !== null && (
        <>
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: bgHex, color: fgHex }}
          >
            <p className="text-lg font-semibold">큰 글자 미리보기 (Aa 한글 가나다)</p>
            <p className="text-sm">
              일반 본문 텍스트 미리보기입니다. The quick brown fox jumps over the lazy dog.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">대비비</p>
              <p className="text-2xl font-bold tabular-nums">{ratio.toFixed(2)} : 1</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Badge label="AA 일반 (4.5)" pass={ratio >= 4.5} />
              <Badge label="AA 큰글자 (3.0)" pass={ratio >= 3} />
              <Badge label="AAA 일반 (7.0)" pass={ratio >= 7} />
              <Badge label="AAA 큰글자 (4.5)" pass={ratio >= 4.5} />
            </div>
          </div>
        </>
      )}

      <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
        <p>
          WCAG 2.1 상대 휘도 공식으로 계산합니다. 큰 글자 기준은 18pt(약 24px) 또는 굵은 14pt(약
          18.66px) 이상입니다.
        </p>
      </div>
    </main>
  );
}
