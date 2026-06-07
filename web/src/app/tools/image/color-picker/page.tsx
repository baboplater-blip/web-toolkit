'use client';

import { useEffect, useRef, useState } from 'react';
import { Pipette, Check, Copy } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';

interface PickedColor {
  hex: string;
  r: number;
  g: number;
  b: number;
}

const MAX_RECENT = 12;

function toHex(r: number, g: number, b: number): string {
  const part = (n: number) => n.toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

export default function ImageColorPickerPage() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [current, setCurrent] = useState<PickedColor | null>(null);
  const [recent, setRecent] = useState<PickedColor[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);

  async function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setCurrent(null);
    try {
      const bmp = await createImageBitmap(picked);
      bitmap?.close();
      setBitmap(bmp);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드에 실패했습니다.');
    }
  }

  // bitmap 이 준비되면 캔버스를 원본 해상도로 그린다.
  useEffect(() => {
    if (!bitmap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas 컨텍스트를 생성할 수 없습니다.');
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 표시 좌표 → 원본 픽셀 좌표 (CSS 스케일 보정)
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const color: PickedColor = { hex: toHex(r, g, b), r, g, b };
    setCurrent(color);
    setRecent((prev) => {
      const deduped = prev.filter((c) => c.hex !== color.hex);
      return [color, ...deduped].slice(0, MAX_RECENT);
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied((cur) => (cur === text ? null : cur)), 1500);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Pipette className="h-5 w-5 text-primary" aria-hidden />
          이미지 색 추출·픽
        </h1>
        <p className="text-sm text-muted-foreground">이미지를 올려 클릭한 지점의 색상 HEX·RGB를 추출합니다.</p>
      </header>

      {!bitmap && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} />}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {bitmap && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">이미지 위를 클릭하면 해당 픽셀 색상을 추출합니다.</p>
          <div className="flex items-center justify-center overflow-auto rounded-lg border bg-muted p-3">
            <canvas
              ref={canvasRef}
              onClick={handleClick}
              className="max-h-[50vh] max-w-full cursor-crosshair object-contain"
            />
          </div>
        </div>
      )}

      {current && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-14 w-14 shrink-0 rounded-lg border"
              style={{ backgroundColor: current.hex }}
              aria-hidden
            />
            <div className="flex-1 space-y-2">
              <button
                type="button"
                onClick={() => copy(current.hex)}
                className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-mono">{current.hex}</span>
                {copied === current.hex ? (
                  <Check className="h-4 w-4 text-primary" aria-label="복사됨" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" aria-label="HEX 복사" />
                )}
              </button>
              <button
                type="button"
                onClick={() => copy(`rgb(${current.r}, ${current.g}, ${current.b})`)}
                className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-mono">
                  rgb({current.r}, {current.g}, {current.b})
                </span>
                {copied === `rgb(${current.r}, ${current.g}, ${current.b})` ? (
                  <Check className="h-4 w-4 text-primary" aria-label="복사됨" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" aria-label="RGB 복사" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">최근 색</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => copy(c.hex)}
                className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-muted"
                title={`${c.hex} 복사`}
              >
                <span className="h-4 w-4 rounded border" style={{ backgroundColor: c.hex }} aria-hidden />
                <span className="font-mono">{c.hex}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
