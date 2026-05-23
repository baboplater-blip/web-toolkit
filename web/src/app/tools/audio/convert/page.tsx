'use client';

import { useEffect, useRef, useState } from 'react';
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
import { formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.opus', '.wma'];

type Format = 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a' | 'flac';

const ENCODER: Record<Format, { codec: string; ext: string; mime: string; lossy: boolean }> = {
  mp3: { codec: 'libmp3lame', ext: 'mp3', mime: 'audio/mpeg', lossy: true },
  wav: { codec: 'pcm_s16le', ext: 'wav', mime: 'audio/wav', lossy: false },
  ogg: { codec: 'libvorbis', ext: 'ogg', mime: 'audio/ogg', lossy: true },
  aac: { codec: 'aac', ext: 'aac', mime: 'audio/aac', lossy: true },
  m4a: { codec: 'aac', ext: 'm4a', mime: 'audio/mp4', lossy: true },
  flac: { codec: 'flac', ext: 'flac', mime: 'audio/flac', lossy: false },
};

export default function AudioConvertPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [format, setFormat] = useState<Format>('mp3');
  const [bitrate, setBitrate] = useState(192);
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

  async function convertOne(srcFile: File): Promise<Blob> {
    const enc = ENCODER[format];
    const inputName = `input.${srcFile.name.split('.').pop() ?? 'mp3'}`;
    const outputName = `output.${enc.ext}`;
    const ffmpeg = await getFFmpeg();
    try {
      await writeFile(ffmpeg, inputName, srcFile);
      const args = ['-i', inputName, '-vn', '-c:a', enc.codec];
      if (enc.lossy) args.push('-b:a', `${bitrate}k`);
      args.push('-y', outputName);
      await ffmpeg.exec(args);
      return await readOutput(ffmpeg, outputName, enc.mime);
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const runConvert = async () => {
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    setProgressPct(0);
    setProgressText('FFmpeg 로드 중');
    const enc = ENCODER[format];

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
              const blob = await convertOne(rf.file);
              return { relativePath: replaceExtension(rf.relativePath, enc.ext), blob };
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
        setProgressText('변환 중');
        const blob = await convertOne(file);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}.${enc.ext}`,
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '변환 실패');
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
            <Volume2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 포맷 변환</h1>
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
              description: 'MP3 / WAV / OGG / AAC / M4A / FLAC / OPUS / WMA',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'audio/*',
              description: '폴더 안 모든 오디오를 같은 포맷·비트레이트로 일괄 변환합니다.',
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
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border font-medium ${
                      format === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {ENCODER[format].lossy ? '손실 압축' : '무손실'} · {ENCODER[format].codec}
              </p>
            </div>

            {ENCODER[format].lossy && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">비트레이트</label>
                  <span className="text-xs text-muted-foreground">{bitrate} kbps</span>
                </div>
                <input
                  type="range"
                  min={64}
                  max={320}
                  step={32}
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
            )}

            <Separator />

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '변환 중...'}
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  폴더 일괄 변환 ({folderFiles.length}개)
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
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border font-medium ${
                      format === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {ENCODER[format].lossy ? '손실 압축' : '무손실'} · {ENCODER[format].codec}
              </p>
            </div>

            {ENCODER[format].lossy && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">비트레이트</label>
                  <span className="text-xs text-muted-foreground">{bitrate} kbps</span>
                </div>
                <input
                  type="range"
                  min={64}
                  max={320}
                  step={32}
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
            )}

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

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  변환 중...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  {format.toUpperCase()} 로 변환
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
            <p className="text-xs text-muted-foreground text-center">
              {formatBytes(file.size)} → {formatBytes(result.blob.size)}
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

        {progress && (
          <BatchProgressPanel
            done={progress.done}
            total={progress.total}
            current={progress.current}
            onCancel={cancelRun}
            label="변환 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || `converted-${format}`}
            zipFileName={`${commonRoot(folderFiles) || 'audio'}-${format}.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
