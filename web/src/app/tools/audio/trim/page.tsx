'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Loader2,
  Music,
  RotateCcw,
  Scissors,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  formatTime,
  getFFmpeg,
  parseTimeToSeconds,
  probeAudio,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

export default function AudioTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('00:00.00');
  const [endTime, setEndTime] = useState('00:30.00');
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement>(null);

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
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|ogg|aac|m4a|flac|opus|wma)$/i.test(f.name)) {
      setError('오디오 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const info = await probeAudio(f);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setDuration(info.duration);
      setStartTime('00:00.00');
      setEndTime(formatTime(Math.min(info.duration, 30)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '오디오 로드 실패');
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setDuration(null);
    setResult(null);
    setError(null);
  };

  const useCurrent = (setter: (s: string) => void) => {
    if (audioRef.current) setter(formatTime(audioRef.current.currentTime));
  };

  const runTrim = async () => {
    if (!file) return;
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) {
      setError('종료가 시작보다 커야 합니다.');
      return;
    }
    const dur = end - start;

    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    const inputName = `input.${ext}`;
    const outputName = `output.${ext}`;
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, inputName, file);

        const args: string[] = ['-ss', String(start), '-t', String(dur), '-i', inputName];

        const filters: string[] = [];
        if (fadeIn) filters.push(`afade=t=in:st=0:d=1.5`);
        if (fadeOut) filters.push(`afade=t=out:st=${Math.max(0, dur - 1.5)}:d=1.5`);
        if (filters.length > 0) {
          args.push('-af', filters.join(','));
        } else {
          args.push('-c', 'copy');
        }

        args.push('-y', outputName);

        setProgressText('자르는 중');
        await ffmpeg.exec(args);

        const mime = file.type || `audio/${ext}`;
        const blob = await readOutput(ffmpeg, outputName, mime);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}-trimmed.${ext}`,
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inputName, outputName]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '자르기 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const cutDuration = (() => {
    const s = parseTimeToSeconds(startTime);
    const e = parseTimeToSeconds(endTime);
    return Math.max(0, e - s);
  })();

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
            <Scissors className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 자르기</h1>
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
            accept="audio/*"
            description="구간을 지정하여 오디오를 잘라냅니다"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && duration !== null && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Music className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {formatTime(duration)}
                </p>
              </div>
            </div>

            <audio ref={audioRef} src={previewUrl} controls className="w-full" />

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-muted-foreground">시작</label>
                  <button
                    type="button"
                    onClick={() => useCurrent(setStartTime)}
                    disabled={processing}
                    className="text-[10px] text-primary hover:underline"
                  >
                    현재 시점
                  </button>
                </div>
                <Input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={processing}
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-muted-foreground">종료</label>
                  <button
                    type="button"
                    onClick={() => useCurrent(setEndTime)}
                    disabled={processing}
                    className="text-[10px] text-primary hover:underline"
                  >
                    현재 시점
                  </button>
                </div>
                <Input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={processing}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">구간 길이: {cutDuration.toFixed(2)}초</p>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  checked={fadeIn}
                  onChange={(e) => setFadeIn(e.target.checked)}
                  disabled={processing}
                />
                페이드 인 (1.5초)
              </label>
              <label className="flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  checked={fadeOut}
                  onChange={(e) => setFadeOut(e.target.checked)}
                  disabled={processing}
                />
                페이드 아웃 (1.5초)
              </label>
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

            <Button onClick={runTrim} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자르는 중...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" />
                  오디오 자르기
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
            <audio src={result.url} controls className="w-full" />
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
