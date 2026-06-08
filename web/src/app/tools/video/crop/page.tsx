'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Crop,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  probeVideo,
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

interface CropRect {
  x: string;
  y: string;
  w: string;
  h: string;
}

interface SourceInfo {
  width: number;
  height: number;
}

/**
 * crop 입력값을 검증하고 정수 사각형으로 변환한다.
 * 원본 해상도를 알면 영역이 프레임을 벗어나지 않는지도 검사한다.
 * @returns 유효한 사각형, 또는 사용자에게 보여줄 에러 메시지
 */
function parseCropRect(
  rect: CropRect,
  source: SourceInfo | null,
): { x: number; y: number; w: number; h: number } | string {
  const x = Number(rect.x);
  const y = Number(rect.y);
  const w = Number(rect.w);
  const h = Number(rect.h);

  const values = [x, y, w, h];
  if (values.some((v) => !Number.isFinite(v) || !Number.isInteger(v))) {
    return 'x, y, 너비, 높이는 모두 정수로 입력해주세요.';
  }
  if (x < 0 || y < 0) {
    return 'x, y 좌표는 0 이상이어야 합니다.';
  }
  if (w <= 0 || h <= 0) {
    return '너비와 높이는 1 이상이어야 합니다.';
  }
  if (source) {
    if (x + w > source.width || y + h > source.height) {
      return `잘라낼 영역(${x}+${w}, ${y}+${h})이 원본 해상도(${source.width}×${source.height})를 벗어납니다.`;
    }
  }
  return { x, y, w, h };
}

function buildArgs(
  rect: { x: number; y: number; w: number; h: number },
  input: string,
  output: string,
): string[] {
  return [
    '-i',
    input,
    '-vf',
    `crop=${rect.w}:${rect.h}:${rect.x}:${rect.y}`,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'copy',
    '-y',
    output,
  ];
}

export default function VideoCropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [rect, setRect] = useState<CropRect>({ x: '0', y: '0', w: '', h: '' });
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
    setSource(null);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });

    probeVideo(f)
      .then((meta) => {
        setSource({ width: meta.width, height: meta.height });
        // 입력값이 비어 있으면 전체 프레임을 기본값으로 채워 가이드
        setRect((prev) => ({
          x: prev.x || '0',
          y: prev.y || '0',
          w: prev.w || String(meta.width),
          h: prev.h || String(meta.height),
        }));
      })
      .catch(() => {
        // 메타 로드 실패 시 해상도 가이드만 생략, 처리 자체는 가능
        setSource(null);
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
    setSource(null);
    setRect({ x: '0', y: '0', w: '', h: '' });
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('');
  };

  const run = async () => {
    if (!file) return;
    const parsed = parseCropRect(rect, source);
    if (typeof parsed === 'string') {
      setError(parsed);
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const ext = file.name.split('.').pop() || 'mp4';
    const inputName = `in.${ext}`;
    const outputName = 'cropped.mp4';
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

      setStage('자르기 처리');
      await ffmpeg.exec(buildArgs(parsed, inputName, outputName));
      ffmpeg.off('progress', onProgress);

      const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
      const url = URL.createObjectURL(blob);

      const base = file.name.replace(/\.[^.]+$/, '');
      setResult({ url, blob, size: blob.size, name: `${base}-cropped.mp4` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '자르기 처리 실패';
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
            <Crop className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 자르기 (Crop)</h1>
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
            description="자를 비디오를 업로드하세요"
            hint="MP4·WEBM·MOV·AVI 등. 원하는 사각형 영역만 남기고 잘라냅니다."
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
                    {source && ` · 원본 ${source.width}×${source.height}px`}
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
                잘라낼 영역 (픽셀)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <RectField
                  label="X (좌)"
                  value={rect.x}
                  onChange={(v) => setRect((r) => ({ ...r, x: v }))}
                  max={source?.width}
                />
                <RectField
                  label="Y (상)"
                  value={rect.y}
                  onChange={(v) => setRect((r) => ({ ...r, y: v }))}
                  max={source?.height}
                />
                <RectField
                  label="너비 (W)"
                  value={rect.w}
                  onChange={(v) => setRect((r) => ({ ...r, w: v }))}
                  max={source?.width}
                />
                <RectField
                  label="높이 (H)"
                  value={rect.h}
                  onChange={(v) => setRect((r) => ({ ...r, h: v }))}
                  max={source?.height}
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
                    <Crop className="h-4 w-4 mr-1.5" />
                    자르기 적용
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
            FFmpeg.wasm 의 crop 필터로 지정한 사각형 영역만 남기고 잘라냅니다. 좌상단이
            (0, 0) 기준입니다. 비디오는 H.264 로 재인코딩되고 오디오는 그대로
            복사됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function RectField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </label>
  );
}
