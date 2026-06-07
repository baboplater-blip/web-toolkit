'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  AudioWaveform,
  Download,
  Loader2,
  Music,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  formatTime,
  getFFmpeg,
  probeAudio,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/file-utils';
import { AUDIO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

interface ResultData {
  blob: Blob;
  url: string;
  fileName: string;
}

const AUDIO_EXT_RE = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|amr|aiff|wma)$/i;
// EBU R128 표준에 가까운 기본값 (스트리밍·팟캐스트 권장치).
const LOUDNORM_FILTER = 'loudnorm=I=-16:TP=-1.5:LRA=11';

export default function AudioNormalizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

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

  const acceptFile = async (picked: File) => {
    if (!picked.type.startsWith('audio/') && !AUDIO_EXT_RE.test(picked.name)) {
      setError('오디오 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const info = await probeAudio(picked);
      setFile(picked);
      setPreviewUrl(URL.createObjectURL(picked));
      setDuration(info.duration);
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
    setProgress(0);
    setProgressText('');
  };

  const run = async () => {
    if (!file) return;
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
      const onProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, inputName, file);

        setProgressText('음량 분석·정규화 중');
        await ffmpeg.exec(['-i', inputName, '-af', LOUDNORM_FILTER, '-y', outputName]);

        const mime = file.type || `audio/${ext}`;
        const blob = await readOutput(ffmpeg, outputName, mime);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}-normalized.${ext}`,
        });
        setProgress(100);
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inputName, outputName]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '음량 정규화 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
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
            <AudioWaveform className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 음량 정규화</h1>
          </div>
          {file && !processing && (
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
            accept={AUDIO_ACCEPT}
            description="음량을 고르게 맞출 오디오를 업로드하세요"
            hint="MP3·WAV·OGG·M4A·FLAC 등. 목표 -16 LUFS(loudnorm)로 정규화합니다."
            onFiles={(picked) => acceptFile(picked[0])}
            onError={setError}
          />
        )}

        {file && previewUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Music className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                  {duration !== null ? ` · ${formatTime(duration)}` : ''}
                </p>
              </div>
            </div>

            <audio src={previewUrl} controls className="w-full" />

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

            <Button onClick={run} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <AudioWaveform className="h-4 w-4" />
                  음량 정규화
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

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            FFmpeg.wasm 의 loudnorm 필터로 EBU R128 기준(통합 -16 LUFS · 트루피크 -1.5 dB · 음량
            범위 11 LU)에 맞춰 음량을 정규화합니다. 들쭉날쭉한 볼륨을 일정하게 고를 때 유용합니다.
            모든 처리는 브라우저 안에서 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
