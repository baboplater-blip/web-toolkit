'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FastForward,
  Loader2,
  Music,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  cleanupFiles,
  getFFmpeg,
  readOutput,
  writeFile,
} from '@/lib/tools/ffmpeg-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.opus', '.wma'];

/** FFmpeg atempo 는 0.5~2.0 만 허용 → 체인으로 확장 */
function buildAtempoChain(rate: number): string {
  const filters: string[] = [];
  let remaining = rate;
  while (remaining > 2.0) {
    filters.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }
  filters.push(`atempo=${remaining.toFixed(4)}`);
  return filters.join(',');
}

export default function AudioSpeedPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rate, setRate] = useState(1.5);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
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
      const filter = buildAtempoChain(rate);
      const args = ['-i', inputName, '-af', filter, '-y', outputName];
      await ffmpeg.exec(args);
      const mime = srcFile.type || `audio/${ext}`;
      return await readOutput(ffmpeg, outputName, mime);
    } finally {
      await cleanupFiles(ffmpeg, [inputName, outputName]);
    }
  }

  const run = async () => {
    if (rate < 0.25 || rate > 4) {
      setError('배속은 0.25x ~ 4x 범위에서 선택하세요.');
      return;
    }
    setError(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setBatchResults(null);
      setProgress(0);
      setProgressText('FFmpeg 로드 중');
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
            onProgress: (d, t, p) => setProgressText(`처리 중 ${d}/${t} — ${p}`),
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리 실패');
      } finally {
        setProcessing(false);
        setProgressText('');
        setProgress(0);
      }
      return;
    }

    if (!file) return;
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    setProgressText('FFmpeg 로드 중');

    try {
      const ffmpeg = await getFFmpeg();
      const onFfProgress = ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
        }
      };
      ffmpeg.on('progress', onFfProgress);
      try {
        setProgressText('배속 처리 중');
        const blob = await processOne(file);
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${stripExtension(file.name)}-${rate}x.${ext}`,
        });
      } finally {
        ffmpeg.off('progress', onFfProgress);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const optionsBlock = (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-medium text-muted-foreground">배속</label>
        <span className="text-base font-mono font-bold">{rate}x</span>
      </div>
      <input
        type="range"
        min={0.25}
        max={4}
        step={0.05}
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        disabled={processing}
        className="w-full"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
        <span>0.25x (느림)</span>
        <span>1x</span>
        <span>4x (빠름)</span>
      </div>
      <div className="grid grid-cols-6 gap-1 mt-2">
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setRate(v)}
            disabled={processing}
            className={`h-7 text-[10px] rounded-md border ${
              rate === v
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {v}x
          </button>
        ))}
      </div>
    </div>
  );

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
            <FastForward className="h-5 w-5" />
            <h1 className="font-semibold text-base">오디오 배속 조절</h1>
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
              description: '배속을 조절할 오디오 파일 (피치 유지)',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'audio/*',
              description: '폴더 안 모든 오디오에 같은 배속을 일괄 적용합니다.',
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
              같은 배속으로 모든 파일을 일괄 처리합니다.
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
                  <FastForward className="h-4 w-4" />
                  폴더 일괄 처리 ({folderFiles.length}개) · {rate}x
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              FFmpeg atempo 필터 — 피치는 유지하고 속도만 변경
            </p>
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
                  <FastForward className="h-4 w-4" />
                  {rate}x 적용
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              FFmpeg atempo 필터 — 피치는 유지하고 속도만 변경
            </p>
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

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || `speed-${rate}x`}
            zipFileName={`${commonRoot(folderFiles) || 'audio'}-speed-${rate}x.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
