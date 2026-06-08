'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
  VolumeX,
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
  ext: string;
}

/** 비디오 스트림은 무손실 복사하고 오디오 트랙만 제거한다. 컨테이너는 원본 유지. */
function buildArgs(input: string, output: string): string[] {
  return ['-i', input, '-an', '-c:v', 'copy', '-y', output];
}

/** 컨테이너 확장자에 맞는 MIME 타입. 미지원 확장자는 일반 octet-stream. */
function mimeForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'mp4':
    case 'm4v':
    case 'mov':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mkv':
      return 'video/x-matroska';
    case 'avi':
      return 'video/x-msvideo';
    default:
      return 'application/octet-stream';
  }
}

export default function VideoMutePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputName = `in.${ext}`;
    const outputName = `muted.${ext}`;
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

      setStage('음소거 처리');
      await ffmpeg.exec(buildArgs(inputName, outputName));
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, mimeForExt(ext));
      const url = URL.createObjectURL(blob);

      const base = file.name.replace(/\.[^.]+$/, '');
      setResult({ url, blob, size: blob.size, name: `${base}-muted.${ext}`, ext });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '음소거 처리 실패';
      setError(explainFfmpegError(msg, file.size));
      if (ffmpeg) await cleanupFiles(ffmpeg, [inputName, outputName]);
    } finally {
      setBusy(false);
    }
  };

  // 일부 컨테이너(mkv·avi)는 브라우저 <video> 미리보기를 지원하지 않을 수 있음
  const previewable = result
    ? ['mp4', 'm4v', 'mov', 'webm'].includes(result.ext)
    : false;

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
            <VolumeX className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 음소거</h1>
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
            description="음소거할 비디오를 업로드하세요"
            hint="MP4·WEBM·MOV·AVI 등. 오디오만 제거하고 영상은 무손실로 그대로 보존합니다."
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
              <p className="text-sm text-muted-foreground">
                오디오 트랙을 완전히 제거합니다. 비디오 데이터는 재인코딩 없이 그대로
                복사되어 화질 손실과 처리 시간이 거의 없습니다.
              </p>
              <Button onClick={run} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {stage} {progress}%
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-1.5" />
                    음소거 적용
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
            {previewable ? (
              <video
                src={result.url}
                controls
                className="w-full rounded-lg max-h-[400px] bg-black"
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                이 컨테이너 형식은 브라우저 미리보기를 지원하지 않습니다. 다운로드 후
                확인해주세요.
              </p>
            )}
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
            `-an` 옵션으로 오디오 스트림을 빼고 `-c:v copy` 로 비디오를 그대로
            복사합니다. 원본 컨테이너 형식과 화질이 유지됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
