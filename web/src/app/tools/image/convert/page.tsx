'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  canvasToBlob,
  drawToCanvas,
  formatExtension,
  loadImageFile,
  supportsAvifEncode,
  type ImageFormat,
} from '@/lib/tools/image-common';
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

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

interface QueueItem {
  id: string;
  file: File;
}

export default function ImageConvertPage() {
  const { mode, setMode } = useBatchMode();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState(85);
  const [avifSupported, setAvifSupported] = useState<boolean | null>(null);
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
    totalSize: number;
  } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  useEffect(() => {
    supportsAvifEncode().then(setAvifSupported);
  }, []);

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

  async function convertOne(file: File): Promise<Blob> {
    const info = await loadImageFile(file);
    try {
      const canvas = drawToCanvas(info.element, info.width, info.height, outputFormat);
      return await canvasToBlob(canvas, outputFormat, quality / 100);
    } finally {
      info.cleanup();
    }
  }

  const runConvert = async () => {
    if (outputFormat === 'avif' && avifSupported === false) {
      setError('브라우저가 AVIF 인코딩을 지원하지 않습니다. 다른 포맷을 선택하세요.');
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);
    setBatchResults(null);
    const ext = formatExtension(outputFormat);

    try {
      if (mode === 'folder') {
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
              const blob = await convertOne(rf.file);
              return {
                relativePath: replaceExtension(rf.relativePath, ext),
                blob,
              };
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

      // 파일 모드
      if (items.length === 0) {
        setError('파일을 먼저 추가하세요.');
        setProcessing(false);
        return;
      }

      if (items.length === 1) {
        setProgressText('변환 중');
        const blob = await convertOne(items[0].file);
        const fileName = `${stripExtension(items[0].file.name)}.${ext}`;
        setResult({ blob, fileName, count: 1, totalSize: blob.size });
        return;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: items.length, current: '' });
      try {
        const zip = new JSZip();
        let totalSize = 0;
        for (let i = 0; i < items.length; i++) {
          if (ctrl.signal.aborted) {
            setError('사용자가 취소했습니다.');
            return;
          }
          setProgress({ done: i, total: items.length, current: items[i].file.name });
          const blob = await convertOne(items[i].file);
          totalSize += blob.size;
          const fileName = `${stripExtension(items[i].file.name)}.${ext}`;
          zip.file(fileName, await blob.arrayBuffer());
        }
        setProgressText('ZIP 압축 중');
        setProgress(null);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResult({
          blob: zipBlob,
          fileName: `converted-${ext}.zip`,
          count: items.length,
          totalSize,
        });
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다');
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

  const totalInputSize =
    mode === 'folder'
      ? folderFiles.reduce((s, f) => s + f.file.size, 0)
      : items.reduce((s, i) => s + i.file.size, 0);

  const ready = mode === 'folder' ? folderFiles.length > 0 : items.length > 0;
  const hasAnyInput = mode === 'folder' ? allFolderFiles.length > 0 : items.length > 0;

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
            <FileImage className="h-5 w-5" />
            <h1 className="font-semibold text-base">이미지 포맷 변환</h1>
          </div>
          {hasAnyInput && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <DualDropZone
          mode={mode}
          onModeChange={(m) => {
            setMode(m);
            setError(null);
          }}
          fileProps={{
            accept: 'image/*',
            multiple: true,
            title: '이미지를 끌어다 놓거나 클릭하여 추가',
            description: '여러 파일 선택 가능 (JPG / PNG / WebP / AVIF / BMP / GIF)',
            onFiles: addFiles,
          }}
          folderProps={{
            accept: 'image/*',
            description: '폴더 안의 모든 이미지를 일괄 변환합니다. 구조 유지.',
            onFolder: onFolderPicked,
          }}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === 'files' && items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              대기열 ({items.length}장)
            </h2>
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

        {mode === 'folder' && allFolderFiles.length > 0 && (
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
              <div className="grid grid-cols-4 gap-1.5">
                {(['jpeg', 'png', 'webp', 'avif'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutputFormat(f)}
                    disabled={processing || (f === 'avif' && avifSupported === false)}
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
              {outputFormat === 'avif' && avifSupported === false && (
                <p className="text-[10px] text-yellow-500 mt-1">
                  브라우저가 AVIF 인코딩을 지원하지 않습니다.
                </p>
              )}
              {outputFormat === 'webp' && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  WebP: JPEG 대비 25~35% 작은 용량, 투명 배경 지원.
                </p>
              )}
              {outputFormat === 'avif' && avifSupported && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  AVIF: 최고 압축 효율. 구형 브라우저 호환성 주의.
                </p>
              )}
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

            <Separator />

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '변환 중...'}
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  {outputFormat.toUpperCase()} 로 변환
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
                <p className="text-[10px] text-muted-foreground">변환 파일</p>
                <p className="text-sm font-semibold mt-0.5">{result.count}개</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {result.count === 1 ? '크기' : '합계'}
                </p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.totalSize)}</p>
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
            label="변환 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || `converted-${outputFormat}`}
            zipFileName={`${commonRoot(folderFiles) || 'converted'}-${formatExtension(outputFormat)}.zip`}
            totalInputSize={totalInputSize}
          />
        )}
      </main>
    </div>
  );
}
