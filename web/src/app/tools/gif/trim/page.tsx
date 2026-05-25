'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
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
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';

export default function GifTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('00:00.00');
  const [endTime, setEndTime] = useState('00:01.00');
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

  /** GIF 길이를 FFmpeg 로 probe */
  const probeGifDuration = async (f: File): Promise<number> => {
    const ffmpeg = await getFFmpeg();
    const name = 'probe.gif';
    await writeFile(ffmpeg, name, f);
    let dur = 0;
    const logHandler = (e: { message: string }) => {
      const m = e.message.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
      if (m) {
        dur = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      }
    };
    ffmpeg.on('log', logHandler);
    try {
      await ffmpeg.exec(['-i', name, '-f', 'null', '-']).catch(() => {
        /* null muxer 는 에러 코드 반환하지만 로그는 파싱됨 */
      });
    } finally {
      ffmpeg.off('log', logHandler);
      await cleanupFiles(ffmpeg, [name]);
    }
    return dur;
  };

  const acceptFile = async (f: File) => {
    if (!/\.gif$/i.test(f.name) && f.type !== 'image/gif') {
      setError('GIF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setProgressText('GIF 길이 분석 중');
    setProcessing(true);
    try {
      const dur = await probeGifDuration(f);
      setDuration(dur);
      setStartTime('00:00.00');
      setEndTime(formatTime(Math.min(dur, 2)));
    } catch {
      setDuration(null);
    } finally {
      setProcessing(false);
      setProgressText('');
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

  const runTrim = async () => {
    if (!file) return;
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) {
      setError('종료 시간이 시작 시간보다 커야 합니다.');
      return;
    }
    const dur = end - start;
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

        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-ss',
          String(start),
          '-t',
          String(dur),
          '-i',
          'input.gif',
          '-vf',
          'palettegen=stats_mode=diff',
          '-y',
          'palette.png',
        ]);

        setProgressText('GIF 인코딩 중');
        await ffmpeg.exec([
          '-ss',
          String(start),
          '-t',
          String(dur),
          '-i',
          'input.gif',
          '-i',
          'palette.png',
          '-lavfi',
          '[0:v][1:v]paletteuse=dither=bayer:bayer_scale=3',
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, '-trimmed', 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '트림 실패');
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
            <Scissors className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 구간 자르기</h1>
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
            description="자를 GIF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                  {duration !== null && ` · 길이 ${formatTime(duration)}`}
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
                <label className="text-xs font-medium mb-1 block">시작 (MM:SS.ms)</label>
                <Input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={processing}
                  className="h-9 font-mono text-xs" aria-label="시작 (MM:SS.ms)" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">종료 (MM:SS.ms)</label>
                <Input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={processing}
                  className="h-9 font-mono text-xs" aria-label="종료 (MM:SS.ms)" />
              </div>
            </div>

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

            <Button onClick={runTrim} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자르는 중...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" />
                  구간 자르기
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
