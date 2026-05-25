'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

export default function GifResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
  const [targetW, setTargetW] = useState(320);
  const [targetH, setTargetH] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );

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
    if (!/\.gif$/i.test(f.name) && f.type !== 'image/gif') {
      setError('GIF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    // 미리보기 + 크기 파악
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
      setTargetW(Math.round(img.naturalWidth / 2));
      setTargetH(Math.round(img.naturalHeight / 2));
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
    setResult(null);
    setError(null);
  };

  const ratio = origSize ? origSize.w / origSize.h : 1;
  const onWChange = (v: number) => {
    setTargetW(v);
    if (keepRatio && origSize) setTargetH(Math.max(1, Math.round(v / ratio)));
  };
  const onHChange = (v: number) => {
    setTargetH(v);
    if (keepRatio && origSize) setTargetW(Math.max(1, Math.round(v * ratio)));
  };

  const runResize = async () => {
    if (!file) return;
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
        setProgressText('입력 준비');
        await writeFile(ffmpeg, 'input.gif', file);

        const sizeW = Math.max(1, targetW);
        const sizeH = keepRatio ? -1 : Math.max(1, targetH);
        const vf = `scale=${sizeW}:${sizeH}:flags=lanczos`;

        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-vf',
          `${vf},palettegen=stats_mode=diff`,
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
          `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, '-resized', 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '리사이즈 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Maximize2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 리사이즈</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="image/gif"
            description="GIF 파일을 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && origSize && previewUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {origSize.w}×{origSize.h}
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="원본"
                className="max-w-full max-h-[30vh] object-contain"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">가로 (px)</label>
                <Input
                  type="number"
                  min={1}
                  value={targetW}
                  onChange={(e) => onWChange(Math.max(1, Number(e.target.value) || 1))}
                  disabled={processing}
                  className="h-9" aria-label="가로 (px)" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">세로 (px)</label>
                <Input
                  type="number"
                  min={1}
                  value={keepRatio ? Math.round(targetW / ratio) : targetH}
                  onChange={(e) => onHChange(Math.max(1, Number(e.target.value) || 1))}
                  disabled={processing || keepRatio}
                  className="h-9" aria-label="세로 (px)" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={keepRatio}
                onChange={(e) => setKeepRatio(e.target.checked)}
                disabled={processing}
              />
              비율 유지
            </label>

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            <Button onClick={runResize} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  리사이즈 실행
                </>
              )}
            </Button>
          </div>
        )}

        {result && file && (
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
              {formatBytes(file.size)} → {formatBytes(result.blob.size)}
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

