'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clapperboard,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
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
  type LoadProgress,
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

type Effect = 'none' | 'reverse' | 'pingpong';

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp'];

interface GifOptions {
  start: number;
  duration: number;
  fps: number;
  width: number;
  effect: Effect;
}

/**
 * FFmpeg 인스턴스를 받아 GIF 를 생성한다. 단일/폴더 모드 공통.
 * 입력 파일을 FS 에 쓰고, 2-pass 팔레트 기법으로 GIF 인코딩.
 * 임시 파일은 finally 에서 일괄 정리.
 */
async function generateGif(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  srcFile: File,
  opts: GifOptions,
): Promise<Blob> {
  const ext = (srcFile.name.split('.').pop() ?? 'mp4').toLowerCase();
  const inputName = `input.${ext}`;
  const outputName = 'output.gif';
  const paletteName = 'palette.png';
  const reversedName = 'reversed.gif';
  const combinedName = 'combined.gif';
  const created: string[] = [inputName, outputName, paletteName];

  try {
    await writeFile(ffmpeg, inputName, srcFile);

    const vf: string[] = [];
    vf.push(`fps=${opts.fps}`);
    vf.push(`scale=${opts.width}:-1:flags=lanczos`);
    if (opts.effect === 'reverse') vf.push('reverse');

    // 1) 팔레트 생성
    await ffmpeg.exec([
      '-ss',
      String(opts.start),
      '-t',
      String(opts.duration),
      '-i',
      inputName,
      '-vf',
      `${vf.join(',')},palettegen=stats_mode=diff`,
      '-y',
      paletteName,
    ]);

    // 2) GIF 인코딩
    const finalFilter = `${vf.join(',')}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`;
    await ffmpeg.exec([
      '-ss',
      String(opts.start),
      '-t',
      String(opts.duration),
      '-i',
      inputName,
      '-i',
      paletteName,
      '-lavfi',
      finalFilter,
      '-loop',
      '0',
      '-y',
      outputName,
    ]);

    if (opts.effect === 'pingpong') {
      created.push(reversedName, combinedName);
      await ffmpeg.exec(['-i', outputName, '-vf', 'reverse', '-y', reversedName]);
      await ffmpeg.exec([
        '-i',
        outputName,
        '-i',
        reversedName,
        '-filter_complex',
        '[0:v][1:v]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
        '-loop',
        '0',
        '-y',
        combinedName,
      ]);
      return await readOutput(ffmpeg, combinedName, 'image/gif');
    }

    return await readOutput(ffmpeg, outputName, 'image/gif');
  } finally {
    await cleanupFiles(ffmpeg, created);
  }
}

export default function VideoToGifPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [startTime, setStartTime] = useState('00:00.00');
  const [endTime, setEndTime] = useState('00:03.00');
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  const [effect, setEffect] = useState<Effect>('none');
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
      setError('비디오 파일만 업로드 가능합니다 (mp4, webm, mov, avi 등).');
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
      const endSec = Math.min(info.duration, 3);
      setStartTime('00:00.00');
      setEndTime(formatTime(endSec));
      setWidth(Math.min(480, Math.round(info.width / 2)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '비디오 메타 로드 실패');
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

  const useCurrentTime = (setter: (s: string) => void) => {
    if (!videoRef.current) return;
    setter(formatTime(videoRef.current.currentTime));
  };

  const runConvert = async () => {
    setError(null);
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) {
      setError('종료 시간이 시작 시간보다 커야 합니다.');
      return;
    }
    const duration = end - start;

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
              // probe 실패 → ffmpeg 가 자체 오류 발생시키도록 진행
            }
            const blob = await generateGif(ffmpeg, rf.file, {
              start,
              duration,
              fps,
              width,
              effect,
            });
            return {
              relativePath: replaceExtension(rf.relativePath, 'gif'),
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
        setError(err instanceof Error ? err.message : '일괄 GIF 변환 실패');
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
    if (duration > 30) {
      // 경고만 하고 진행 (사용자 판단)
    }

    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgressPct(0);

    try {
      setProgressText('FFmpeg 로드 중 (최초만 ~30MB)');
      const ffmpeg = await getFFmpeg((p: LoadProgress) => {
        const stageMap: Record<LoadProgress['stage'], string> = {
          'fetching-core': 'FFmpeg 코어 다운로드',
          'fetching-wasm': 'WASM 바이너리 다운로드 (~30MB)',
          initializing: 'FFmpeg 초기화',
          ready: '준비 완료',
        };
        setProgressText(stageMap[p.stage]);
      });

      const onFfProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgressPct(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onFfProgress);

      try {
        setProgressText('GIF 인코딩 중');
        const blob = await generateGif(ffmpeg, file, {
          start,
          duration,
          fps,
          width,
          effect,
        });
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}.gif`,
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GIF 변환 실패');
    } finally {
      setProcessing(false);
      setProgressPct(0);
      setProgressText('');
    }
  };

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

  const estimatedDuration = (() => {
    const s = parseTimeToSeconds(startTime);
    const e = parseTimeToSeconds(endTime);
    return Math.max(0, e - s);
  })();

  // 폴더 모드에서는 너비 슬라이더의 max 를 고정값으로 (개별 비디오 메타가 없으므로)
  const widthMax =
    inputMode === 'files' && meta ? Math.max(120, Math.min(1280, meta.width)) : 1280;

  const optionsBlock = (
    <>
      <div>
        <label className="text-xs font-medium mb-1.5 block">구간 선택</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-muted-foreground">시작</label>
              {inputMode === 'files' && (
                <button
                  type="button"
                  onClick={() => useCurrentTime(setStartTime)}
                  disabled={processing}
                  className="text-[10px] text-primary hover:underline"
                >
                  현재 시점 사용
                </button>
              )}
            </div>
            <Input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="MM:SS.ms"
              disabled={processing}
              className="h-9 font-mono text-xs" aria-label="MM:SS.ms" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-muted-foreground">종료</label>
              {inputMode === 'files' && (
                <button
                  type="button"
                  onClick={() => useCurrentTime(setEndTime)}
                  disabled={processing}
                  className="text-[10px] text-primary hover:underline"
                >
                  현재 시점 사용
                </button>
              )}
            </div>
            <Input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="MM:SS.ms"
              disabled={processing}
              className="h-9 font-mono text-xs" aria-label="MM:SS.ms" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          구간 길이: {estimatedDuration.toFixed(2)}초
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium">프레임률 (FPS)</label>
            <span className="text-xs text-muted-foreground">{fps}</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            disabled={processing}
            className="w-full accent-primary" aria-label="프레임률 (FPS)" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium">너비 (px)</label>
            <span className="text-xs text-muted-foreground">{width}</span>
          </div>
          <input
            type="range"
            min={120}
            max={widthMax}
            step={10}
            value={Math.min(width, widthMax)}
            onChange={(e) => setWidth(Number(e.target.value))}
            disabled={processing}
            className="w-full accent-primary" aria-label="너비 (px)" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block">효과</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ['none', '기본'],
              ['reverse', '역재생'],
              ['pingpong', '핑퐁 (앞뒤반복)'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setEffect(v)}
              disabled={processing}
              className={`h-9 text-xs rounded-md border ${
                effect === v
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              } disabled:opacity-50`}
            >
              {label}
            </button>
          ))}
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
            <Clapperboard className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 → GIF</h1>
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
              description: 'MP4 / WebM / MOV / AVI / MKV 등 비디오',
              hint: 'FFmpeg.wasm (~30MB) 을 최초 실행 시 다운로드합니다. 이후 캐시.',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: VIDEO_ACCEPT,
              description: '폴더 안 모든 비디오를 같은 구간·옵션으로 GIF 로 일괄 변환합니다.',
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
              같은 옵션으로 모든 파일을 일괄 처리합니다. 시작 시간보다 짧은 비디오는 자동
              건너뜀.
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
                  <Clapperboard className="h-4 w-4" />
                  폴더 일괄 GIF 변환 ({folderFiles.length}개)
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
                  {formatTime(meta.duration)}
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

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  변환 중...
                </>
              ) : (
                <>
                  <Clapperboard className="h-4 w-4" />
                  GIF 로 변환
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              팁: 구간 3~5초, 너비 320~480, FPS 10~15 조합이 가장 실용적입니다.
            </p>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과
            </h2>
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="GIF"
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
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
            label="GIF 변환 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'gif'}
            zipFileName={`${commonRoot(folderFiles) || 'video'}-gif.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          FFmpeg.wasm (GPL) · 2-pass 팔레트 기법으로 고품질 GIF 생성. 모든 처리는 브라우저에서.
        </p>
      </main>
    </div>
  );
}
