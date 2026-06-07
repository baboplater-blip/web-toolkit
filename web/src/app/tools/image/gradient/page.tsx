'use client';

import { useEffect, useRef, useState } from 'react';
import { PaintBucket, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

type GradientType = 'linear' | 'radial';

const DEFAULT_START = '#6366f1';
const DEFAULT_END = '#ec4899';
const MAX_DIMENSION = 4096;

function clampDimension(raw: string, fallback: number): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(MAX_DIMENSION, n);
}

export default function GradientImagePage() {
  const [startColor, setStartColor] = useState(DEFAULT_START);
  const [endColor, setEndColor] = useState(DEFAULT_END);
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState('90');
  const [widthInput, setWidthInput] = useState('1920');
  const [heightInput, setHeightInput] = useState('1080');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function generate() {
    setError(null);
    try {
      const width = clampDimension(widthInput, 1920);
      const height = clampDimension(heightInput, 1080);
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

      let gradient: CanvasGradient;
      if (type === 'radial') {
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.max(width, height) / 2;
        gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      } else {
        // 각도를 선형 그라디언트의 시작·끝 좌표로 변환 (0° = 좌→우, 시계방향)
        const rad = (Number(angle) || 0) * (Math.PI / 180);
        const halfW = width / 2;
        const halfH = height / 2;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);
        const x0 = halfW - dx * halfW;
        const y0 = halfH - dy * halfH;
        const x1 = halfW + dx * halfW;
        const y1 = halfH + dy * halfH;
        gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      }
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('이미지 생성에 실패했습니다.'))),
          'image/png',
        );
      });
      setResultBlob(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.');
    }
  }

  function download() {
    if (!resultBlob) return;
    triggerDownload(resultBlob, `gradient-${type}.png`);
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <PaintBucket className="h-5 w-5 text-primary" aria-hidden />
          그라디언트 이미지 생성
        </h1>
        <p className="text-sm text-muted-foreground">색·방향·크기를 골라 그라디언트 배경 PNG를 생성합니다.</p>
      </header>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium">시작 색</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={startColor}
                onChange={(e) => setStartColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                aria-label="시작 색"
              />
              <span className="font-mono text-xs text-muted-foreground">{startColor}</span>
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium">끝 색</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={endColor}
                onChange={(e) => setEndColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                aria-label="끝 색"
              />
              <span className="font-mono text-xs text-muted-foreground">{endColor}</span>
            </div>
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium">유형</span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['linear', 'radial'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`h-9 rounded-md border text-xs transition-colors ${
                  type === t
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {t === 'linear' ? '선형' : '방사형'}
              </button>
            ))}
          </div>
        </div>

        {type === 'linear' && (
          <label className="block space-y-1">
            <span className="text-xs font-medium">각도 (°)</span>
            <Input
              type="number"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="90"
              aria-label="각도"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium">너비 (px)</span>
            <Input
              type="number"
              min={1}
              max={MAX_DIMENSION}
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
              aria-label="너비"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium">높이 (px)</span>
            <Input
              type="number"
              min={1}
              max={MAX_DIMENSION}
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              aria-label="높이"
            />
          </label>
        </div>

        <Button className="w-full" onClick={generate}>
          <PaintBucket className="h-4 w-4" />
          생성
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {previewUrl && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="그라디언트 결과" className="max-h-[50vh] max-w-full rounded-lg object-contain" />
          </div>
          <Button className="w-full" onClick={download} disabled={!resultBlob}>
            <Download className="h-4 w-4" />
            PNG 다운로드
          </Button>
        </div>
      )}
    </main>
  );
}
