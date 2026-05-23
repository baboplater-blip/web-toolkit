'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Archive,
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
import { VIDEO_ACCEPT } from '@/lib/tools/media-limits';
import { compressionRatio, formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.flv', '.wmv'];

type Preset = 'high' | 'medium' | 'low' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, { crf: number; maxHeight: number; label: string }> =
  {
    high: { crf: 20, maxHeight: 1080, label: '고품질 (1080p, CRF 20)' },
    medium: { crf: 26, maxHeight: 720, label: '균형 (720p, CRF 26)' },
    low: { crf: 30, maxHeight: 480, label: '작은 용량 (480p, CRF 30)' },
  };

export default function VideoCompressPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ duration: number; width: number; height: number } | null>(
    null,
  );
  const [preset, setPreset] = useState<Preset>('medium');
  const [crf, setCrf] = useState(26);
  const [maxHeight, setMaxHeight] = useState(720);
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

  /**
   * 폴더 모드에서는 파일별로 probe 비용을 피하기 위해 ffmpeg expression 으로
   * "원본보다 작을 때만 다운스케일" 을 표현 — 업스케일을 막아 원본 화질을 보존.
   * 단일 모드에서는 meta 정보를 활용해 필요 없으면 scale 자체를 생략.
   */
  async function processOne(srcFile: File, opts: { useExpressionScale: boolean }): Promise<Blob> {
    const ext = 'mp4'; // H.264 재인코딩은 MP4 컨테이너로 통일
    const inputName = `input.${srcFile.name.split('.').pop() ?? 'mp4'}`;
    const outputName = `output.${ext}`;
    const ffmpeg = await getFFmpeg();
    try {
      await writeFile(ffmpeg, inputName, srcFile);

      const args: string[] = ['-i', inputName];

      if (opts.useExpressionScale) {
        // 입력 높이가 maxHeight 보다 크면 maxHeight 로 다운, 아니면 원본 유지.
        // 가로는 -2 로 짝수 정렬해 비율 유지.
        args.push('-vf', `scale='trunc(iw*min(1,${maxHeight}/ih)/2)*2':'min(${maxHeight},ih)'`);
      } else {
        // 단일 모드 — meta 가 있다는 가정
        if (meta && meta.height > maxHeight) {
          args.push('-vf', `scale=-2:${maxHeight}`);
        }
      }

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

      await ffmpeg.exec(args);
      return await readOutput(ffmpeg, outputName, 'video/mp4');
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const runCompress = async () => {
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
            const blob = await processOne(rf.file, { useExpressionScale: true });
            // 출력 컨테이너는 항상 mp4 — 확장자 교체
            return { relativePath: replaceExtension(rf.relativePath, 'mp4'), blob };
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
        setError(err instanceof Error ? err.message : '일괄 압축 실패');
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

    if (!file || !meta) return;
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
        setProgressText('압축 중');
        const blob = await processOne(file, { useExpressionScale: false });
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: renameWithSuffix(stripExtension(file.name) + '.mp4', '-compressed', 'mp4'),
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

  const optionsBlock = (
    <>
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
            <Archive className="h-5 w-5" />
            <h1 className="font-semibold text-base">비디오 압축</h1>
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
              description: '해상도·품질을 조정해 비디오 용량을 줄입니다',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: VIDEO_ACCEPT,
              description: '폴더 안 모든 비디오를 같은 설정으로 일괄 압축합니다. (모두 MP4 출력)',
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
              같은 옵션으로 모든 파일을 일괄 처리합니다. 출력은 모두 MP4 (H.264/AAC).
            </p>

            {optionsBlock}

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

        {inputMode === 'files' && file && previewUrl && meta && (
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
            zipFileName={`${commonRoot(folderFiles) || 'video'}-compressed.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
