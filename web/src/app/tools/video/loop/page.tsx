'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
  Repeat,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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

interface ResultData {
  url: string;
  blob: Blob;
  size: number;
  name: string;
}

const MIN_COUNT = 2;
const MAX_COUNT = 50;

/** 컨테이너 확장자별 MIME 타입 (미리보기·다운로드용) */
function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
  };
  return map[ext.toLowerCase()] ?? 'video/mp4';
}

export default function VideoLoopPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [count, setCount] = useState(2);
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
    const repeat = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count)));
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const inputName = `in.${ext}`;
    const outputName = `looped.${ext}`;
    const outMime = mimeForExt(ext);
    try {
      setStage('FFmpeg 로딩');
      const ffmpeg = await getFFmpeg();
      setStage('파일 준비');
      await writeFile(ffmpeg, inputName, file);

      const onProgress = ({ progress: p }: { progress: number }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };
      ffmpeg.on('progress', onProgress);

      setStage(`${repeat}회 반복`);
      // -stream_loop {n-1} 로 입력을 n회 재생, -c copy 로 재인코딩 없이 빠르게 이어붙임.
      await ffmpeg.exec([
        '-stream_loop',
        String(repeat - 1),
        '-i',
        inputName,
        '-c',
        'copy',
        '-y',
        outputName,
      ]);
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, outMime);
      const url = URL.createObjectURL(blob);

      const base = file.name.replace(/\.[^.]+$/, '');
      setResult({ url, blob, size: blob.size, name: `${base}-x${repeat}.${ext}` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '반복 처리에 실패했습니다.');
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
            <Repeat className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 반복 이어붙임</h1>
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
            description="반복할 비디오를 업로드하세요"
            hint="코덱을 그대로 복사해 재인코딩 없이 빠르게 이어붙입니다. 원본 컨테이너가 유지됩니다."
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
                반복 횟수
              </h2>
              <label className="block space-y-1">
                <span className="text-sm">총 재생 횟수 (2 ~ 50)</span>
                <Input
                  type="number"
                  min={MIN_COUNT}
                  max={MAX_COUNT}
                  step={1}
                  value={count}
                  disabled={busy}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </label>
              <p className="text-[11px] text-muted-foreground">
                원본을 {Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count) || MIN_COUNT))}
                회 이어붙입니다.
              </p>
              <Button onClick={run} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {stage} {progress}%
                  </>
                ) : (
                  <>
                    <Repeat className="h-4 w-4 mr-1.5" />
                    반복 적용
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
            -stream_loop 으로 입력을 여러 번 재생하고 -c copy 로 코덱을 그대로
            복사하므로 재인코딩 없이 빠르고 화질 손실이 없습니다. 원본 컨테이너 형식이
            유지됩니다. 모든 처리는 브라우저 안에서 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
