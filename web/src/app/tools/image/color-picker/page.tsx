'use client';

import { useEffect, useRef, useState } from 'react';
import { Pipette, Check, Copy } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { loadBitmap } from '@/lib/tools/image-common';

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
  // 클릭마다 getImageData 를 호출하므로 willReadFrequently 로 readback 최적화.
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

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
      const bmp = await loadBitmap(picked);
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setError('Canvas 컨텍스트를 생성할 수 없습니다.');
      return;
    }
    ctxRef.current = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  /** 원본 픽셀 좌표(x,y)의 색을 추출해 현재·최근 목록에 반영. */
  function pickAt(x: number, y: number) {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const color: PickedColor = { hex: toHex(r, g, b), r, g, b };
    setCurrent(color);
    setRecent((prev) => {
      const deduped = prev.filter((c) => c.hex !== color.hex);
      return [color, ...deduped].slice(0, MAX_RECENT);
    });
  }

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 표시 좌표 → 원본 픽셀 좌표 (CSS 스케일 보정)
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    pickAt(x, y);
  }

  // 키보드 접근성: 캔버스 포커스 후 방향키로 추출 지점을 옮기고 Enter/Space 로 추출.
  // 마우스를 못 쓰는 사용자·스크린리더 사용자를 위한 대체 경로.
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  function handleKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 방향키 한 번에 1px, Shift 동반 시 10px 이동.
    const step = event.shiftKey ? 10 : 1;
    let { x, y } = cursor;
    switch (event.key) {
      case 'ArrowLeft':
        x -= step;
        break;
      case 'ArrowRight':
        x += step;
        break;
      case 'ArrowUp':
        y -= step;
        break;
      case 'ArrowDown':
        y += step;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        pickAt(cursor.x, cursor.y);
        return;
      default:
        return;
    }
    event.preventDefault();
    x = Math.max(0, Math.min(canvas.width - 1, x));
    y = Math.max(0, Math.min(canvas.height - 1, y));
    setCursor({ x, y });
    pickAt(x, y);
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

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    ctxRef.current = null;
    setCurrent(null);
    setRecent([]);
    setCopied(null);
    setCursor({ x: 0, y: 0 });
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 색 추출·픽" widthClass="max-w-2xl" onReset={bitmap ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지를 올려 클릭한 지점의 색상 HEX·RGB를 추출합니다.</p>

      {!bitmap && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} maxBytes={50 * 1024 * 1024} />}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {bitmap && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">이미지 위를 클릭하면 해당 픽셀 색상을 추출합니다. 키보드는 캔버스에 포커스한 뒤 방향키로 이동(Shift+방향키 10px), Enter 로 추출합니다.</p>
          <div className="flex items-center justify-center overflow-auto rounded-lg border bg-muted p-3">
            <canvas
              ref={canvasRef}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="img"
              aria-label="색 추출 영역. 클릭하거나, 포커스 후 방향키로 지점을 옮기고 Enter 로 색을 추출합니다. Shift+방향키로 10px씩 이동합니다."
              className="max-h-[50vh] max-w-full cursor-crosshair object-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
    </div>
  );
}
