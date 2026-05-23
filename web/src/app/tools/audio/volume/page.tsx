'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Loader2,
  Music,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Mode = 'gain' | 'normalize';

export default function AudioVolumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('gain');
  const [gainDb, setGainDb] = useState(0);
  const [targetLufs, setTargetLufs] = useState(-16);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(null);

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

  const acceptFile = (f: File) => {
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|ogg|aac|m4a|flac|opus|wma)$/i.test(f.name)) {
      setError('오디오 파일만 업로드 가능합니다.');
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

  const run = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    const inputName = `input.${ext}`;
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

        const args: string[] = ['-i', inputName];

        if (mode === 'gain') {
          args.push('-af', `volume=${gainDb}dB`);
        } else {
          args.push('-af', `loudnorm=I=${targetLufs}:LRA=11:TP=-1.5`);
        }

        args.push('-y', outputName);

        setProgressText(mode === 'gain' ? '볼륨 조정 중' : '라우드니스 정규화 중');
        await ffmpeg.exec(args);

        const mime = file.type || `audio/${ext}`;
        const blob = await readOutput(ffmpeg, outputName, mime);
        const suffix = mode === 'gain' ? `${gainDb > 0 ? '+' : ''}${gainDb}dB` : `${targetLufs}LUFS`;
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}-${suffix}.${ext}`,
        });
      } finally {
        ffmpeg.off('progress', onProgress);
        await cleanupFiles(ffmpeg, [inputName, outputName]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 실패');
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Volume2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 볼륨 조정</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
        {!file && (
          <FileDropZone
            accept="audio/*"
            description="볼륨을 조정할 오디오 파일"
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
              <Music className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <audio src={previewUrl} controls className="w-full" />

            <Separator />

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                모드
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    ['gain', '볼륨 증감 (dB)'],
                    ['normalize', '라우드니스 정규화 (LUFS)'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMode(v)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
                      mode === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'gain' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-medium text-muted-foreground">
                    증감 (dB)
                  </label>
                  <span className="text-xs font-mono font-semibold">
                    {gainDb > 0 ? '+' : ''}
                    {gainDb} dB
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={0.5}
                  value={gainDb}
                  onChange={(e) => setGainDb(Number(e.target.value))}
                  disabled={processing}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                  <span>-30dB (감소)</span>
                  <span>0dB</span>
                  <span>+30dB (증가)</span>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[-10, -3, 0, 3, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGainDb(v)}
                      disabled={processing}
                      className="h-7 text-[10px] rounded-md border bg-background hover:bg-muted"
                    >
                      {v > 0 ? '+' : ''}
                      {v}dB
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                  목표 라우드니스 (LUFS)
                </label>
                <Input
                  type="number"
                  min={-30}
                  max={-5}
                  step={0.5}
                  value={targetLufs}
                  onChange={(e) => setTargetLufs(Number(e.target.value))}
                  disabled={processing}
                  className="h-9"
                />
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {[
                    [-23, 'EBU R128 (TV)'],
                    [-16, '팟캐스트'],
                    [-14, '스트리밍'],
                  ].map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTargetLufs(Number(v))}
                      disabled={processing}
                      className="h-8 text-[10px] rounded-md border bg-background hover:bg-muted"
                    >
                      {v} ({label})
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

            <Button onClick={run} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  적용
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
