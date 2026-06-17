'use client';

import { useEffect, useState } from 'react';
import { Download, FileImage, Loader2, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';
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

export default function GifReversePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const acceptFile = (f: File) => {
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
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setProcessing(false);
    setProgress(0);
    setProgressText('');
    setError(null);
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const created = ['input.gif', 'palette.png', 'output.gif'];
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, 'input.gif', file);

        // 역순 프레임에서 팔레트를 생성해야 색이 정확하다.
        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-vf',
          'reverse,palettegen=stats_mode=diff:reserve_transparent=1',
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
          '[0:v]reverse[r];[r][1:v]paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128',
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, '-reversed', 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '역재생 GIF 생성에 실패했습니다.';
      const friendly = explainFfmpegError(msg, file.size);
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
      <ToolHeader title="GIF 거꾸로 재생" onReset={reset} widthClass="max-w-2xl" />

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          GIF 프레임 순서를 뒤집어 역재생 GIF 를 만듭니다.
        </p>

        {!file && (
          <FileDropZone
            accept="image/gif"
            description="거꾸로 재생할 GIF 파일"
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

        {file && previewUrl && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="원본 GIF"
                className="max-h-[30vh] max-w-full object-contain"
              />
            </div>

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
                  <Rewind className="h-4 w-4" />
                  거꾸로 재생 GIF 생성
                </>
              )}
            </Button>

            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
              FFmpeg reverse 필터 — 프레임 순서를 뒤집고 팔레트로 재인코딩
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              결과
            </h2>
            <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="역재생 GIF"
                className="max-h-[40vh] max-w-full object-contain"
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
