'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  Download,
  Loader2,
  Music,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  cleanupFiles,
  getFFmpeg,
  probeAudio,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { compressionRatio, formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.opus', '.wma'];

type Preset = 'voice' | 'standard' | 'high' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, { bitrate: number; sampleRate: number; label: string }> =
  {
    voice: { bitrate: 64, sampleRate: 22050, label: '음성 (64k, 22kHz, 모노)' },
    standard: { bitrate: 128, sampleRate: 44100, label: '표준 (128k, 44kHz)' },
    high: { bitrate: 192, sampleRate: 44100, label: '고음질 (192k, 44kHz)' },
  };

export default function AudioCompressPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [preset, setPreset] = useState<Preset>('standard');
  const [bitrate, setBitrate] = useState(128);
  const [sampleRate, setSampleRate] = useState(44100);
  const [mono, setMono] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

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
    if (p === 'voice') {
      setBitrate(64);
      setSampleRate(22050);
      setMono(true);
    } else if (p !== 'custom') {
      setBitrate(PRESETS[p].bitrate);
      setSampleRate(PRESETS[p].sampleRate);
      setMono(false);
    }
  };

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|ogg|aac|m4a|flac|opus|wma)$/i.test(f.name)) {
      setError('오디오 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const info = await probeAudio(f);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setDuration(info.duration);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오디오 로드 실패');
    }
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, {
      mimePrefixes: ['audio/'],
      extensions: AUDIO_EXTS,
    });
    if (filtered.length === 0) {
      setError('폴더 안에 오디오 파일이 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setPreviewUrl(null);
    setDuration(null);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function compressOne(srcFile: File): Promise<Blob> {
    const inputName = `input.${srcFile.name.split('.').pop() ?? 'mp3'}`;
    const outputName = 'output.mp3';
    const ffmpeg = await getFFmpeg();
    try {
      await writeFile(ffmpeg, inputName, srcFile);
      const args = [
        '-i',
        inputName,
        '-vn',
        '-c:a',
        'libmp3lame',
        '-b:a',
        `${bitrate}k`,
        '-ar',
        String(sampleRate),
      ];
      if (mono) args.push('-ac', '1');
      args.push('-y', outputName);
      await ffmpeg.exec(args);
      return await readOutput(ffmpeg, outputName, 'audio/mpeg');
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const runCompress = async () => {
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    setProgressPct(0);
    setProgressText('FFmpeg 로드 중');

    try {
      if (inputMode === 'folder') {
        if (folderFiles.length === 0) {
          setError('처리할 파일을 선택하세요.');
          return;
        }
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setCancelling(false);
        setProgress({ done: 0, total: folderFiles.length, current: '' });
        try {
          const results = await runBatch(
            folderFiles,
            async (rf) => {
              const blob = await compressOne(rf.file);
              return { relativePath: replaceExtension(rf.relativePath, 'mp3'), blob };
            },
            {
              concurrency: 1,
              signal: ctrl.signal,
              onProgress: (done, total, path) => {
                setProgress({ done, total, current: path });
              },
            },
          );
          setBatchResults(results);
        } finally {
          abortRef.current = null;
          setProgress(null);
          setCancelling(false);
        }
        return;
      }

      if (!file) return;
      const ffmpeg = await getFFmpeg();
      const onFfProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgressPct(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onFfProgress);
      try {
        setProgressText('압축 중');
        const blob = await compressOne(file);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(`${stripExtension(file.name)}.mp3`, '-compressed', 'mp3'),
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '압축 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgressPct(0);
    }
  };

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

  const reduction = result && file ? compressionRatio(file.size, result.blob.size) : 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Archive className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 압축</h1>
          </div>
          {(file || allFolderFiles.length > 0) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {((inputMode === 'files' && !file) ||
          (inputMode === 'folder' && allFolderFiles.length === 0)) && (
          <DualDropZone
            mode={inputMode}
            onModeChange={(m) => {
              setInputMode(m);
              setError(null);
            }}
            fileProps={{
              accept: 'audio/*',
              description: '비트레이트를 낮춰 오디오 용량을 줄입니다',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'audio/*',
              description: '폴더 안 모든 오디오를 같은 프리셋으로 일괄 압축합니다.',
              onFolder: onFolderPicked,
            }}
          />
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <FolderPreviewPanel
            files={allFolderFiles}
            onSelectionChange={setFolderFiles}
            fileKindLabel="오디오"
          />
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">프리셋</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['voice', 'standard', 'high', 'custom'] as const).map((p) => (
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
                    {p === 'voice' && '음성'}
                    {p === 'standard' && '표준'}
                    {p === 'high' && '고음질'}
                    {p === 'custom' && '사용자'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {bitrate} kbps · {sampleRate / 1000} kHz {mono ? '· 모노' : ''}
              </p>
            </div>

            <Separator />

            <Button onClick={runCompress} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '압축 중...'}
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  폴더 일괄 압축 ({folderFiles.length}개)
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewUrl && duration !== null && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Music className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {Math.round(duration)}초
                </p>
              </div>
            </div>

            <audio src={previewUrl} controls className="w-full" />

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">프리셋</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['voice', 'standard', 'high', 'custom'] as const).map((p) => (
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
                    {p === 'voice' && '음성'}
                    {p === 'standard' && '표준'}
                    {p === 'high' && '고음질'}
                    {p === 'custom' && '사용자 정의'}
                  </button>
                ))}
              </div>
              {preset !== 'custom' && (
                <p className="text-[10px] text-muted-foreground mt-1">{PRESETS[preset].label}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">비트레이트</label>
                <span className="text-xs text-muted-foreground">{bitrate} kbps</span>
              </div>
              <input
                type="range"
                min={32}
                max={320}
                step={16}
                value={bitrate}
                onChange={(e) => {
                  setBitrate(Number(e.target.value));
                  setPreset('custom');
                }}
                disabled={processing}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">샘플레이트</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[22050, 32000, 44100, 48000].map((sr) => (
                  <button
                    key={sr}
                    type="button"
                    onClick={() => {
                      setSampleRate(sr);
                      setPreset('custom');
                    }}
                    disabled={processing}
                    className={`h-8 text-[11px] rounded-md border ${
                      sampleRate === sr
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {sr / 1000} kHz
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={mono}
                onChange={(e) => {
                  setMono(e.target.checked);
                  setPreset('custom');
                }}
                disabled={processing}
              />
              모노로 변환 (추가 50% 감소)
            </label>

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
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
                  오디오 압축
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
            <audio src={result.url} controls className="w-full" />
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
            <Button
              className="w-full"
              onClick={() => triggerDownload(result.blob, result.fileName)}
            >
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}

        {progress && (
          <BatchProgressPanel
            done={progress.done}
            total={progress.total}
            current={progress.current}
            onCancel={cancelRun}
            label="압축 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'compressed'}
            zipFileName={`${commonRoot(folderFiles) || 'audio'}-compressed-mp3.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
