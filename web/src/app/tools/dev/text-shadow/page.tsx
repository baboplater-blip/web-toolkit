'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface ShadowLayer {
  /** 수평 오프셋(px) */
  offsetX: number;
  /** 수직 오프셋(px) */
  offsetY: number;
  /** 흐림 반경(px, 0 이상) */
  blur: number;
  /** #rrggbb hex 색 */
  color: string;
  /** 이 레이어 사용 여부 */
  enabled: boolean;
}

const NUMBER_FIELDS: ReadonlyArray<{ key: 'offsetX' | 'offsetY' | 'blur'; label: string; min: number; max: number }> = [
  { key: 'offsetX', label: 'X 오프셋', min: -50, max: 50 },
  { key: 'offsetY', label: 'Y 오프셋', min: -50, max: 50 },
  { key: 'blur', label: '흐림', min: 0, max: 100 },
];

const FIRST_SHADOW: ShadowLayer = { offsetX: 2, offsetY: 2, blur: 4, color: '#000000', enabled: true };
const SECOND_SHADOW: ShadowLayer = { offsetX: -2, offsetY: -2, blur: 4, color: '#3b82f6', enabled: false };

/** 단일 레이어를 text-shadow 조각으로 직렬화한다. */
function layerToCss(layer: ShadowLayer): string {
  return `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.color}`;
}

export default function TextShadowPage() {
  const [first, setFirst] = useState<ShadowLayer>(FIRST_SHADOW);
  const [second, setSecond] = useState<ShadowLayer>(SECOND_SHADOW);
  const [previewText, setPreviewText] = useState('Shadow');
  const [copied, setCopied] = useState(false);

  const textShadowValue = useMemo(() => {
    const parts = [first, second].filter((layer) => layer.enabled).map(layerToCss);
    return parts.join(', ');
  }, [first, second]);

  const cssCode = `text-shadow: ${textShadowValue || 'none'};`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const handleReset = () => {
    setFirst(FIRST_SHADOW);
    setSecond(SECOND_SHADOW);
    setPreviewText('Shadow');
    setCopied(false);
  };

  const renderLayerControls = (
    label: string,
    layer: ShadowLayer,
    setLayer: (next: ShadowLayer) => void,
    toggleable: boolean,
  ) => (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {toggleable && (
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={layer.enabled}
              onChange={(e) => setLayer({ ...layer, enabled: e.target.checked })}
              className="size-4 accent-primary"
            />
            <span className="text-sm font-medium">사용</span>
          </label>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {NUMBER_FIELDS.map((field) => (
          <label key={field.key} className="block space-y-1">
            <span className="text-sm font-medium">
              {field.label}: {layer[field.key]}px
            </span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              value={layer[field.key]}
              onChange={(e) => setLayer({ ...layer, [field.key]: Number(e.target.value) })}
              className="w-full accent-primary"
              aria-label={`${label} ${field.label}`}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={layer.color}
          onChange={(e) => setLayer({ ...layer, color: e.target.value })}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
          aria-label={`${label} 색상`}
        />
        <Input
          value={layer.color}
          onChange={(e) => setLayer({ ...layer, color: e.target.value })}
          className="w-28 font-mono"
          spellCheck={false}
          autoComplete="off"
          aria-label={`${label} 색상 hex`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS text-shadow 생성기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Type className="h-4 w-4 text-primary" aria-hidden />
          오프셋·블러·색으로 텍스트 그림자 CSS를 미리보고 복사합니다.
        </p>

        <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-xl border bg-card p-6">
          <span
            className="text-center text-5xl font-bold break-words"
            style={{ textShadow: textShadowValue || undefined }}
          >
            {previewText || '미리보기'}
          </span>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">미리보기 텍스트</span>
          <Input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="미리보기"
            aria-label="미리보기 텍스트"
          />
        </label>

        {renderLayerControls('그림자 1', first, setFirst, false)}
        {renderLayerControls('그림자 2', second, setSecond, true)}

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
    </div>
  );
}
