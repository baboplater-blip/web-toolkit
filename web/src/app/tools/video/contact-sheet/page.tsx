'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileVideo, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  probeVideo,
  resetFFmpeg,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import {
  explainFfmpegError,
  validateMediaSize,
  VIDEO_ACCEPT,
} from '@/lib/tools/media-limits';
import { stripExtension, triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

const MAX_GRID = 10;
/** 합성 캔버스의 셀 한 변 최대 픽셀 — 메모리 폭주 방지. */
const MAX_CELL_WIDTH = 480;
/** 그리드 전체 가장자리·셀 간 여백(px). */
const GAP = 4;

/** ImageBitmap 으로 디코드한 뒤 닫는 헬퍼 (메모리 즉시 회수). */
async function blobToBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

export default function VideoContactSheetPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [bgColor, setBgColor] = useState('#000000');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('비디오 파일만 업로드 가능합니다.');
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
    try {
      const info = await probeVideo(f);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setMeta(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비디오 로드 실패');
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setRows(3);
    setCols(3);
    setBgColor('#000000');
    setProcessing(false);
    setProgress(0);
    setProgressText('');
    setError(null);
    setResult(null);
  };

  const run = async () => {
    if (!file || !meta) return;
    if (meta.duration <= 0 || !Number.isFinite(meta.duration)) {
      setError('비디오 길이를 알 수 없어 균등 추출이 불가능합니다.');
      return;
    }
    setError(null);
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const count = rows * cols;
    const inExt = (file.name.split('.').pop() ?? 'mp4').toLowerCase();
    const inputName = `input.${inExt}`;
    const created: string[] = [inputName];
    const bitmaps: ImageBitmap[] = [];

    try {
      const ffmpeg = await getFFmpeg();
      await writeFile(ffmpeg, inputName, file);

      // 길이를 count+1 구간으로 나눈 중앙 지점에서 프레임을 뽑아 처음·끝 정지화면
      // (검은 프레임 등)을 피하고 고르게 분포시킨다.
      setProgressText('프레임 추출 중');
      for (let i = 0; i < count; i++) {
        const timestamp = (meta.duration * (i + 0.5)) / count;
        const frameName = `frame_${String(i).padStart(3, '0')}.png`;
        // 입력 앞 -ss = 빠른 키프레임 시크. 단일 프레임만 출력.
        await ffmpeg.exec([
          '-ss',
          timestamp.toFixed(3),
          '-i',
          inputName,
          '-frames:v',
          '1',
          '-y',
          frameName,
        ]);
        const data = await ffmpeg.readFile(frameName);
        const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'image/png' });
        bitmaps.push(await blobToBitmap(blob));
        await cleanupFiles(ffmpeg, [frameName]);
        setProgress(Math.round(((i + 1) / count) * 90));
      }

      setProgressText('이미지 합성 중');
      const first = bitmaps[0];
      if (!first) throw new Error('추출된 프레임이 없습니다.');

      // 원본 비율 유지하며 셀 크기 산출.
      const aspect = first.height / first.width;
      const cellWidth = Math.min(MAX_CELL_WIDTH, first.width);
      const cellHeight = Math.round(cellWidth * aspect);

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('캔버스를 찾을 수 없습니다.');
      canvas.width = cols * cellWidth + (cols + 1) * GAP;
      canvas.height = rows * cellHeight + (rows + 1) * GAP;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스를 초기화할 수 없습니다.');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bitmaps.length; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = GAP + c * (cellWidth + GAP);
        const y = GAP + r * (cellHeight + GAP);
        ctx.drawImage(bitmaps[i], x, y, cellWidth, cellHeight);
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('PNG 생성에 실패했습니다.'));
        }, 'image/png');
      });
      setProgress(100);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        fileName: `${stripExtension(file.name)}-contact-sheet.png`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '썸네일 시트 생성에 실패했습니다.';
      const friendly = explainFfmpegError(msg, file.size);
      if (friendly !== msg) resetFFmpeg();
      setError(friendly);
    } finally {
      for (const bmp of bitmaps) bmp.close();
      // 입력 파일 정리 (프레임은 루프 내에서 이미 삭제).
      try {
        const ffmpeg = await getFFmpeg();
        await cleanupFiles(ffmpeg, created);
      } catch {
        /* 정리 실패는 무시 */
      }
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const clampGrid = (v: number) => Math.max(1, Math.min(MAX_GRID, Math.round(v) || 1));

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="비디오 썸네일 시트" onReset={reset} widthClass="max-w-2xl" />

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          영상에서 여러 프레임을 균등 간격으로 추출해 격자 한 장의 이미지로 만듭니다.
        </p>

        {!file && (
          <FileDropZone
            accept={VIDEO_ACCEPT}
            description="썸네일 시트를 만들 비디오 파일"
            onFiles={(files) => acceptFile(files[0])}
            onError={setError}
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

        {file && previewUrl && meta && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <FileVideo className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {meta.width}×{meta.height} ·{' '}
                  {Math.round(meta.duration)}초
                </p>
              </div>
            </div>

            <video
              src={previewUrl}
              controls
              className="max-h-[30vh] w-full rounded-lg border bg-black"
            />

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cs-rows" className="mb-1 block text-xs font-medium">
                  행 (세로)
                </label>
                <Input
                  id="cs-rows"
                  type="number"
                  min={1}
                  max={MAX_GRID}
                  value={rows}
                  onChange={(e) => setRows(clampGrid(Number(e.target.value)))}
                  disabled={processing}
                  className="h-9"
                  aria-label="행 (세로)"
                />
              </div>
              <div>
                <label htmlFor="cs-cols" className="mb-1 block text-xs font-medium">
                  열 (가로)
                </label>
                <Input
                  id="cs-cols"
                  type="number"
                  min={1}
                  max={MAX_GRID}
                  value={cols}
                  onChange={(e) => setCols(clampGrid(Number(e.target.value)))}
                  disabled={processing}
                  className="h-9"
                  aria-label="열 (가로)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cs-bg" className="mb-1 block text-xs font-medium">
                배경 색
              </label>
              <input
                id="cs-bg"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={processing}
                className="h-9 w-full rounded-md border bg-background"
                aria-label="배경 색"
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              {rows} × {cols} = 총 {rows * cols}장 추출
            </p>

            {processing && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            <Button onClick={run} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4" />
                  썸네일 시트 생성 ({rows * cols}장)
                </>
              )}
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" aria-hidden />

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              결과
            </h2>
            <div className="flex items-center justify-center overflow-auto rounded-lg border bg-muted p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="썸네일 시트"
                className="max-h-[50vh] max-w-full object-contain"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
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
