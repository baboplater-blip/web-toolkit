'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Crop,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  resetFFmpeg,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { explainFfmpegError, validateMediaSize } from '@/lib/tools/media-limits';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function GifCropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<CropBox | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  useEffect(() => {
    if (!origSize || !containerRef.current) return;
    const el = containerRef.current;
    const obs = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const maxH = window.innerHeight * 0.5;
      const r = origSize.w / origSize.h;
      let dw = cw;
      let dh = cw / r;
      if (dh > maxH) {
        dh = maxH;
        dw = dh * r;
      }
      setDisplaySize({ w: dw, h: dh });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [origSize]);

  const scale = origSize && displaySize ? displaySize.w / origSize.w : 1;

  const acceptFile = async (f: File) => {
    if (!/\.gif$/i.test(f.name) && f.type !== 'image/gif') {
      setError('GIF 파일만 업로드 가능합니다.');
      return;
    }
    const sizeError = validateMediaSize(f);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('GIF 로드 실패'));
        i.src = url;
      });
      setFile(f);
      setPreviewUrl(url);
      setOrigSize({ w: img.naturalWidth, h: img.naturalHeight });
      const w0 = Math.round(img.naturalWidth * 0.8);
      const h0 = Math.round(img.naturalHeight * 0.8);
      setBox({
        x: Math.round((img.naturalWidth - w0) / 2),
        y: Math.round((img.naturalHeight - h0) / 2),
        w: w0,
        h: h0,
      });
    } catch (err) {
      URL.revokeObjectURL(url);
      setError(err instanceof Error ? err.message : 'GIF 로드 실패');
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setOrigSize(null);
    setBox(null);
    setResult(null);
    setError(null);
  };

  // 드래그로 박스 이동/크기 조정 (image crop 페이지와 동일 패턴)
  const draggingRef = useRef<null | { mode: 'move' | 'resize'; startX: number; startY: number; orig: CropBox }>(
    null,
  );

  const onBoxPointerDown = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [box],
  );

  const onBoxPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !origSize || !box) return;
      const drag = draggingRef.current;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;

      if (drag.mode === 'move') {
        const nx = Math.max(0, Math.min(origSize.w - drag.orig.w, drag.orig.x + dx));
        const ny = Math.max(0, Math.min(origSize.h - drag.orig.h, drag.orig.y + dy));
        setBox({ ...drag.orig, x: Math.round(nx), y: Math.round(ny) });
      } else {
        let nw = Math.max(20, drag.orig.w + dx);
        let nh = Math.max(20, drag.orig.h + dy);
        nw = Math.min(nw, origSize.w - drag.orig.x);
        nh = Math.min(nh, origSize.h - drag.orig.y);
        setBox({ ...drag.orig, w: Math.round(nw), h: Math.round(nh) });
      }
    },
    [box, origSize, scale],
  );

  const onBoxPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  const runCrop = async () => {
    if (!file || !box) return;
    // FFmpeg crop 필터 좌표 — 짝수 권장하지만 gif는 덜 엄격
    const cropW = Math.max(2, box.w - (box.w % 2));
    const cropH = Math.max(2, box.h - (box.h % 2));
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const created = ['input.gif', 'palette.png', 'output.gif'];
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, 'input.gif', file);

        const vf = `crop=${cropW}:${cropH}:${box.x}:${box.y}`;

        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-vf',
          `${vf},palettegen=stats_mode=diff:reserve_transparent=1`,
          '-y',
          'palette.png',
        ]);

        setProgressText('GIF 인코딩 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-i',
          'palette.png',
          '-lavfi',
          `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128`,
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, '-cropped', 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '자르기 실패';
      const friendly = explainFfmpegError(msg, file.size);
      // explainFfmpegError 가 메시지를 바꿨다면 OOM/abort 패턴 — 싱글턴이
      // 망가졌을 수 있으니 폐기해 다음 도구가 깨끗하게 재로드하도록 한다.
      if (friendly !== msg) resetFFmpeg();
      setError(friendly);
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Crop className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 영역 자르기</h1>
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
            accept="image/gif"
            description="영역을 잘라낼 GIF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && origSize && box && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  원본 {origSize.w}×{origSize.h} · 선택 {box.w}×{box.h}
                </p>
              </div>
            </div>

            <div
              ref={containerRef}
              className="relative rounded-lg border bg-muted overflow-hidden"
              style={displaySize ? { height: displaySize.h } : { minHeight: 200 }}
            >
              {displaySize && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="GIF"
                    className="absolute"
                    style={{
                      width: displaySize.w,
                      height: displaySize.h,
                      left:
                        (containerRef.current?.clientWidth ?? 0) / 2 - displaySize.w / 2,
                      top: 0,
                    }}
                    draggable={false}
                  />
                  <div
                    className="absolute border-2 border-primary bg-primary/20 cursor-move touch-none"
                    style={{
                      left:
                        (containerRef.current?.clientWidth ?? 0) / 2 -
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

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
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
                  <Crop className="h-4 w-4" />
                  선택 영역 자르기
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="결과"
                className="max-w-full max-h-[40vh] object-contain"
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
