'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import JSZip from 'jszip';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  canvasToBlob,
  computeResize,
  drawToCanvas,
  formatExtension,
  loadImageFile,
  type ImageFormat,
} from '@/lib/tools/image-common';
import { stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { compressionRatio, formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

interface QueueItem {
  id: string;
  file: File;
}

export default function BatchCompressPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(75);
  const [maxDim, setMaxDim] = useState(1920);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    count: number;
    totalOriginal: number;
    totalCompressed: number;
  } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  const addFiles = (files: File[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (imgs.length === 0) {
      setError('이미지 파일만 추가할 수 있습니다.');
      return;
    }
    const newItems: QueueItem[] = imgs.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, {
      mimePrefixes: ['image/'],
      extensions: IMAGE_EXTS,
    });
    if (filtered.length === 0) {
      setError('폴더 안에 처리할 이미지가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  const reset = () => {
    setItems([]);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function compressOne(srcFile: File): Promise<Blob> {
    const info = await loadImageFile(srcFile);
    try {
      const { width, height } = computeResize(info.width, info.height, maxDim);
      const canvas = drawToCanvas(info.element, width, height, outputFormat);
      return await canvasToBlob(canvas, outputFormat, quality / 100);
    } finally {
      info.cleanup();
    }
  }

  const runCompress = async () => {
    setProcessing(true);
    setError(null);
    setResult(null);
    setBatchResults(null);

    const ext = formatExtension(outputFormat);

    try {
      if (inputMode === 'folder') {
        if (folderFiles.length === 0) {
          setError('처리할 파일을 선택하세요.');
          setProcessing(false);
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
              return { relativePath: replaceExtension(rf.relativePath, ext), blob };
            },
            {
              concurrency: 3,
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

      if (items.length === 0) {
        setError('파일을 먼저 추가하세요.');
        return;
      }

      const totalOriginal = items.reduce((s, i) => s + i.file.size, 0);

      if (items.length === 1) {
        setProgressText('압축 중');
        const blob = await compressOne(items[0].file);
        const fileName = `${stripExtension(items[0].file.name)}-compressed.${ext}`;
        setResult({
          blob,
          fileName,
          count: 1,
          totalOriginal,
          totalCompressed: blob.size,
        });
        return;
      }

      const zip = new JSZip();
      let totalCompressed = 0;
      for (let i = 0; i < items.length; i++) {
        setProgressText(`압축 중 ${i + 1}/${items.length}`);
        const blob = await compressOne(items[i].file);
        totalCompressed += blob.size;
        const fileName = `${stripExtension(items[i].file.name)}.${ext}`;
        zip.file(fileName, await blob.arrayBuffer());
      }

      setProgressText('ZIP 압축 중');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setResult({
        blob: zipBlob,
        fileName: `compressed-images.zip`,
        count: items.length,
        totalOriginal,
        totalCompressed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '압축 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

  const reduction = result ? compressionRatio(result.totalOriginal, result.totalCompressed) : 0;

  const ready =
    inputMode === 'folder' ? allFolderFiles.length > 0 : items.length > 0;

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
            <h1 className="font-semibold text-base">이미지 일괄 압축</h1>
          </div>
          {ready && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <DualDropZone
          mode={inputMode}
          onModeChange={(m) => {
            setInputMode(m);
            setError(null);
          }}
          fileProps={{
            accept: 'image/*',
            multiple: true,
            title: '이미지를 끌어다 놓거나 클릭하여 추가',
            description: '여러 장을 한 번에 압축',
            onFiles: addFiles,
          }}
          folderProps={{
            accept: 'image/*',
            description: '폴더 안의 모든 이미지를 일괄 압축합니다. 구조 유지.',
            onFolder: onFolderPicked,
          }}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {inputMode === 'files' && items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                대기열 ({items.length}장)
              </h2>
              <span className="text-[10px] text-muted-foreground">
                총 {formatBytes(items.reduce((s, i) => s + i.file.size, 0))}
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 rounded-lg border p-2">
                  <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{it.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(it.file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-destructive"
                    onClick={() => removeItem(it.id)}
                    disabled={processing}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <FolderPreviewPanel
            files={allFolderFiles}
            onSelectionChange={setFolderFiles}
            fileKindLabel="이미지"
          />
        )}

        {ready && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['jpeg', 'webp', 'png'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutputFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      outputFormat === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {outputFormat !== 'png' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">품질</label>
                  <span className="text-xs text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">최대 크기 (긴 변, px)</label>
                <span className="text-xs text-muted-foreground">
                  {maxDim === 0 ? '원본 유지' : `${maxDim}px`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4096}
                step={128}
                value={maxDim}
                onChange={(e) => setMaxDim(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary"
              />
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
                  {inputMode === 'folder'
                    ? `폴더 일괄 압축 (${folderFiles.length}장)`
                    : `일괄 압축 (${items.length}장)`}
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
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">원본 합계</p>
                <p className="text-sm font-semibold mt-0.5">
                  {formatBytes(result.totalOriginal)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">압축 합계</p>
                <p className="text-sm font-semibold mt-0.5">
                  {formatBytes(result.totalCompressed)}
                </p>
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
            zipFileName={`${commonRoot(folderFiles) || 'compressed'}-${formatExtension(outputFormat)}.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
