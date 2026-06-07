'use client';

import { useMemo, useState } from 'react';
import { Box, Check, Copy, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Shadow {
  id: number;
  /** 수평 오프셋(px) */
  offsetX: number;
  /** 수직 오프셋(px) */
  offsetY: number;
  /** 흐림 반경(px, 0 이상) */
  blur: number;
  /** 확산 반경(px) */
  spread: number;
  /** #rrggbb hex 색 */
  color: string;
  /** 0~100 알파(%) */
  alpha: number;
  /** 안쪽 그림자 여부 */
  inset: boolean;
}

let shadowIdSeq = 0;
function createShadow(partial: Partial<Omit<Shadow, 'id'>> = {}): Shadow {
  shadowIdSeq += 1;
  return {
    id: shadowIdSeq,
    offsetX: 0,
    offsetY: 8,
    blur: 16,
    spread: 0,
    color: '#000000',
    alpha: 25,
    inset: false,
    ...partial,
  };
}

/** #rrggbb hex 를 0~1 알파와 합쳐 rgba() 문자열로 변환한다. */
function toRgba(hex: string, alphaPercent: number): string {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000';
  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  const alpha = Math.min(1, Math.max(0, alphaPercent / 100));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** 단일 그림자를 box-shadow 조각으로 직렬화한다. */
function shadowToCss(shadow: Shadow): string {
  const parts = [
    `${shadow.offsetX}px`,
    `${shadow.offsetY}px`,
    `${shadow.blur}px`,
    `${shadow.spread}px`,
    toRgba(shadow.color, shadow.alpha),
  ];
  const body = parts.join(' ');
  return shadow.inset ? `inset ${body}` : body;
}

const NUMBER_FIELDS: ReadonlyArray<{ key: 'offsetX' | 'offsetY' | 'blur' | 'spread'; label: string; min: number; max: number }> = [
  { key: 'offsetX', label: 'X 오프셋', min: -100, max: 100 },
  { key: 'offsetY', label: 'Y 오프셋', min: -100, max: 100 },
  { key: 'blur', label: '흐림', min: 0, max: 200 },
  { key: 'spread', label: '확산', min: -100, max: 100 },
];

export default function BoxShadowPage() {
  const [shadows, setShadows] = useState<Shadow[]>(() => [createShadow()]);
  const [copied, setCopied] = useState(false);

  const boxShadowValue = useMemo(
    () => shadows.map(shadowToCss).join(', '),
    [shadows],
  );
  const cssCode = `box-shadow: ${boxShadowValue};`;

  const updateShadow = (id: number, patch: Partial<Omit<Shadow, 'id'>>) => {
    setShadows((prev) => prev.map((shadow) => (shadow.id === id ? { ...shadow, ...patch } : shadow)));
  };

  const addShadow = () => {
    setShadows((prev) => [...prev, createShadow({ offsetY: 4, blur: 8, alpha: 15 })]);
  };

  const removeShadow = (id: number) => {
    setShadows((prev) => (prev.length <= 1 ? prev : prev.filter((shadow) => shadow.id !== id)));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Box className="h-5 w-5 text-primary" aria-hidden />
          CSS 박스 그림자 생성기
        </h1>
        <p className="text-sm text-muted-foreground">오프셋·블러·확산·색을 조절해 box-shadow CSS를 미리보고 복사합니다.</p>
      </header>

      <div className="flex min-h-44 items-center justify-center rounded-xl border bg-[repeating-conic-gradient(theme(colors.muted.DEFAULT)_0%_25%,transparent_0%_50%)] bg-[length:24px_24px] p-8">
        <div
          className="h-28 w-40 rounded-xl bg-card"
          style={{ boxShadow: boxShadowValue }}
          role="img"
          aria-label="박스 그림자 미리보기"
        />
      </div>

      <div className="space-y-3">
        {shadows.map((shadow, index) => (
          <div key={shadow.id} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">그림자 {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeShadow(shadow.id)}
                disabled={shadows.length <= 1}
                aria-label={`그림자 ${index + 1} 삭제`}
                title={shadows.length <= 1 ? '최소 1개의 그림자가 필요합니다' : '삭제'}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {NUMBER_FIELDS.map((field) => (
                <label key={field.key} className="block space-y-1">
                  <span className="text-sm font-medium">
                    {field.label}: {shadow[field.key]}px
                  </span>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    value={shadow[field.key]}
                    onChange={(e) => updateShadow(shadow.id, { [field.key]: Number(e.target.value) })}
                    className="w-full accent-primary"
                    aria-label={`그림자 ${index + 1} ${field.label}`}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={shadow.color}
                onChange={(e) => updateShadow(shadow.id, { color: e.target.value })}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
                aria-label={`그림자 ${index + 1} 색상`}
              />
              <Input
                value={shadow.color}
                onChange={(e) => updateShadow(shadow.id, { color: e.target.value })}
                className="w-28 font-mono"
                spellCheck={false}
                autoComplete="off"
                aria-label={`그림자 ${index + 1} 색상 hex`}
              />
              <label className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">투명도</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={shadow.alpha}
                  onChange={(e) =>
                    updateShadow(shadow.id, {
                      alpha: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-16 font-mono"
                  aria-label={`그림자 ${index + 1} 투명도(%)`}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={shadow.inset}
                  onChange={(e) => updateShadow(shadow.id, { inset: e.target.checked })}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-medium">inset(안쪽)</span>
              </label>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addShadow}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          그림자 추가
        </Button>
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">CSS 코드</span>
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all">
          {cssCode}
        </pre>
      </div>
    </main>
  );
}
