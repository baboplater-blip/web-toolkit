'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
  Music,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { explainFfmpegError, validateMediaSize, VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import {
  cleanupFiles,
  getFFmpeg,
  probeVideo,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

type Format = 'mp3' | 'wav' | 'aac' | 'ogg';

const ENCODER: Record<Format, { codec: string; ext: string; mime: string }> = {
  mp3: { codec: 'libmp3lame', ext: 'mp3', mime: 'audio/mpeg' },
  wav: { codec: 'pcm_s16le', ext: 'wav', mime: 'audio/wav' },
  aac: { codec: 'aac', ext: 'aac', mime: 'audio/aac' },
  ogg: { codec: 'libvorbis', ext: 'ogg', mime: 'audio/ogg' },
};

export default function VideoToAudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [format, setFormat] = useState<Format>('mp3');
  const [bitrate, setBitrate] = useState(192);
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
    setResult(null);
    setError(null);
  };

  const runExtract = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const enc = ENCODER[format];
    const inputName = `input.${file.name.split('.').pop() ?? 'mp4'}`;
    const outputName = `output.${enc.ext}`;
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
        await writeFile(ffmpeg, inputName, file);

        const args = ['-i', inputName, '-vn', '-c:a', enc.codec];
        if (format !== 'wav') args.push('-b:a', `${bitrate}k`);
        args.push('-y', outputName);

        setProgressText('오디오 추출 중');
        await ffmpeg.exec(args);

        const blob = await readOutput(ffmpeg, outputName, enc.mime);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}.${enc.ext}`,
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inputName, outputName]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오디오 추출 실패';
      // 입력에 오디오 트랙이 없으면 FFmpeg 가 "does not contain any stream" 류로
      // 실패한다 — 일반 실패 대신 원인을 짚어 안내.
      const noAudioTrack =
        /does not contain any stream|output file is empty|Output file #0 does not contain any stream/i.test(
          msg,
        );
      setError(
        noAudioTrack
          ? '이 영상에는 오디오 트랙이 없습니다. 소리가 들어 있는 영상으로 다시 시도해주세요.'
          : file
            ? explainFfmpegError(msg, file.size)
            : msg,
      );
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
            <Music className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 → 오디오 추출</h1>
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
            accept={VIDEO_ACCEPT}
            description="비디오에서 오디오 트랙을 추출합니다"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && meta && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileVideo className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {Math.round(meta.duration)}초
                </p>
              </div>
            </div>

            <video
              src={previewUrl}
              controls
              className="w-full rounded-lg border bg-black max-h-[30vh]"
            />

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['mp3', 'wav', 'aac', 'ogg'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border font-medium ${
                      format === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {format === 'mp3' && 'MP3 (libmp3lame) · 호환성 최고'}
                {format === 'wav' && 'WAV 무손실 · 용량 큼'}
                {format === 'aac' && 'AAC · 애플 생태계'}
                {format === 'ogg' && 'OGG Vorbis · 오픈소스'}
              </p>
            </div>

            {format !== 'wav' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">비트레이트</label>
                  <span className="text-xs text-muted-foreground">{bitrate} kbps</span>
                </div>
                <input
                  type="range"
                  min={64}
                  max={320}
                  step={32}
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary" aria-label="비트레이트" />
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[96, 128, 192, 256].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBitrate(v)}
                      disabled={processing}
                      className="h-7 text-[10px] rounded-md border hover:bg-muted"
                    >
                      {v}k
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            <Button onClick={runExtract} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  추출 중...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4" />
                  {format.toUpperCase()} 추출
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
