'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileVideo,
  Film,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import JSZip from 'jszip';
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
  probeVideo,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/file-utils';
import { VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type Mode = 'fps' | 'interval' | 'total';
type Format = 'jpeg' | 'png';

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp'];
const MAX_FRAMES_PER_VIDEO = 500;

interface ExtractOptions {
  mode: Mode;
  fps: number;
  interval: number;
  total: number;
  format: Format;
  quality: number;
}

/** ExtractOptions + 비디오 길이로 예상 프레임 수 계산 */
function estimateCount(duration: number, opts: ExtractOptions): number {
  if (opts.mode === 'fps') return Math.round(duration * opts.fps);
  if (opts.mode === 'interval') return Math.floor(duration / opts.interval);
  return opts.total;
}

/**
 * FFmpeg 인스턴스를 받아 단일 비디오에서 프레임을 추출한 뒤 ZIP Blob 으로 반환.
 * 임시 파일(input + frame_xxxx.*)은 finally 에서 모두 정리.
 */
async function extractFramesToZip(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  srcFile: File,
  durationHint: number | null,
  opts: ExtractOptions,
): Promise<{ blob: Blob; count: number }> {
  const ext = opts.format === 'jpeg' ? 'jpg' : 'png';
  const inExt = (srcFile.name.split('.').pop() ?? 'mp4').toLowerCase();
  const inputName = `input.${inExt}`;
  const pattern = `frame_%04d.${ext}`;
  const created: string[] = [inputName];

  try {
    await writeFile(ffmpeg, inputName, srcFile);

    const args: string[] = ['-i', inputName];
    if (opts.mode === 'fps') {
      args.push('-vf', `fps=${opts.fps}`);
    } else if (opts.mode === 'interval') {
      args.push('-vf', `fps=1/${opts.interval}`);
    } else {
      // total 모드는 비디오 길이가 필요. 알 수 없으면 fps=1 로 폴백.
      const dur = durationHint && durationHint > 0 ? durationHint : null;
      if (dur) {
        const step = dur / opts.total;
        args.push('-vf', `fps=1/${step}`);
      } else {
        args.push('-vf', 'fps=1');
      }
    }
    if (opts.format === 'jpeg') {
      const q = Math.max(2, Math.round(31 - (opts.quality / 100) * 29));
      args.push('-q:v', String(q));
    }
    args.push('-y', pattern);

    await ffmpeg.exec(args);

    const listing = await ffmpeg.listDir('/');
    const frameFiles = listing
      .map((e) => e.name)
      .filter((n) => n.startsWith('frame_') && n.endsWith(`.${ext}`))
      .sort();

    if (frameFiles.length === 0) {
      throw new Error('추출된 프레임이 없습니다.');
    }
    created.push(...frameFiles);

    const zip = new JSZip();
    for (const name of frameFiles) {
      const data = await ffmpeg.readFile(name);
      const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      zip.file(name, bytes as unknown as Uint8Array);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, count: frameFiles.length };
  } finally {
    await cleanupFiles(ffmpeg, created);
  }
}

export default function ExtractFramesPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [extractMode, setExtractMode] = useState<Mode>('fps');
  const [fps, setFps] = useState(1);
  const [interval, setInterval] = useState(1);
  const [total, setTotal] = useState(10);
  const [format, setFormat] = useState<Format>('jpeg');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    count: number;
  } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

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

  const estimatedCount = (() => {
    if (!meta) return 0;
    return estimateCount(meta.duration, {
      mode: extractMode,
      fps,
      interval,
      total,
      format,
      quality,
    });
  })();

  const runExtract = async () => {
    setError(null);
    const opts: ExtractOptions = {
      mode: extractMode,
      fps,
      interval,
      total,
      format,
      quality,
    };

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setBatchResults(null);
      setProgressText('FFmpeg 로드 중');
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const ffmpeg = await getFFmpeg();
        const results = await runBatch(
          folderFiles,
          async (rf): Promise<BatchOutput> => {
            // 비디오 길이 probe → total 모드 step 계산 + 과다 추출 가드
            let duration: number | null = null;
            try {
              const probe = await probeVideo(rf.file);
              duration = probe.duration;
              const expected = estimateCount(probe.duration, opts);
              if (expected > MAX_FRAMES_PER_VIDEO) {
                return {
                  relativePath: rf.relativePath,
                  blob: new Blob(),
                  error: `추출될 프레임이 너무 많음 (${expected}장 > ${MAX_FRAMES_PER_VIDEO}). 옵션 조정 필요`,
                };
              }
            } catch {
              // probe 실패해도 fps/interval 모드는 동작. total 모드는 폴백 fps=1.
            }
            const { blob } = await extractFramesToZip(ffmpeg, rf.file, duration, opts);
            return {
              relativePath: replaceExtension(rf.relativePath, 'zip'),
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
        setError(err instanceof Error ? err.message : '일괄 프레임 추출 실패');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
        setProgressText('');
      }
      return;
    }

    if (!file || !meta) return;
    if (estimatedCount > MAX_FRAMES_PER_VIDEO) {
      setError(`추출될 프레임이 너무 많습니다 (${estimatedCount}장). 옵션을 조정하세요.`);
      return;
    }
    setProcessing(true);
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
        setProgressText('프레임 추출 중');
        const { blob, count } = await extractFramesToZip(ffmpeg, file, meta.duration, opts);
        setResult({
          blob,
          fileName: `${stripExtension(file.name)}-frames.zip`,
          count,
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '프레임 추출 실패');
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
              onClick={() => setExtractMode(m)}
              disabled={processing}
              className={`h-9 text-xs rounded-md border ${
                extractMode === m
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
        {extractMode === 'fps' && (
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
              className="w-full accent-primary" aria-label="초당 프레임 수" />
          </>
        )}
        {extractMode === 'interval' && (
          <>
            <label className="text-xs font-medium mb-1 block">간격 (초)</label>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={interval}
              onChange={(e) => setInterval(Math.max(0.1, Number(e.target.value) || 0.1))}
              disabled={processing}
              className="h-9" aria-label="간격 (초)" />
          </>
        )}
        {extractMode === 'total' && (
          <>
            <label className="text-xs font-medium mb-1 block">총 장수</label>
            <Input
              type="number"
              min={1}
              max={MAX_FRAMES_PER_VIDEO}
              value={total}
              onChange={(e) =>
                setTotal(
                  Math.max(1, Math.min(MAX_FRAMES_PER_VIDEO, Number(e.target.value) || 1)),
                )
              }
              disabled={processing}
              className="h-9" aria-label="총 장수" />
          </>
        )}
        {inputMode === 'files' && meta && (
          <p className="text-[10px] text-muted-foreground mt-1">
            예상 추출: 약 {estimatedCount}장
          </p>
        )}
        {inputMode === 'folder' && (
          <p className="text-[10px] text-muted-foreground mt-1">
            비디오마다 길이에 따라 추출 장수가 달라집니다. 한 비디오당 최대{' '}
            {MAX_FRAMES_PER_VIDEO}장 (초과 시 건너뜀).
          </p>
        )}
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
            className="w-full accent-primary" aria-label="JPEG 품질" />
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
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Film className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 → 프레임 추출</h1>
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
              description: '비디오에서 이미지 프레임을 추출합니다',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: VIDEO_ACCEPT,
              description:
                '폴더 안 모든 비디오에서 프레임을 추출해 각각 ZIP 으로 묶습니다.',
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
              비디오별로 프레임을 추출해 각각 ZIP 으로 생성합니다. 결과는 ZIP 의 ZIP (각
              비디오 1개 ZIP) 형태로 다운로드/저장.
            </p>

            {optionsBlock}

            <Separator />

            <Button onClick={runExtract} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '추출 중...'}
                </>
              ) : (
                <>
                  <Film className="h-4 w-4" />
                  폴더 일괄 프레임 추출 ({folderFiles.length}개)
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
              className="w-full rounded-lg border bg-black max-h-[30vh]"
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
            label="프레임 추출 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'frames'}
            zipFileName={`${commonRoot(folderFiles) || 'video'}-frames.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
