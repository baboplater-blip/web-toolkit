'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
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
  probeVideo,
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

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.flv', '.wmv'];

type TargetFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv';

const FORMAT_MIME: Record<TargetFormat, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
};

/** 각 포맷별 기본 인코더 인자 */
function buildArgs(format: TargetFormat, crf: number): string[] {
  if (format === 'mp4' || format === 'mov' || format === 'mkv') {
    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-c:a', 'aac', '-b:a', '128k'];
  }
  if (format === 'webm') {
    return ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', '-b:a', '96k'];
  }
  // avi — 호환성 우선
  return ['-c:v', 'mpeg4', '-qscale:v', '5', '-c:a', 'libmp3lame', '-qscale:a', '5'];
}

export default function VideoConvertPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [target, setTarget] = useState<TargetFormat>('mp4');
  const [crf, setCrf] = useState(23);
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
    if (!f.type.startsWith('video/') && !/\.(mp4|webm|mov|avi|mkv|flv|m4v|wmv)$/i.test(f.name)) {
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

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, {
      mimePrefixes: ['video/'],
      extensions: VIDEO_EXTS,
    });
    if (filtered.length === 0) {
      setError('폴더 안에 비디오 파일이 없습니다.');
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
    setMeta(null);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const inputName = `input.${srcFile.name.split('.').pop() ?? 'mp4'}`;
    const outputName = `output.${target}`;
    const ffmpeg = await getFFmpeg();
    try {
      await writeFile(ffmpeg, inputName, srcFile);
      await ffmpeg.exec(['-i', inputName, ...buildArgs(target, crf), '-y', outputName]);
      return await readOutput(ffmpeg, outputName, FORMAT_MIME[target]);
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const runConvert = async () => {
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
            return { relativePath: replaceExtension(rf.relativePath, target), blob };
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
        setError(err instanceof Error ? err.message : '일괄 변환 실패');
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
        setProgressText('변환 중');
        const blob = await processOne(file);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}.${target}`,
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

  const optionsBlock = (
    <>
      <div>
        <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
        <div className="grid grid-cols-5 gap-1.5">
          {(['mp4', 'webm', 'mov', 'avi', 'mkv'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTarget(f)}
              disabled={processing}
              className={`h-9 text-xs rounded-md border font-medium ${
                target === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              } disabled:opacity-50`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {target === 'mp4' && 'H.264 + AAC · 가장 널리 호환'}
          {target === 'webm' && 'VP9 + Opus · 웹 최적화'}
          {target === 'mov' && 'H.264 + AAC (QuickTime 컨테이너)'}
          {target === 'avi' && 'MPEG-4 + MP3 · 구형 플레이어 호환'}
          {target === 'mkv' && 'H.264 + AAC (Matroska 컨테이너)'}
        </p>
      </div>

      {target !== 'avi' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium">품질 (CRF)</label>
            <span className="text-xs text-muted-foreground">
              {crf} ({crf <= 20 ? '고품질' : crf <= 28 ? '보통' : '저품질'})
            </span>
          </div>
          <input
            type="range"
            min={16}
            max={35}
            step={1}
            value={crf}
            onChange={(e) => setCrf(Number(e.target.value))}
            disabled={processing}
            className="w-full accent-primary"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            낮을수록 고품질·큰 용량. 23 전후가 표준.
          </p>
        </div>
      )}
    </>
  );

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
            <FileVideo className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 포맷 변환</h1>
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
              accept: 'video/*',
              description: '변환할 비디오를 업로드하세요 (mp4/webm/mov/avi/mkv 등)',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'video/*',
              description: '폴더 안 모든 비디오를 같은 포맷으로 일괄 변환합니다.',
              onFolder: onFolderPicked,
            }}
          />
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <FolderPreviewPanel
            files={allFolderFiles}
            onSelectionChange={setFolderFiles}
            fileKindLabel="비디오"
          />
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-[11px] text-muted-foreground">
              같은 옵션으로 모든 파일을 일괄 처리합니다.
            </p>

            {optionsBlock}

            <Separator />

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '변환 중...'}
                </>
              ) : (
                <>
                  <FileVideo className="h-4 w-4" />
                  폴더 일괄 변환 ({folderFiles.length}개) → {target.toUpperCase()}
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

        {inputMode === 'files' && file && previewUrl && meta && (
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
              className="w-full rounded-lg border bg-black max-h-[40vh]"
            />

            <Separator />

            {optionsBlock}

            {processing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
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
                  <FileVideo className="h-4 w-4" />
                  {target.toUpperCase()} 로 변환
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
            <video
              src={result.url}
              controls
              className="w-full rounded-lg border bg-black max-h-[40vh]"
            />
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
            zipRootName={commonRoot(folderFiles) || `converted-${target}`}
            zipFileName={`${commonRoot(folderFiles) || 'video'}-${target}.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
