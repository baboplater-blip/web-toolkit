'use client';

import { useEffect, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Download,
  FileImage,
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
import { compressionRatio, formatBytes, renameWithSuffix } from '@/lib/compress/format';

type Preset = 'light' | 'medium' | 'strong';

interface PresetConfig {
  maxColors: number;
  frameRate: number;
  scalePct: number;
  dither: string;
}

const PRESETS: Record<Preset, PresetConfig> = {
  light: { maxColors: 256, frameRate: 0, scalePct: 100, dither: 'bayer:bayer_scale=3' },
  medium: { maxColors: 128, frameRate: 0, scalePct: 80, dither: 'bayer:bayer_scale=4' },
  strong: { maxColors: 64, frameRate: 10, scalePct: 60, dither: 'none' },
};

export default function GifOptimizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('medium');
  const [maxColors, setMaxColors] = useState(128);
  const [scalePct, setScalePct] = useState(80);
  const [frameRate, setFrameRate] = useState(0);
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

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const cfg = PRESETS[p];
    setMaxColors(cfg.maxColors);
    setScalePct(cfg.scalePct);
    setFrameRate(cfg.frameRate);
  };

  const acceptFile = (f: File) => {
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
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const runOptimize = async () => {
    if (!file) return;
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

        const vfParts: string[] = [];
        if (frameRate > 0) vfParts.push(`fps=${frameRate}`);
        if (scalePct !== 100) vfParts.push(`scale=iw*${scalePct / 100}:ih*${scalePct / 100}:flags=lanczos`);
        const vfPre = vfParts.join(',') || 'null';

        const cfg = PRESETS[preset];
        setProgressText('팔레트 생성 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-vf',
          `${vfPre},palettegen=max_colors=${maxColors}:stats_mode=diff`,
          '-y',
          'palette.png',
        ]);

        setProgressText('GIF 인코딩 중');
        await ffmpeg.exec([
          '-i',
          'input.gif',
          '-i',
          'palette.png',
          '-lavfi',
          `${vfPre}[x];[x][1:v]paletteuse=dither=${cfg.dither}`,
          '-loop',
          '0',
          '-y',
          'output.gif',
        ]);

        const blob = await readOutput(ffmpeg, 'output.gif', 'image/gif');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(file.name, '-optimized', 'gif'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '최적화 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const reduction = result && file ? compressionRatio(file.size, result.blob.size) : 0;

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
            <Archive className="h-5 w-5" />
            <h1 className="font-semibold text-base">GIF 최적화</h1>
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
            description="용량을 줄일 GIF 를 업로드하세요"
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
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
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

            <div>
              <label className="text-xs font-medium mb-1.5 block">최적화 강도</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['light', '가볍게 (색상 유지)'],
                    ['medium', '보통 (균형)'],
                    ['strong', '강하게 (최대 감소)'],
                  ] as const
                ).map(([p, label]) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    disabled={processing}
                    className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                      preset === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium">색상 수</label>
                  <span className="text-xs text-muted-foreground">{maxColors}</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={256}
                  step={8}
                  value={maxColors}
                  onChange={(e) => setMaxColors(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary" aria-label="색상 수" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium">크기 %</label>
                  <span className="text-xs text-muted-foreground">{scalePct}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={5}
                  value={scalePct}
                  onChange={(e) => setScalePct(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary" aria-label="크기 %" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium">FPS</label>
                  <span className="text-xs text-muted-foreground">
                    {frameRate === 0 ? '원본' : frameRate}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={frameRate}
                  onChange={(e) => setFrameRate(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary" aria-label="FPS" />
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

            <Button onClick={runOptimize} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  최적화 중...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  GIF 최적화
                </>
              )}
            </Button>
          </div>
        )}

        {result && file && (
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
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">원본</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(file.size)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">최적화 후</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.blob.size)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">감소율</p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    reduction > 0 ? 'text-green-500' : 'text-yellow-500'
                  }`}
                >
                  {reduction > 0 ? `-${reduction}%` : '0%'}
                </p>
              </div>
            </div>
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
