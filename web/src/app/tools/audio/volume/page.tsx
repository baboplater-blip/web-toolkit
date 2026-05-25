'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Loader2,
  Music,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type Mode = 'gain' | 'normalize';

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.opus', '.wma'];

export default function AudioVolumePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('gain');
  const [gainDb, setGainDb] = useState(0);
  const [targetLufs, setTargetLufs] = useState(-16);
  const [processing, setProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(null);
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
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const ext = srcFile.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    const inputName = `input.${ext}`;
    const outputName = `output.${ext}`;
    const ffmpeg = await getFFmpeg();
    try {
      await writeFile(ffmpeg, inputName, srcFile);
      const args: string[] = ['-i', inputName];
      if (mode === 'gain') {
        args.push('-af', `volume=${gainDb}dB`);
      } else {
        args.push('-af', `loudnorm=I=${targetLufs}:LRA=11:TP=-1.5`);
      }
      args.push('-y', outputName);
      await ffmpeg.exec(args);
      const mime = srcFile.type || `audio/${ext}`;
      return await readOutput(ffmpeg, outputName, mime);
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const run = async () => {
    setError(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setBatchResults(null);
      setProgressPct(0);
      setProgressText('FFmpeg 로드 중');
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await processOne(rf.file);
            // 출력 확장자 동일 — relativePath 유지
            return { relativePath: rf.relativePath, blob };
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
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리 실패');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
        setProgressText('');
        setProgressPct(0);
      }
      return;
    }

    if (!file) return;
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgressPct(0);
    setProgressText('FFmpeg 로드 중');

    try {
      const ffmpeg = await getFFmpeg();
      const onFfProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgressPct(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onFfProgress);
      try {
        setProgressText(mode === 'gain' ? '볼륨 조정 중' : '라우드니스 정규화 중');
        const blob = await processOne(file);
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
        const suffix = mode === 'gain' ? `${gainDb > 0 ? '+' : ''}${gainDb}dB` : `${targetLufs}LUFS`;
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}-${suffix}.${ext}`,
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 실패');
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

  const optionsBlock = (
    <>
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
            className="w-full" aria-label="dB" />
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
            className="h-9" aria-label="목표 라우드니스 (LUFS)" />
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
    </>
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Volume2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 볼륨 조정</h1>
          </div>
          {(file || allFolderFiles.length > 0) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
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
              description: '볼륨을 조정할 오디오 파일',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'audio/*',
              description: '폴더 안 모든 오디오에 같은 볼륨 설정을 일괄 적용합니다.',
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
            <p className="text-[11px] text-muted-foreground">
              같은 옵션으로 모든 파일을 일괄 처리합니다.
            </p>

            {optionsBlock}

            <Separator />

            <Button onClick={run} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '처리 중...'}
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  폴더 일괄 처리 ({folderFiles.length}개)
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

        {inputMode === 'files' && file && previewUrl && (
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

            {optionsBlock}

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

        {progress && (
          <BatchProgressPanel
            done={progress.done}
            total={progress.total}
            current={progress.current}
            onCancel={cancelRun}
            label="음량 조정 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'volume-adjusted'}
            zipFileName={`${commonRoot(folderFiles) || 'audio'}-volume.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
