'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Gauge,
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
import {
  VIDEO_ACCEPT,
  explainFfmpegError,
  validateMediaSize,
} from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

interface ResultData {
  url: string;
  blob: Blob;
  size: number;
  name: string;
}

const SPEEDS = [0.25, 0.5, 0.75, 1.5, 2, 3, 4] as const;
type Speed = (typeof SPEEDS)[number];

/**
 * atempo 필터는 한 번에 0.5~2.0 배율만 지원한다.
 * 범위를 벗어나면 0.5/2.0 단계로 분해해 체이닝한다.
 * 예) 4× → atempo=2.0,atempo=2.0 / 0.25× → atempo=0.5,atempo=0.5
 */
function buildAtempoChain(speed: number): string {
  const filters: string[] = [];
  let remaining = speed;

  while (remaining > 2.0 + 1e-9) {
    filters.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5 - 1e-9) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }
  // 남은 배율(0.5~2.0 범위)을 마지막 단계로 추가
  filters.push(`atempo=${Number(remaining.toFixed(6))}`);
  return filters.join(',');
}

function buildArgs(speed: number, input: string, output: string): string[] {
  // setpts 는 PTS 를 1/speed 로 줄여 재생 속도를 speed 배로 만든다.
  const ptsFactor = Number((1 / speed).toFixed(6));
  return [
    '-i',
    input,
    '-filter_complex',
    `[0:v]setpts=${ptsFactor}*PTS[v];[0:a]${buildAtempoChain(speed)}[a]`,
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-y',
    output,
  ];
}

export default function VideoSpeedPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [speed, setSpeed] = useState<Speed>(2);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const accept = useCallback((f: File) => {
    const sizeError = validateMediaSize(f);
    if (sizeError) {
      setError(sizeError);
      return;
    }
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
    const outputName = 'speed.mp4';
    let ffmpeg;
    try {
      setStage('FFmpeg 로딩');
      ffmpeg = await getFFmpeg();
      setStage('파일 준비');
      await writeFile(ffmpeg, inputName, file);

      const onProgress = ({ progress: p }: { progress: number }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };
      ffmpeg.on('progress', onProgress);

      setStage('배속 처리');
      await ffmpeg.exec(buildArgs(speed, inputName, outputName));
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
      const url = URL.createObjectURL(blob);

      const base = file.name.replace(/\.[^.]+$/, '');
      setResult({ url, blob, size: blob.size, name: `${base}-${speed}x.mp4` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '배속 처리 실패';
      setError(explainFfmpegError(msg, file.size));
      if (ffmpeg) await cleanupFiles(ffmpeg, [inputName, outputName]);
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
            <Gauge className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 배속</h1>
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
            description="배속을 바꿀 비디오를 업로드하세요"
            hint="MP4·WEBM·MOV·AVI 등. 0.25×~4× 범위에서 속도와 오디오를 함께 조절합니다."
            onFiles={(picked) => accept(picked[0])}
            onError={setError}
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
                재생 속도
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`flex items-center justify-center rounded-lg border h-12 transition text-sm font-medium ${
                      speed === s
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                    aria-pressed={speed === s}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <Button onClick={run} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {stage} {progress}%
                  </>
                ) : (
                  <>
                    <Gauge className="h-4 w-4 mr-1.5" />
                    {speed}× 적용
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
              onClick={() => triggerDownload(result.blob, result.name)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1.5" />
              다운로드
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            비디오는 setpts 로 타임스탬프를 조절하고, 오디오는 atempo 로 피치를 유지한
            채 속도를 맞춥니다. atempo 는 한 번에 0.5~2.0 배만 지원하므로 그 밖의 배율은
            여러 단계로 체이닝됩니다. 비디오는 H.264, 오디오는 AAC 로 재인코딩됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
