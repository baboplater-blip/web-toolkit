'use client';

import { useEffect, useRef, useState } from 'react';
import { Droplets, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';
import { loadBitmap, assertCanvasSize } from '@/lib/tools/image-common';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

// 이 행 수마다 이벤트 루프에 양보해 스피너가 그려지고 탭이 멎지 않게 한다.
const YIELD_EVERY_ROWS = 64;

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_SHADOW = '#1b1f3b';
const DEFAULT_HIGHLIGHT = '#f5d76e';

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** Rec. 601 휘도(0~1) */
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * 각 픽셀 휘도를 shadow~highlight 두 색 사이로 선형 매핑한다.
 * 알파는 원본 유지.
 *
 * 큰 이미지에서 메인스레드가 멎지 않도록 행 단위로 처리하고 주기적으로
 * 이벤트 루프에 양보한다(스피너가 실제로 그려지도록). 출력은 동기 버전과 동일.
 */
async function applyDuotone(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  shadow: Rgb,
  highlight: Rgb,
): Promise<void> {
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = rowStart + x * 4;
      const t = luminance(data[i], data[i + 1], data[i + 2]);
      data[i] = Math.round(shadow.r + (highlight.r - shadow.r) * t);
      data[i + 1] = Math.round(shadow.g + (highlight.g - shadow.g) * t);
      data[i + 2] = Math.round(shadow.b + (highlight.b - shadow.b) * t);
    }
    if (y % YIELD_EVERY_ROWS === YIELD_EVERY_ROWS - 1) {
      await yieldToEventLoop();
    }
  }
}

/** ImageBitmap → 듀오톤 PNG Blob (단일·폴더 공용 핵심 로직) */
async function duotoneBitmap(
  bitmap: ImageBitmap,
  shadow: Rgb,
  highlight: Rgb,
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  // 빈(투명) 결과물 방지: 브라우저 캔버스 한계 초과 시 명확히 실패시킨다.
  assertCanvasSize(bitmap.width, bitmap.height);
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  await applyDuotone(imageData.data, canvas.width, canvas.height, shadow, highlight);
  ctx.putImageData(imageData, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))),
      'image/png',
    );
  });
}

/** File → 듀오톤 PNG Blob (폴더 일괄 모드 — 비트맵·캔버스 자체 관리) */
async function duotoneFile(file: File, shadow: Rgb, highlight: Rgb): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  try {
    return await duotoneBitmap(bitmap, shadow, highlight, document.createElement('canvas'));
  } finally {
    bitmap.close();
  }
}

export default function ImageDuotonePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [shadowColor, setShadowColor] = useState(DEFAULT_SHADOW);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResultBlob(null);
    setBatchResults(null);
    try {
      const bmp = await loadBitmap(picked);
      bitmap?.close();
      setBitmap(bmp);
      setFile(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드에 실패했습니다.');
    }
  }

  function onFolderPicked(files: RelativeFile[]) {
    setError(null);
    setResultBlob(null);
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

  async function render() {
    const shadow = hexToRgb(shadowColor);
    const highlight = hexToRgb(highlightColor);

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
            const blob = await duotoneFile(rf.file, shadow, highlight);
            return { relativePath: replaceExtension(rf.relativePath, '.png'), blob };
          },
          {
            concurrency: 2,
            signal: ctrl.signal,
            onProgress: (d, t, p) => setProgress({ done: d, total: t, current: p }),
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리에 실패했습니다.');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
      }
      return;
    }

    if (!bitmap) return;
    setProcessing(true);
    setError(null);
    try {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      const blob = await duotoneBitmap(bitmap, shadow, highlight, canvas);
      setResultBlob(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : '듀오톤 변환 중 오류가 발생했습니다.');
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

  function download() {
    if (!resultBlob || !file) return;
    triggerDownload(resultBlob, `${stripExtension(file.name)}-duotone.png`);
  }

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    setFile(null);
    setResultBlob(null);
    setBatchResults(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }

  const hasInput = inputMode === 'files' ? !!file : allFolderFiles.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="듀오톤" widthClass="max-w-2xl" onReset={hasInput ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지를 두 가지 색조의 듀오톤으로 변환합니다.</p>

      {((inputMode === 'files' && !file) ||
        (inputMode === 'folder' && allFolderFiles.length === 0)) && (
        <DualDropZone
          mode={inputMode}
          onModeChange={(m) => {
            setInputMode(m);
            setError(null);
          }}
          fileProps={{
            accept: 'image/*',
            description: '듀오톤으로 바꿀 이미지를 올려주세요.',
            maxBytes: 50 * 1024 * 1024,
            onFiles: handleFiles,
            onError: setError,
          }}
          folderProps={{
            accept: 'image/*',
            description: '폴더 안 모든 이미지에 같은 듀오톤을 적용해 ZIP 으로 내보냅니다.',
            onFolder: onFolderPicked,
          }}
        />
      )}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
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

      {((inputMode === 'files' && file && bitmap) ||
        (inputMode === 'folder' && allFolderFiles.length > 0)) && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium">어두운 색 (그림자)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  aria-label="어두운 색"
                />
                <span className="font-mono text-xs text-muted-foreground">{shadowColor}</span>
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">밝은 색 (하이라이트)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  aria-label="밝은 색"
                />
                <span className="font-mono text-xs text-muted-foreground">{highlightColor}</span>
              </div>
            </label>
          </div>

          <Button className="w-full" onClick={render} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Droplets className="h-4 w-4" />}
            {inputMode === 'folder' ? `폴더 일괄 적용 (${folderFiles.length}개)` : '듀오톤 적용'}
          </Button>
        </div>
      )}

      {previewUrl && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="듀오톤 결과" className="max-h-[50vh] max-w-full object-contain" />
          </div>
          <Button className="w-full" onClick={download} disabled={!resultBlob}>
            <Download className="h-4 w-4" />
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
          label="듀오톤 적용 중"
          cancelling={cancelling}
        />
      )}

      {batchResults && (
        <BatchResultPanel
          results={batchResults}
          zipRootName={commonRoot(folderFiles) || 'duotone'}
          zipFileName={`${commonRoot(folderFiles) || 'images'}-duotone.zip`}
          totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
        />
      )}

      <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
}
