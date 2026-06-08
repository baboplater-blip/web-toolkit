'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Squircle, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

/**
 * roundRect 로 클립한 둥근 모서리 이미지를 캔버스에 그린다.
 * radiusPercent(0~50)는 짧은 변 대비 비율 — 50%면 완전한 알약/원형.
 */
function drawRounded(
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap,
  radiusPercent: number,
) {
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const shortest = Math.min(canvas.width, canvas.height);
  const radius = (radiusPercent / 100) * shortest;

  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
  } else {
    // roundRect 미지원 브라우저 폴백.
    const r = Math.min(radius, canvas.width / 2, canvas.height / 2);
    ctx.moveTo(r, 0);
    ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, r);
    ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, r);
    ctx.arcTo(0, canvas.height, 0, 0, r);
    ctx.arcTo(0, 0, canvas.width, 0, r);
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(bitmap, 0, 0);
}

export default function ImageRoundCornersPage() {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('image');
  const [radius, setRadius] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    try {
      drawRounded(canvas, bitmap, radius);
    } catch (e) {
      // 미리보기 렌더 실패는 비치명적(다운로드 경로에서 별도 처리). 콘솔에만 남긴다.
      console.error('[round-corners] preview render failed', e);
    }
  }, [bitmap, radius]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    try {
      const next = await createImageBitmap(file);
      setBitmap((prev) => {
        prev?.close();
        return next;
      });
      const dot = file.name.lastIndexOf('.');
      setFileName(dot > 0 ? file.name.slice(0, dot) : file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 로드에 실패했습니다.');
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('PNG 인코딩에 실패했습니다.');
        return;
      }
      triggerDownload(blob, `${fileName}-rounded.png`);
    }, 'image/png');
  }

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    setFileName('image');
    setRadius(15);
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="모서리 둥글게" widthClass="max-w-2xl" onReset={bitmap ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지 네 모서리를 둥글게 깎아 배경이 투명한 PNG 로 저장합니다.
        </p>

      {!bitmap && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          onError={setError}
          description="모서리를 둥글게 만들 이미지를 올려주세요."
        />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {bitmap && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="radius" className="text-xs font-medium">
                모서리 반지름
              </label>
              <span className="text-xs text-muted-foreground">
                {radius}% (
                {Math.round((radius / 100) * Math.min(bitmap.width, bitmap.height))}px)
              </span>
            </div>
            <input
              id="radius"
              type="range"
              min={0}
              max={50}
              step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              50% 로 두면 짧은 변이 완전한 반원이 됩니다 (정사각형이면 원형).
            </p>
          </div>

          <div
            className="rounded-lg border p-3"
            style={{
              // 투명 영역이 보이도록 체크무늬 배경.
              backgroundImage:
                'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          >
            <canvas
              ref={canvasRef}
              className="mx-auto h-auto max-h-[55vh] w-full max-w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              투명 PNG 다운로드
            </Button>
            <Button variant="outline" onClick={handleReset}>
              다른 이미지
            </Button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
