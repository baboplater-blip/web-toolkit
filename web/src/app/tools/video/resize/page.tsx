'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  probeVideo,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { triggerDownload } from '@/lib/tools/file-utils';
import { VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';

interface ResultData {
  url: string;
  size: number;
  name: string;
}

interface SourceInfo {
  width: number;
  height: number;
}

/** 세로 해상도 프리셋 (가로는 비율 유지로 자동 계산) */
const PRESETS: { label: string; height: number }[] = [
  { label: '2160p (4K)', height: 2160 },
  { label: '1440p (QHD)', height: 1440 },
  { label: '1080p (FHD)', height: 1080 },
  { label: '720p (HD)', height: 720 },
  { label: '480p (SD)', height: 480 },
];

const MIN_HEIGHT = 16;
const MAX_HEIGHT = 4320;

type Mode = 'preset' | 'custom';

export default function VideoResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [mode, setMode] = useState<Mode>('preset');
  const [presetHeight, setPresetHeight] = useState(720);
  const [customHeight, setCustomHeight] = useState(720);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const accept = useCallback(async (f: File) => {
    setError(null);
    setResult(null);
    setSource(null);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    try {
      const meta = await probeVideo(f);
      if (meta.width > 0 && meta.height > 0) {
        setSource({ width: meta.width, height: meta.height });
      }
    } catch {
      // 메타데이터 로드 실패는 치명적이지 않음 — 해상도 표시만 생략
    }
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
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('');
  };

  const targetHeight = mode === 'preset' ? presetHeight : customHeight;

  const run = async () => {
    if (!file) return;
    const height = Math.round(targetHeight);
    if (!Number.isFinite(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
      setError(`세로 해상도는 ${MIN_HEIGHT} ~ ${MAX_HEIGHT} 사이여야 합니다.`);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const ext = file.name.split('.').pop() || 'mp4';
    const inputName = `in.${ext}`;
    const outputName = 'resized.mp4';
    try {
      setStage('FFmpeg 로딩');
      const ffmpeg = await getFFmpeg();
      setStage('파일 준비');
      await writeFile(ffmpeg, inputName, file);

      const onProgress = ({ progress: p }: { progress: number }) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };
      ffmpeg.on('progress', onProgress);

      setStage('해상도 변경');
      // scale=-2:{h} → 가로는 비율 유지하며 2의 배수로 맞춤(libx264 요구), 오디오는 복사.
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        `scale=-2:${height}`,
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
      setResult({ url, size: blob.size, name: `${base}-${height}p.mp4` });
      setProgress(100);
      setStage('완료');

      await cleanupFiles(ffmpeg, [inputName, outputName]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '해상도 변경에 실패했습니다.');
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
            <Maximize2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">영상 해상도 변경</h1>
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
            description="해상도를 바꿀 비디오를 업로드하세요"
            hint="가로세로 비율은 유지됩니다. 업로드 용량을 줄이거나 화질을 낮출 때 유용합니다."
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
                    {source && ` · 원본 ${source.width}×${source.height}`}
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
                목표 해상도
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.height}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode('preset');
                      setPresetHeight(preset.height);
                    }}
                    aria-pressed={mode === 'preset' && presetHeight === preset.height}
                    className={`flex h-12 flex-col items-center justify-center rounded-lg border text-xs font-medium transition disabled:opacity-50 ${
                      mode === 'preset' && presetHeight === preset.height
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode('custom')}
                  aria-pressed={mode === 'custom'}
                  className={`flex h-12 flex-col items-center justify-center rounded-lg border text-xs font-medium transition disabled:opacity-50 ${
                    mode === 'custom'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  직접 입력
                </button>
              </div>

              {mode === 'custom' && (
                <label className="block space-y-1">
                  <span className="text-sm">세로 해상도 (px)</span>
                  <Input
                    type="number"
                    min={MIN_HEIGHT}
                    max={MAX_HEIGHT}
                    step={2}
                    value={customHeight}
                    disabled={busy}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                  />
                </label>
              )}

              <Button onClick={run} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {stage} {progress}%
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-1.5" />
                    {Math.round(targetHeight) || MIN_HEIGHT}p 로 변경
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
            FFmpeg.wasm 의 scale 필터로 세로 해상도를 맞추고 가로는 비율을 유지해
            자동 계산합니다(libx264 호환을 위해 2의 배수로 보정). libx264 veryfast·CRF
            23 으로 재인코딩하며 오디오는 그대로 복사합니다. 모든 처리는 브라우저
            안에서 이루어집니다.
          </p>
        </div>
      </main>
    </div>
  );
}
