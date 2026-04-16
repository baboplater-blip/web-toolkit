'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Film,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  probeVideo,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Mode = 'fps' | 'interval' | 'total';
type Format = 'jpeg' | 'png';

export default function ExtractFramesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [mode, setMode] = useState<Mode>('fps');
  const [fps, setFps] = useState(1); // 1 FPS = 초당 1장
  const [interval, setInterval] = useState(1); // 초
  const [total, setTotal] = useState(10);
  const [format, setFormat] = useState<Format>('jpeg');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    count: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('비디오 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setResult(null);
    setError(null);
  };

  const estimatedCount = (() => {
    if (!meta) return 0;
    if (mode === 'fps') return Math.round(meta.duration * fps);
    if (mode === 'interval') return Math.floor(meta.duration / interval);
    return total;
  })();

  const runExtract = async () => {
    if (!file || !meta) return;
    if (estimatedCount > 500) {
      setError(`추출될 프레임이 너무 많습니다 (${estimatedCount}장). 옵션을 조정하세요.`);
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const inputName = `input.${file.name.split('.').pop() ?? 'mp4'}`;
    const pattern = `frame_%04d.${ext}`;
    const created: string[] = [inputName];

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

        const args: string[] = ['-i', inputName];
        if (mode === 'fps') {
          args.push('-vf', `fps=${fps}`);
        } else if (mode === 'interval') {
          args.push('-vf', `fps=1/${interval}`);
        } else {
          // total: 지정 개수만큼 균등 샘플링
          const step = meta.duration / total;
          args.push('-vf', `fps=1/${step}`);
        }
        if (format === 'jpeg') {
          // 2=highest, 31=lowest. quality 100 ≈ 2, 20 ≈ 15
          const q = Math.max(2, Math.round(31 - (quality / 100) * 29));
          args.push('-q:v', String(q));
        }
        args.push('-y', pattern);

        setProgressText('프레임 추출 중');
        await ffmpeg.exec(args);

        // 추출된 파일 수집
        setProgressText('프레임 수집 중');
        const listing = await ffmpeg.listDir('/');
        const frameFiles = listing
          .map((e) => e.name)
          .filter((n) => n.startsWith('frame_') && n.endsWith(`.${ext}`))
          .sort();

        if (frameFiles.length === 0) {
          throw new Error('추출된 프레임이 없습니다.');
        }
        created.push(...frameFiles);

        setProgressText('ZIP 생성 중');
        const zip = new JSZip();
        for (const name of frameFiles) {
          const data = await ffmpeg.readFile(name);
          const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
          zip.file(name, bytes as unknown as Uint8Array);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResult({
          blob: zipBlob,
          fileName: `${stripExtension(file.name)}-frames.zip`,
          count: frameFiles.length,
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '프레임 추출 실패');
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
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Film className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 → 프레임 추출</h1>
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
            description="비디오에서 이미지 프레임을 추출합니다"
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
                  {formatBytes(file.size)} · {meta.width}×{meta.height} ·{' '}
                  {Math.round(meta.duration)}초
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
              <label className="text-xs font-medium mb-1.5 block">추출 방식</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['fps', '초당 N장'],
                    ['interval', 'N초마다'],
                    ['total', '총 N장 균등'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      mode === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {mode === 'fps' && (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">초당 프레임 수</label>
                    <span className="text-xs text-muted-foreground">{fps} FPS</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={30}
                    step={0.1}
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    disabled={processing}
                    className="w-full accent-primary"
                  />
                </>
              )}
              {mode === 'interval' && (
                <>
                  <label className="text-xs font-medium mb-1 block">간격 (초)</label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={interval}
                    onChange={(e) => setInterval(Math.max(0.1, Number(e.target.value) || 0.1))}
                    disabled={processing}
                    className="h-9"
                  />
                </>
              )}
              {mode === 'total' && (
                <>
                  <label className="text-xs font-medium mb-1 block">총 장수</label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={total}
                    onChange={(e) =>
                      setTotal(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                    }
                    disabled={processing}
                    className="h-9"
                  />
                </>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                예상 추출: 약 {estimatedCount}장
              </p>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">포맷</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['jpeg', 'png'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      format === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {format === 'jpeg' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">JPEG 품질</label>
                  <span className="text-xs text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
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
                  <Film className="h-4 w-4" />
                  프레임 추출 ({estimatedCount}장 예상)
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              완료
            </h2>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">추출 프레임</p>
                <p className="text-sm font-semibold mt-0.5">{result.count}장</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">ZIP 크기</p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.blob.size)}</p>
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
