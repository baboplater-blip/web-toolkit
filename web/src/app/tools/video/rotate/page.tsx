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
  RotateCw,
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
import { explainFfmpegError, validateMediaSize, VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

type Transform = 'cw' | 'ccw' | '180' | 'hflip' | 'vflip';

interface ResultData {
  url: string;
  blob: Blob;
  size: number;
  name: string;
}

const TRANSFORM_LABEL: Record<Transform, string> = {
  cw: '90° 시계방향',
  ccw: '90° 반시계방향',
  '180': '180° 뒤집기',
  hflip: '좌우 반전',
  vflip: '상하 반전',
};

function buildArgs(t: Transform, input: string, output: string): string[] {
  const filterMap: Record<Transform, string> = {
    cw: 'transpose=1',
    ccw: 'transpose=2',
    '180': 'transpose=2,transpose=2',
    hflip: 'hflip',
    vflip: 'vflip',
  };
  return [
    '-i',
    input,
    '-vf',
    filterMap[t],
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'copy',
    '-metadata:s:v',
    'rotate=0',
    '-y',
    output,
  ];
}

export default function VideoRotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>('cw');
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
    const outputName = `rotated.mp4`;
    try {
      setStage('FFmpeg 로딩');
      const ffmpeg = await getFFmpeg();
      setStage('파일 준비');
      await writeFile(ffmpeg, inputName, file);

      const onProgress = ({ progress: p }: { progress: number }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };
      ffmpeg.on('progress', onProgress);

      setStage('회전 처리');
      await ffmpeg.exec(buildArgs(transform, inputName, outputName));
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
      const url = URL.createObjectURL(blob);

      const base = file.name.replace(/\.[^.]+$/, '');
      setResult({ url, blob, size: blob.size, name: `${base}-rotated.mp4` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '회전 처리 실패';
      setError(file ? explainFfmpegError(msg, file.size) : msg);
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
            <RotateCw className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 회전</h1>
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
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!file && (
          <FileDropZone
            accept={VIDEO_ACCEPT}
            description="회전할 비디오를 업로드하세요"
            hint="MP4·WEBM·MOV·AVI 등. 세로로 찍힌 영상의 기울기를 바로잡을 때 유용합니다."
            validate={(picked) => validateMediaSize(picked[0])}
            onError={(m) => setError(m)}
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
                변환 종류
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <TransformButton
                  active={transform === 'cw'}
                  onClick={() => setTransform('cw')}
                  icon={<RotateCw className="h-5 w-5" />}
                  label="90° ↻"
                />
                <TransformButton
                  active={transform === 'ccw'}
                  onClick={() => setTransform('ccw')}
                  icon={<RotateCcw className="h-5 w-5" />}
                  label="90° ↺"
                />
                <TransformButton
                  active={transform === '180'}
                  onClick={() => setTransform('180')}
                  icon={<RotateCw className="h-5 w-5 rotate-90" />}
                  label="180°"
                />
                <TransformButton
                  active={transform === 'hflip'}
                  onClick={() => setTransform('hflip')}
                  icon={<FlipHorizontal className="h-5 w-5" />}
                  label="좌우"
                />
                <TransformButton
                  active={transform === 'vflip'}
                  onClick={() => setTransform('vflip')}
                  icon={<FlipVertical className="h-5 w-5" />}
                  label="상하"
                />
              </div>
              <Button onClick={run} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {stage} {progress}%
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4 mr-1.5" />
                    {TRANSFORM_LABEL[transform]} 적용
                  </>
                )}
              </Button>
              {busy && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
            FFmpeg.wasm 의 transpose 필터로 픽셀 단위 회전을 수행합니다. 메타데이터로만
            회전을 표시하는 일부 플레이어와 달리 실제 영상 데이터가 회전되어 모든
            환경에서 일관되게 표시됩니다. 오디오는 그대로 복사됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function TransformButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border h-16 transition ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-background hover:bg-muted'
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
