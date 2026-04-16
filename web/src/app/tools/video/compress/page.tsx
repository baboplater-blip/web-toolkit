'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  probeVideo,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { compressionRatio, formatBytes, renameWithSuffix } from '@/lib/compress/format';

type Preset = 'high' | 'medium' | 'low' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, { crf: number; maxHeight: number; label: string }> =
  {
    high: { crf: 20, maxHeight: 1080, label: '고품질 (1080p, CRF 20)' },
    medium: { crf: 26, maxHeight: 720, label: '균형 (720p, CRF 26)' },
    low: { crf: 30, maxHeight: 480, label: '작은 용량 (480p, CRF 30)' },
  };

export default function VideoCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [preset, setPreset] = useState<Preset>('medium');
  const [crf, setCrf] = useState(26);
  const [maxHeight, setMaxHeight] = useState(720);
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
    if (p !== 'custom') {
      setCrf(PRESETS[p].crf);
      setMaxHeight(PRESETS[p].maxHeight);
    }
  };

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('비디오 파일만 업로드 가능합니다.');
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

  const runCompress = async () => {
    if (!file || !meta) return;
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const ext = 'mp4'; // H.264 재인코딩은 MP4 컨테이너로 통일
    const inputName = `input.${file.name.split('.').pop() ?? 'mp4'}`;
    const outputName = `output.${ext}`;
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress }: { progress: number }) => {
        if (Number.isFinite(progress)) {
          setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      };
      ffmpeg.on('progress', onProgress);
      try {
        await writeFile(ffmpeg, inputName, file);

        // 다운스케일이 필요할 때만 scale 필터 적용
        const needsScale = meta.height > maxHeight;
        const scaleFilter = needsScale ? `scale=-2:${maxHeight}` : null;

        const args: string[] = ['-i', inputName];
        if (scaleFilter) args.push('-vf', scaleFilter);
        args.push(
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          String(crf),
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-movflags',
          '+faststart',
          '-y',
          outputName,
        );

        setProgressText('압축 중');
        await ffmpeg.exec(args);

        const blob = await readOutput(ffmpeg, outputName, 'video/mp4');
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(stripExtension(file.name) + '.mp4', '-compressed', 'mp4'),
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inputName, outputName]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '압축 실패');
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
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Archive className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 압축</h1>
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
            accept="video/*"
            description="해상도·품질을 조정해 비디오 용량을 줄입니다"
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
                  {formatBytes(file.size)} · {meta.width}×{meta.height}
                </p>
              </div>
            </div>

            <video
              src={previewUrl}
              controls
              className="w-full rounded-lg border bg-black max-h-[40vh]"
            />

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">프리셋</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['high', 'medium', 'low', 'custom'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      preset === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {p === 'custom' ? '사용자 정의' : PRESETS[p].label.split(' ')[0]}
                  </button>
                ))}
              </div>
              {preset !== 'custom' && (
                <p className="text-[10px] text-muted-foreground mt-1">{PRESETS[preset].label}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">품질 (CRF)</label>
                <span className="text-xs text-muted-foreground">
                  {crf} ({crf <= 22 ? '고품질' : crf <= 28 ? '보통' : '저품질'})
                </span>
              </div>
              <input
                type="range"
                min={18}
                max={34}
                step={1}
                value={crf}
                onChange={(e) => {
                  setCrf(Number(e.target.value));
                  setPreset('custom');
                }}
                disabled={processing}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">최대 세로 해상도</label>
                <span className="text-xs text-muted-foreground">{maxHeight}p</span>
              </div>
              <input
                type="range"
                min={240}
                max={1080}
                step={60}
                value={maxHeight}
                onChange={(e) => {
                  setMaxHeight(Number(e.target.value));
                  setPreset('custom');
                }}
                disabled={processing}
                className="w-full accent-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                원본이 더 작으면 다운스케일 없이 진행
              </p>
            </div>

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

            <Button onClick={runCompress} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  압축 중...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  비디오 압축
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
            <video src={result.url} controls className="w-full rounded-lg border bg-black max-h-[40vh]" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">원본</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(file.size)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">압축 후</p>
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
            <Button className="w-full" onClick={() => triggerDownload(result.blob, result.fileName)}>
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
