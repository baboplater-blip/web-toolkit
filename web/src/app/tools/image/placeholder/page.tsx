'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize } from '@/lib/tools/image-common';

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_BG = '#cccccc';
const DEFAULT_FG = '#333333';
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 4000;

/** "{W}×{H}" 토큰을 실제 크기로 치환한다. 빈 라벨이면 크기 문자열을 기본값으로 쓴다. */
function resolveLabel(label: string, width: number, height: number): string {
  const trimmed = label.trim();
  const dims = `${width}×${height}`;
  if (trimmed === '') return dims;
  return trimmed.replace(/\{W\}/gi, String(width)).replace(/\{H\}/gi, String(height));
}

/** 사용자 입력을 [MIN, MAX] 정수로 클램프. 빈칸·NaN 은 fallback. */
function clampDimension(raw: string, fallback: number): number {
  const parsed = Math.round(Number(raw));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, parsed));
}

export default function ImagePlaceholderPage() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [fgColor, setFgColor] = useState(DEFAULT_FG);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  function generate(): void {
    setError(null);
    try {
      assertCanvasSize(width, height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      const text = resolveLabel(label, width, height);
      // 글자 크기를 캔버스 짧은 변에 비례시켜 어떤 크기에서도 읽히게 한다.
      const fontSize = Math.max(12, Math.round(Math.min(width, height) / 8));
      ctx.fillStyle = fgColor;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2, width * 0.9);

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('이미지 인코딩에 실패했습니다.');
          return;
        }
        setUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }, 'image/png');
    } catch (e) {
      console.error('[image/placeholder] generate failed', e);
      setError(e instanceof Error ? e.message : '생성에 실패했습니다.');
    }
  }

  function reset(): void {
    setWidth(DEFAULT_WIDTH);
    setHeight(DEFAULT_HEIGHT);
    setBgColor(DEFAULT_BG);
    setFgColor(DEFAULT_FG);
    setLabel('');
    setError(null);
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="플레이스홀더 이미지" widthClass="max-w-2xl" onReset={url ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          크기·색상·텍스트를 지정한 자리표시 이미지를 만듭니다. 라벨에 {'{W}'}·{'{H}'} 를 쓰면 실제 크기로 치환됩니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium">너비 (px)</span>
              <Input
                type="number"
                min={MIN_DIMENSION}
                max={MAX_DIMENSION}
                value={width}
                onChange={(e) => setWidth(clampDimension(e.target.value, DEFAULT_WIDTH))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium">높이 (px)</span>
              <Input
                type="number"
                min={MIN_DIMENSION}
                max={MAX_DIMENSION}
                value={height}
                onChange={(e) => setHeight(clampDimension(e.target.value, DEFAULT_HEIGHT))}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="ph-bg" className="text-xs font-medium">배경색</label>
              <input
                id="ph-bg"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="ph-fg" className="text-xs font-medium">글자색</label>
              <input
                id="ph-fg"
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border bg-background"
              />
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium">라벨 텍스트</span>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`${width}×${height} (비워두면 크기 표시)`}
            />
          </label>

          <Button onClick={generate} className="w-full">생성</Button>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {url && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="생성 결과" className="mx-auto max-w-full rounded-lg border" />
            <a
              href={url}
              download={`placeholder-${width}x${height}.png`}
              className={buttonVariants({ variant: 'default', className: 'w-full' })}
            >
              <Download className="h-4 w-4" aria-hidden /> PNG 다운로드
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
