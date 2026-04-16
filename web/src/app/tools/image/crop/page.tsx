'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  canvasToBlob,
  detectFormatFromFile,
  formatExtension,
  loadImageFile,
  type ImageFormat,
  type LoadedImage,
} from '@/lib/tools/image-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

type AspectPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16';

const ASPECT_RATIOS: Record<Exclude<AspectPreset, 'free'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
  '9:16': 9 / 16,
};

interface CropBox {
  /** 원본 픽셀 좌표 */
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ImageCropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [box, setBox] = useState<CropBox | null>(null);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('free');
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; previewUrl: string } | null>(
    null,
  );
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => () => loaded?.cleanup(), [loaded]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.previewUrl);
    };
  }, [result]);

  const applyAspect = useCallback(
    (preset: AspectPreset, current?: CropBox) => {
      if (!loaded || preset === 'free') return current ?? null;
      const ratio = ASPECT_RATIOS[preset];
      const base = current ?? { x: 0, y: 0, w: loaded.width, h: loaded.height };
      const cx = base.x + base.w / 2;
      const cy = base.y + base.h / 2;
      // 긴 변 기준으로 비율 조정
      let w: number;
      let h: number;
      if (base.w / base.h > ratio) {
        h = base.h;
        w = h * ratio;
      } else {
        w = base.w;
        h = w / ratio;
      }
      w = Math.min(w, loaded.width);
      h = Math.min(h, loaded.height);
      let x = cx - w / 2;
      let y = cy - h / 2;
      x = Math.max(0, Math.min(loaded.width - w, x));
      y = Math.max(0, Math.min(loaded.height - h, y));
      return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
    },
    [loaded],
  );

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (result) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
    loaded?.cleanup();
    try {
      const info = await loadImageFile(f);
      setFile(f);
      setLoaded(info);
      setOutputFormat(detectFormatFromFile(f) ?? 'jpeg');
      // 기본 박스: 중앙 80%
      const w0 = Math.round(info.width * 0.8);
      const h0 = Math.round(info.height * 0.8);
      setBox({
        x: Math.round((info.width - w0) / 2),
        y: Math.round((info.height - h0) / 2),
        w: w0,
        h: h0,
      });
      setAspectPreset('free');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
  };

  const reset = () => {
    loaded?.cleanup();
    if (result) URL.revokeObjectURL(result.previewUrl);
    setFile(null);
    setLoaded(null);
    setBox(null);
    setResult(null);
    setError(null);
  };

  // 컨테이너 크기 측정
  useEffect(() => {
    if (!loaded || !imgContainerRef.current) return;
    const el = imgContainerRef.current;
    const obs = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const maxH = window.innerHeight * 0.5;
      const ratio = loaded.width / loaded.height;
      let dw = cw;
      let dh = cw / ratio;
      if (dh > maxH) {
        dh = maxH;
        dw = dh * ratio;
      }
      setDisplaySize({ w: dw, h: dh });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaded]);

  // 드래그로 박스 조정
  const draggingRef = useRef<null | { mode: 'move' | 'resize'; startX: number; startY: number; orig: CropBox }>(
    null,
  );

  const scale = loaded && displaySize ? displaySize.w / loaded.width : 1;

  const onBoxPointerDown = (e: React.PointerEvent) => {
    if (!box) return;
    const target = e.target as HTMLElement;
    const mode = target.dataset.role === 'resize' ? 'resize' : 'move';
    draggingRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...box },
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  };

  const onBoxPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !loaded || !box) return;
    const drag = draggingRef.current;
    const dx = (e.clientX - drag.startX) / scale;
    const dy = (e.clientY - drag.startY) / scale;

    if (drag.mode === 'move') {
      let nx = drag.orig.x + dx;
      let ny = drag.orig.y + dy;
      nx = Math.max(0, Math.min(loaded.width - drag.orig.w, nx));
      ny = Math.max(0, Math.min(loaded.height - drag.orig.h, ny));
      setBox({ ...drag.orig, x: Math.round(nx), y: Math.round(ny) });
    } else {
      // resize 우측-하단 핸들
      let nw = Math.max(20, drag.orig.w + dx);
      let nh = Math.max(20, drag.orig.h + dy);
      if (aspectPreset !== 'free') {
        const ratio = ASPECT_RATIOS[aspectPreset];
        // 가로를 기준으로 맞춤
        nh = nw / ratio;
      }
      nw = Math.min(nw, loaded.width - drag.orig.x);
      nh = Math.min(nh, loaded.height - drag.orig.y);
      setBox({ ...drag.orig, w: Math.round(nw), h: Math.round(nh) });
    }
  };

  const onBoxPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const onAspectChange = (preset: AspectPreset) => {
    setAspectPreset(preset);
    if (preset !== 'free' && box) {
      const next = applyAspect(preset, box);
      if (next) setBox(next);
    }
  };

  const runCrop = async () => {
    if (!file || !loaded || !box) return;
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.previewUrl);
    setResult(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = box.w;
      canvas.height = box.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');
      if (outputFormat === 'jpeg' || outputFormat === 'avif') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, box.w, box.h);
      }
      ctx.drawImage(
        loaded.element,
        box.x,
        box.y,
        box.w,
        box.h,
        0,
        0,
        box.w,
        box.h,
      );
      const blob = await canvasToBlob(canvas, outputFormat, quality / 100);
      const newName = renameWithSuffix(file.name, '-cropped', formatExtension(outputFormat));
      setResult({
        blob,
        fileName: newName,
        previewUrl: URL.createObjectURL(blob),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '자르기 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Scissors className="h-5 w-5" />
            <h1 className="font-semibold text-base">이미지 자르기</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="image/*"
            description="자를 이미지를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && loaded && box && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    원본 {loaded.width}×{loaded.height} · 선택 {box.w}×{box.h}
                  </p>
                </div>
              </div>

              <div
                ref={imgContainerRef}
                className="relative rounded-lg border bg-muted overflow-hidden"
                style={displaySize ? { height: displaySize.h } : { minHeight: 200 }}
              >
                {displaySize && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={loaded.element.src}
                      alt="원본"
                      className="absolute"
                      style={{
                        width: displaySize.w,
                        height: displaySize.h,
                        left: (imgContainerRef.current?.clientWidth ?? 0) / 2 - displaySize.w / 2,
                        top: 0,
                      }}
                      draggable={false}
                    />
                    <div
                      className="absolute bg-transparent border-2 border-primary cursor-move touch-none"
                      style={{
                        left:
                          (imgContainerRef.current?.clientWidth ?? 0) / 2 -
                          displaySize.w / 2 +
                          box.x * scale,
                        top: box.y * scale,
                        width: box.w * scale,
                        height: box.h * scale,
                      }}
                      onPointerDown={onBoxPointerDown}
                      onPointerMove={onBoxPointerMove}
                      onPointerUp={onBoxPointerUp}
                    >
                      <div
                        data-role="resize"
                        className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm cursor-se-resize"
                      />
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                박스를 드래그하여 이동, 오른쪽 아래 핸들로 크기 조정
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">비율</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {(['free', '1:1', '4:3', '16:9', '3:4', '9:16'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onAspectChange(p)}
                      disabled={processing}
                      className={`h-9 text-[11px] rounded-md border transition-colors ${
                        aspectPreset === p
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      {p === 'free' ? '자유' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['jpeg', 'png', 'webp', 'avif'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setOutputFormat(f)}
                      disabled={processing}
                      className={`h-9 text-xs rounded-md border transition-colors ${
                        outputFormat === f
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {outputFormat !== 'png' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">품질</label>
                    <span className="text-xs text-muted-foreground">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={1}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    disabled={processing}
                    className="w-full accent-primary"
                  />
                </div>
              )}

              <Separator />

              <Button onClick={runCrop} disabled={processing} className="w-full">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    자르는 중...
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    자르기 실행
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.previewUrl}
                alt="잘린 이미지"
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.blob.size)}
            </p>
            <Button
              className="w-full"
              onClick={() => triggerDownload(result.blob, result.fileName)}
            >
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
