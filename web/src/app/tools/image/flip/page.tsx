'use client';

import { useEffect, useRef, useState } from 'react';
import { FlipHorizontal2, FlipVertical2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { triggerDownload } from '@/lib/tools/file-utils';
import { loadBitmap, assertCanvasSize } from '@/lib/tools/image-common';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type FlipAxis = 'horizontal' | 'vertical';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

async function flipImage(bitmap: ImageBitmap, axis: FlipAxis): Promise<Blob> {
  assertCanvasSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

  if (axis === 'horizontal') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('PNG 인코딩에 실패했습니다.');
  return blob;
}

/** File → 반전된 PNG Blob (폴더 일괄 모드 공용 — 비트맵 메모리 즉시 해제) */
async function flipFile(file: File, axis: FlipAxis): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  try {
    return await flipImage(bitmap, axis);
  } finally {
    bitmap.close();
  }
}

export default function ImageFlipPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('image');
  const [axis, setAxis] = useState<FlipAxis>('horizontal');
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function clearResult() {
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    clearResult();
    setBatchResults(null);
    try {
      const next = await loadBitmap(file);
      setBitmap((prev) => {
        prev?.close();
        return next;
      });
      const dot = file.name.lastIndexOf('.');
      setFileName(dot > 0 ? file.name.slice(0, dot) : file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 로드에 실패했습니다.');
    }
  }

  function onFolderPicked(files: RelativeFile[]) {
    setError(null);
    clearResult();
    setBatchResults(null);
    const filtered = filterFiles(files, { mimePrefixes: ['image/'], extensions: IMAGE_EXTS });
    if (filtered.length === 0) {
      setError('폴더 안에 처리할 이미지가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  }

  async function handleFlip() {
    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setError(null);
      setBatchResults(null);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await flipFile(rf.file, axis);
            return { relativePath: replaceExtension(rf.relativePath, '.png'), blob };
          },
          {
            concurrency: 2,
            signal: ctrl.signal,
            onProgress: (d, t, p) => setProgress({ done: d, total: t, current: p }),
          },
        );
        setBatchResults(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : '일괄 처리에 실패했습니다.');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
      }
      return;
    }

    if (!bitmap) return;
    setError(null);
    setProcessing(true);
    clearResult();
    try {
      const blob = await flipImage(bitmap, axis);
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      setError(e instanceof Error ? e.message : '반전 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function cancelRun() {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  }

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    setFileName('image');
    setAxis('horizontal');
    clearResult();
    setBatchResults(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setError(null);
  }

  const hasInput = inputMode === 'files' ? !!bitmap : allFolderFiles.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 반전" widthClass="max-w-2xl" onReset={hasInput ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지를 좌우 또는 상하로 뒤집어 저장합니다.</p>

      {((inputMode === 'files' && !bitmap) ||
        (inputMode === 'folder' && allFolderFiles.length === 0)) && (
        <DualDropZone
          mode={inputMode}
          onModeChange={(m) => {
            setInputMode(m);
            setError(null);
          }}
          fileProps={{
            accept: 'image/*',
            description: '반전할 이미지를 올려주세요.',
            maxBytes: 50 * 1024 * 1024,
            onFiles: handleFiles,
            onError: setError,
          }}
          folderProps={{
            accept: 'image/*',
            description: '폴더 안 모든 이미지에 같은 반전을 적용해 ZIP 으로 내보냅니다.',
            onFolder: onFolderPicked,
          }}
        />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {inputMode === 'folder' && allFolderFiles.length > 0 && (
        <FolderPreviewPanel
          files={allFolderFiles}
          onSelectionChange={setFolderFiles}
          fileKindLabel="이미지"
        />
      )}

      {((inputMode === 'files' && bitmap) ||
        (inputMode === 'folder' && allFolderFiles.length > 0)) && (
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium">반전 방향</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['horizontal', '좌우 반전', FlipHorizontal2],
                  ['vertical', '상하 반전', FlipVertical2],
                ] as const
              ).map(([value, label, Icon]) => (
                <label
                  key={value}
                  className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm transition-colors ${
                    axis === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="flip-axis"
                    value={value}
                    checked={axis === value}
                    onChange={() => {
                      setAxis(value);
                      clearResult();
                    }}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <Button onClick={handleFlip} disabled={processing}>
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {inputMode === 'folder' ? `폴더 일괄 적용 (${folderFiles.length}개)` : '반전 적용'}
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            결과
          </h2>
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt="반전 결과"
              className="max-h-[50vh] max-w-full object-contain"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => triggerDownload(result.blob, `${fileName}-flipped.png`)}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            PNG 다운로드
          </Button>
        </div>
      )}

      {progress && (
        <BatchProgressPanel
          done={progress.done}
          total={progress.total}
          current={progress.current}
          onCancel={cancelRun}
          label="반전 중"
          cancelling={cancelling}
        />
      )}

      {batchResults && (
        <BatchResultPanel
          results={batchResults}
          zipRootName={commonRoot(folderFiles) || 'flipped'}
          zipFileName={`${commonRoot(folderFiles) || 'images'}-flipped.zip`}
          totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
        />
      )}
      </main>
    </div>
  );
}
