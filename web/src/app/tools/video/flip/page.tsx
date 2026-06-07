'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  FlipHorizontal,
  FlipVertical,
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
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/file-utils';
import { VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

type FlipDir = 'hflip' | 'vflip';

interface ResultData {
  url: string;
  size: number;
  name: string;
}

const FLIP_LABEL: Record<FlipDir, string> = {
  hflip: '좌우 반전',
  vflip: '상하 반전',
};

export default function VideoFlipPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [direction, setDirection] = useState<FlipDir>('hflip');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const accept = useCallback((f: File) => {
    setError(null);
    setResult(null);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('');
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const ext = file.name.split('.').pop() || 'mp4';
    const inputName = `in.${ext}`;
    const outputName = 'flipped.mp4';
    try {
      setStage('FFmpeg 로딩');
      const ffmpeg = await getFFmpeg();
      setStage('파일 준비');
      await writeFile(ffmpeg, inputName, file);

      const onProgress = ({ progress: p }: { progress: number }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };
      ffmpeg.on('progress', onProgress);

      setStage('반전 처리');
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        direction,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'copy',
        '-y',
        outputName,
      ]);
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
      const url = URL.createObjectURL(blob);

      const base = file.name.replace(/\.[^.]+$/, '');
      const suffix = direction === 'hflip' ? 'hflip' : 'vflip';
      setResult({ url, size: blob.size, name: `${base}-${suffix}.mp4` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '반전 처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: 'h-8 w-8',
              })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <FlipHorizontal className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 반전</h1>
          </div>
          {file && !busy && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {!file && (
          <FileDropZone
            accept={VIDEO_ACCEPT}
            description="반전할 비디오를 업로드하세요"
            hint="MP4·WEBM·MOV·AVI 등. 좌우(거울) 또는 상하로 뒤집습니다."
            onFiles={(picked) => accept(picked[0])}
          />
        )}

        {file && (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <FileVideo className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="w-full rounded-lg max-h-[300px] bg-black"
                />
              )}
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                반전 방향
              </h2>
              <fieldset className="grid grid-cols-2 gap-2">
                <legend className="sr-only">반전 방향 선택</legend>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border h-16 transition ${
                    direction === 'hflip'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="flip-direction"
                    value="hflip"
                    checked={direction === 'hflip'}
                    onChange={() => setDirection('hflip')}
                    disabled={busy}
                    className="sr-only"
                  />
                  <FlipHorizontal className="h-5 w-5" aria-hidden />
                  <span className="text-[11px] font-medium">좌우 반전</span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border h-16 transition ${
                    direction === 'vflip'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="flip-direction"
                    value="vflip"
                    checked={direction === 'vflip'}
                    onChange={() => setDirection('vflip')}
                    disabled={busy}
                    className="sr-only"
                  />
                  <FlipVertical className="h-5 w-5" aria-hidden />
                  <span className="text-[11px] font-medium">상하 반전</span>
                </label>
              </fieldset>
              <Button onClick={run} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {stage} {progress}%
                  </>
                ) : (
                  <>
                    <FlipHorizontal className="h-4 w-4 mr-1.5" />
                    {FLIP_LABEL[direction]} 적용
                  </>
                )}
              </Button>
              {busy && (
                <div
                  className="h-1.5 rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-primary transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {formatBytes(result.size)}
              </span>
            </div>
            <Separator />
            <video
              src={result.url}
              controls
              className="w-full rounded-lg max-h-[400px] bg-black"
            />
            <Button
              onClick={() =>
                fetch(result.url)
                  .then((r) => r.blob())
                  .then((b) => triggerDownload(b, result.name))
              }
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1.5" />
              다운로드
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            FFmpeg.wasm 의 hflip·vflip 필터로 영상을 좌우 또는 상하로 뒤집습니다.
            픽셀 단위로 반전되므로 모든 플레이어에서 일관되게 보입니다. 오디오는 그대로
            복사됩니다. 모든 처리는 브라우저 안에서 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
