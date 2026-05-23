'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileImage,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Stamp,
  Type,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  canvasToBlob,
  detectFormatFromFile,
  formatExtension,
  loadImageFile,
  type ImageFormat,
  type LoadedImage,
} from '@/lib/tools/image-common';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type WmType = 'text' | 'image';
type Position = 'center' | 'tl' | 'tr' | 'bl' | 'br';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

const POSITION_LABEL: Record<Position, string> = {
  center: '중앙',
  tl: '좌상',
  tr: '우상',
  bl: '좌하',
  br: '우하',
};

export default function ImageWatermarkPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [wmType, setWmType] = useState<WmType>('text');
  const [text, setText] = useState('© SAMPLE');
  const [wmImageFile, setWmImageFile] = useState<File | null>(null);
  const [wmImage, setWmImage] = useState<LoadedImage | null>(null);
  const [position, setPosition] = useState<Position>('br');
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(70);
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [imageScale, setImageScale] = useState(25);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; previewUrl: string } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  useEffect(() => () => loaded?.cleanup(), [loaded]);
  useEffect(() => () => wmImage?.cleanup(), [wmImage]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.previewUrl);
    };
  }, [result]);

  const acceptMain = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (result) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
    setBatchResults(null);
    loaded?.cleanup();
    try {
      const info = await loadImageFile(f);
      setFile(f);
      setLoaded(info);
      setOutputFormat(detectFormatFromFile(f) ?? 'jpeg');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
  };

  const acceptWmImage = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일을 선택하세요.');
      return;
    }
    setError(null);
    wmImage?.cleanup();
    try {
      const info = await loadImageFile(f);
      setWmImageFile(f);
      setWmImage(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '워터마크 이미지 로드 실패');
    }
  };

  const clearWmImage = () => {
    wmImage?.cleanup();
    setWmImageFile(null);
    setWmImage(null);
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    if (result) URL.revokeObjectURL(result.previewUrl);
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
    loaded?.cleanup();
    wmImage?.cleanup();
    if (result) URL.revokeObjectURL(result.previewUrl);
    setFile(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setLoaded(null);
    setWmImageFile(null);
    setWmImage(null);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const info = await loadImageFile(srcFile);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = info.width;
      canvas.height = info.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');

      if (outputFormat === 'jpeg' || outputFormat === 'avif') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(info.element, 0, 0);

      ctx.save();
      ctx.globalAlpha = opacity / 100;

      const margin = Math.min(canvas.width, canvas.height) * 0.03;

      if (wmType === 'text') {
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = fontColor;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = Math.max(1, fontSize / 24);
        const metrics = ctx.measureText(text);
        const textW = metrics.width;
        const textH = fontSize;
        const { cx, cy } = computeCenter(
          position,
          canvas.width,
          canvas.height,
          textW,
          textH,
          margin,
        );
        ctx.translate(cx, cy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.strokeText(text, -textW / 2, textH / 2);
        ctx.fillText(text, -textW / 2, textH / 2);
      } else if (wmImage) {
        const baseDim = Math.min(canvas.width, canvas.height) * (imageScale / 100);
        const ratio = baseDim / Math.max(wmImage.width, wmImage.height);
        const drawW = wmImage.width * ratio;
        const drawH = wmImage.height * ratio;
        const { cx, cy } = computeCenter(
          position,
          canvas.width,
          canvas.height,
          drawW,
          drawH,
          margin,
        );
        ctx.translate(cx, cy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(wmImage.element, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      ctx.restore();

      return await canvasToBlob(canvas, outputFormat, quality / 100);
    } finally {
      info.cleanup();
    }
  }

  const runApply = async () => {
    if (wmType === 'text' && !text.trim()) {
      setError('워터마크 텍스트를 입력하세요.');
      return;
    }
    if (wmType === 'image' && !wmImage) {
      setError('워터마크 이미지를 선택하세요.');
      return;
    }

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setError(null);
      setBatchResults(null);
      const ext = formatExtension(outputFormat);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await processOne(rf.file);
            return { relativePath: replaceExtension(rf.relativePath, ext), blob };
          },
          {
            concurrency: 2,
            signal: ctrl.signal,
            onProgress: (d, t, p) => setProgress({ done: d, total: t, current: p }),
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리 실패');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
        setProgressText('');
      }
      return;
    }

    if (!file || !loaded) return;
    setProcessing(true);
    setError(null);
    if (result) URL.revokeObjectURL(result.previewUrl);
    setResult(null);

    try {
      const blob = await processOne(file);
      const newName = renameWithSuffix(file.name, '-watermarked', formatExtension(outputFormat));
      setResult({
        blob,
        fileName: newName,
        previewUrl: URL.createObjectURL(blob),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '워터마크 적용 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

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
            <Stamp className="h-5 w-5" />
            <h1 className="font-semibold text-base">이미지 워터마크</h1>
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
              accept: 'image/*',
              description: '워터마크를 넣을 이미지를 업로드하세요',
              onFiles: (files) => acceptMain(files[0]),
            }}
            folderProps={{
              accept: 'image/*',
              description: '폴더 안 모든 이미지에 같은 워터마크를 일괄 적용합니다.',
              onFolder: onFolderPicked,
            }}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
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

        {((file && loaded && inputMode === 'files') ||
          (inputMode === 'folder' && allFolderFiles.length > 0)) && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            {inputMode === 'files' && file && loaded && (
              <>
                <div className="flex items-center gap-3">
                  <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} · {loaded.width}×{loaded.height}
                    </p>
                  </div>
                </div>

                <Separator />
              </>
            )}

            <div>
              <label className="text-xs font-medium mb-1.5 block">워터마크 타입</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setWmType('text')}
                  disabled={processing}
                  className={`h-9 text-xs rounded-md border flex items-center justify-center gap-1.5 ${
                    wmType === 'text'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <Type className="h-3.5 w-3.5" />
                  텍스트
                </button>
                <button
                  type="button"
                  onClick={() => setWmType('image')}
                  disabled={processing}
                  className={`h-9 text-xs rounded-md border flex items-center justify-center gap-1.5 ${
                    wmType === 'image'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  이미지 (로고)
                </button>
              </div>
            </div>

            {wmType === 'text' && (
              <>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">텍스트</label>
                  <Input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="텍스트 입력 (한글 가능)"
                    disabled={processing}
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium">글자 크기</label>
                      <span className="text-xs text-muted-foreground">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={200}
                      step={2}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      disabled={processing}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">색상</label>
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      disabled={processing}
                      className="h-9 w-full rounded-md border bg-background cursor-pointer"
                    />
                  </div>
                </div>
              </>
            )}

            {wmType === 'image' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">로고 이미지</label>
                {!wmImageFile ? (
                  <FileDropZone
                    accept="image/*"
                    title="로고 이미지 선택"
                    description="투명 배경 PNG 권장"
                    onFiles={(files) => acceptWmImage(files[0])}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      {wmImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={wmImage.element.src}
                          alt="preview"
                          className="h-14 w-14 object-contain rounded bg-muted"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{wmImageFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(wmImageFile.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={clearWmImage}
                        disabled={processing}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium">로고 크기 (이미지 대비)</label>
                        <span className="text-xs text-muted-foreground">{imageScale}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={1}
                        value={imageScale}
                        onChange={(e) => setImageScale(Number(e.target.value))}
                        disabled={processing}
                        className="w-full accent-primary"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">위치</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['tl', 'tr', 'center', 'bl', 'br'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosition(p)}
                    disabled={processing}
                    className={`h-9 text-[11px] rounded-md border ${
                      position === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {POSITION_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">회전</label>
                <span className="text-xs text-muted-foreground">{rotation}°</span>
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                step={5}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">투명도</label>
                <span className="text-xs text-muted-foreground">{opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary"
              />
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['jpeg', 'png', 'webp'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutputFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border ${
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

            <Separator />

            <Button onClick={runApply} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '적용 중...'}
                </>
              ) : (
                <>
                  <Stamp className="h-4 w-4" />
                  {inputMode === 'folder'
                    ? `폴더 일괄 적용 (${folderFiles.length}개)`
                    : '워터마크 적용'}
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
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.previewUrl}
                alt="결과"
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
            label="워터마크 추가 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'watermarked'}
            zipFileName={`${commonRoot(folderFiles) || 'images'}-watermarked.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}

function computeCenter(
  position: Position,
  canvasW: number,
  canvasH: number,
  objW: number,
  objH: number,
  margin: number,
): { cx: number; cy: number } {
  switch (position) {
    case 'center':
      return { cx: canvasW / 2, cy: canvasH / 2 };
    case 'tl':
      return { cx: margin + objW / 2, cy: margin + objH / 2 };
    case 'tr':
      return { cx: canvasW - margin - objW / 2, cy: margin + objH / 2 };
    case 'bl':
      return { cx: margin + objW / 2, cy: canvasH - margin - objH / 2 };
    case 'br':
      return { cx: canvasW - margin - objW / 2, cy: canvasH - margin - objH / 2 };
  }
}
