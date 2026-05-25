'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
  Scissors,
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
  formatTime,
  getFFmpeg,
  parseTimeToSeconds,
  probeVideo,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';
import {
  appendSuffix,
  commonRoot,
  filterFiles,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type Mode = 'copy' | 'reencode';

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp'];

/** trim 시 사용할 ffmpeg args 생성 */
function buildTrimArgs(
  mode: Mode,
  start: number,
  dur: number,
  inputName: string,
  outputName: string,
): string[] {
  if (mode === 'copy') {
    return [
      '-ss',
      String(start),
      '-t',
      String(dur),
      '-i',
      inputName,
      '-c',
      'copy',
      '-avoid_negative_ts',
      'make_zero',
      '-y',
      outputName,
    ];
  }
  return [
    '-ss',
    String(start),
    '-t',
    String(dur),
    '-i',
    inputName,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-y',
    outputName,
  ];
}

export default function VideoTrimPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [startTime, setStartTime] = useState('00:00.00');
  const [endTime, setEndTime] = useState('00:05.00');
  const [trimMode, setTrimMode] = useState<Mode>('copy');
  const [processing, setProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      setStartTime('00:00.00');
      setEndTime(formatTime(Math.min(info.duration, 5)));
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
      setError('폴더 안에 처리할 비디오가 없습니다.');
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
    setProgress(null);
    setCancelling(false);
    setError(null);
  };

  const useCurrent = (setter: (s: string) => void) => {
    if (videoRef.current) setter(formatTime(videoRef.current.currentTime));
  };

  /** 단일 비디오 파일을 trim 해 Blob 반환. mime 은 입력 확장자에 따름. */
  async function processOne(
    srcFile: File,
    start: number,
    dur: number,
  ): Promise<{ blob: Blob; ext: string }> {
    const ext = (srcFile.name.split('.').pop() ?? 'mp4').toLowerCase();
    const inputName = `input.${ext}`;
    const outputName = `output.${ext}`;
    const ffmpeg = await getFFmpeg();
    try {
      await writeFile(ffmpeg, inputName, srcFile);
      await ffmpeg.exec(buildTrimArgs(trimMode, start, dur, inputName, outputName));
      const mime = srcFile.type || 'video/mp4';
      const blob = await readOutput(ffmpeg, outputName, mime);
      return { blob, ext };
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const runTrim = async () => {
    setError(null);
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) {
      setError('종료가 시작보다 커야 합니다.');
      return;
    }
    const dur = end - start;

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setBatchResults(null);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf): Promise<BatchOutput> => {
            // 시작 시간보다 짧은 비디오는 메타 단계에서 미리 거른다 (ffmpeg 호출 절감)
            try {
              const probe = await probeVideo(rf.file);
              if (probe.duration <= start) {
                return {
                  relativePath: rf.relativePath,
                  blob: new Blob(),
                  error: `비디오가 시작 시간(${formatTime(start)})보다 짧음`,
                };
              }
            } catch {
              // probe 실패해도 ffmpeg 가 자체 오류를 내도록 진행
            }
            const { blob } = await processOne(rf.file, start, dur);
            return {
              relativePath: appendSuffix(rf.relativePath, '-trimmed'),
              blob,
            };
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
        setError(err instanceof Error ? err.message : '일괄 자르기 실패');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
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
        setProgressText('자르는 중');
        const { blob, ext } = await processOne(file, start, dur);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}-trimmed.${ext}`,
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '자르기 실패');
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

  const duration = (() => {
    const s = parseTimeToSeconds(startTime);
    const e = parseTimeToSeconds(endTime);
    return Math.max(0, e - s);
  })();

  const optionsBlock = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">시작</label>
            {inputMode === 'files' && (
              <button
                type="button"
                onClick={() => useCurrent(setStartTime)}
                disabled={processing}
                className="text-[10px] text-primary hover:underline"
              >
                현재 시점
              </button>
            )}
          </div>
          <Input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={processing}
            aria-label="시작 시간"
            className="h-9 font-mono text-xs"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">종료</label>
            {inputMode === 'files' && (
              <button
                type="button"
                onClick={() => useCurrent(setEndTime)}
                disabled={processing}
                className="text-[10px] text-primary hover:underline"
              >
                현재 시점
              </button>
            )}
          </div>
          <Input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={processing}
            aria-label="끝 시간"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">구간 길이: {duration.toFixed(2)}초</p>

      <div>
        <label className="text-xs font-medium mb-1.5 block">방식</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setTrimMode('copy')}
            disabled={processing}
            className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
              trimMode === 'copy'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            } disabled:opacity-50`}
          >
            <div className="font-medium">스트림 복사 (빠름)</div>
            <div className="text-[10px] opacity-80 mt-0.5">
              재인코딩 없이 빠르게. 키프레임 단위로 정확도 약간 낮음.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTrimMode('reencode')}
            disabled={processing}
            className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
              trimMode === 'reencode'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            } disabled:opacity-50`}
          >
            <div className="font-medium">재인코딩 (정확)</div>
            <div className="text-[10px] opacity-80 mt-0.5">
              프레임 단위 정확. H.264/AAC 로 재인코딩.
            </div>
          </button>
        </div>
      </div>
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
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Scissors className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 자르기</h1>
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
              accept: VIDEO_ACCEPT,
              description: '구간을 지정하여 비디오를 잘라냅니다',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: VIDEO_ACCEPT,
              description: '폴더 안 모든 비디오를 같은 구간으로 일괄 자릅니다.',
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
              같은 구간·옵션으로 모든 파일을 일괄 처리합니다. 시작 시간보다 짧은 비디오는
              자동으로 건너뜁니다.
            </p>

            {optionsBlock}

            <Separator />

            <Button onClick={runTrim} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자르는 중...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" />
                  폴더 일괄 자르기 ({folderFiles.length}개)
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
                  {formatBytes(file.size)} · {formatTime(meta.duration)}
                </p>
              </div>
            </div>

            <video
              ref={videoRef}
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

            <Button onClick={runTrim} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자르는 중...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" />
                  비디오 자르기
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
            <video
              src={result.url}
              controls
              className="w-full rounded-lg border bg-black max-h-[40vh]"
            />
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
            label="자르는 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'trimmed'}
            zipFileName={`${commonRoot(folderFiles) || 'video'}-trimmed.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
