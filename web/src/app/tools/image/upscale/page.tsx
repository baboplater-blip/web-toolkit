'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileImage,
  Loader2,
  Maximize,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
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

type Scale = 2 | 3 | 4;
type ModelFlavor = 'slim' | 'thick';

const MAX_INPUT_PIXELS = 1024 * 1024; // 1MP 제한 (그 이상은 처리 시간이 비현실적)
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

/** 선택된 모델을 dynamic import */
async function loadModel(flavor: ModelFlavor, scale: Scale) {
  if (flavor === 'slim') {
    if (scale === 2) return (await import('@upscalerjs/esrgan-slim/2x')).default;
    if (scale === 3) return (await import('@upscalerjs/esrgan-slim/3x')).default;
    return (await import('@upscalerjs/esrgan-slim/4x')).default;
  }
  if (scale === 2) return (await import('@upscalerjs/esrgan-thick/2x')).default;
  if (scale === 3) return (await import('@upscalerjs/esrgan-thick/3x')).default;
  return (await import('@upscalerjs/esrgan-thick/4x')).default;
}

interface UpscalerRuntime {
  upscaler: {
    upscale: (
      input: HTMLImageElement,
      opts: {
        patchSize: number;
        padding: number;
        output: 'base64';
        progress?: (rate: number) => void;
      },
    ) => Promise<string>;
    warmup: (opts: { patchSize: number; padding: number }) => Promise<void>;
    dispose?: () => void;
  };
  disposeAll: () => void;
}

/** TFJS + Upscaler 초기화 (warmup 포함). 폴더 모드에서는 1회만 초기화하여 재사용. */
async function initUpscalerRuntime(
  flavor: ModelFlavor,
  scale: Scale,
  onStatus?: (s: string) => void,
): Promise<UpscalerRuntime> {
  onStatus?.('TensorFlow.js 로드 중');
  const tf = await import('@tensorflow/tfjs');
  await tf.ready();
  try {
    await tf.setBackend('webgl');
  } catch {
    /* CPU fallback */
  }

  onStatus?.('AI 모델 로드 중');
  const UpscalerModule = await import('upscaler');
  const Upscaler = UpscalerModule.default;
  const model = await loadModel(flavor, scale);
  const upscaler = new Upscaler({ model });

  onStatus?.('모델 초기화');
  await upscaler.warmup({ patchSize: 64, padding: 2 });

  return {
    upscaler: upscaler as unknown as UpscalerRuntime['upscaler'],
    disposeAll: () => {
      try {
        upscaler.dispose?.();
        tf.disposeVariables();
      } catch {
        /* noop */
      }
    },
  };
}

/** base64 데이터 URL 을 캔버스에 그려 지정된 포맷의 Blob 으로 변환 */
async function encodeUpscaledOutput(
  base64: string,
  outputFormat: ImageFormat,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('결과 로드 실패'));
    i.src = base64;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');
  if (outputFormat === 'jpeg' || outputFormat === 'avif') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, outputFormat, quality / 100);
  return { blob, width: canvas.width, height: canvas.height };
}

export default function ImageUpscalePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [scale, setScale] = useState<Scale>(2);
  const [flavor, setFlavor] = useState<ModelFlavor>('slim');
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(95);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    outW: number;
    outH: number;
  } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  useEffect(() => () => loaded?.cleanup(), [loaded]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  // 해상도에 따른 경고 (단일 모드)
  useEffect(() => {
    if (!loaded || inputMode !== 'files') {
      if (inputMode !== 'files') setWarning(null);
      return;
    }
    const pixels = loaded.width * loaded.height;
    const outPixels = pixels * scale * scale;
    if (pixels > MAX_INPUT_PIXELS) {
      setWarning(
        `입력이 너무 큽니다 (${loaded.width}×${loaded.height}). 1MP 이하 이미지를 권장합니다. 진행 시 수 분 이상 소요될 수 있습니다.`,
      );
    } else if (outPixels > 16 * 1024 * 1024) {
      setWarning(
        `출력 예상 크기: ${Math.round(loaded.width * scale)}×${Math.round(loaded.height * scale)}. 메모리 부족으로 실패할 수 있습니다.`,
      );
    } else {
      setWarning(null);
    }
  }, [loaded, scale, inputMode]);

  // 폴더 모드 경고
  useEffect(() => {
    if (inputMode !== 'folder' || folderFiles.length === 0) return;
    const big = folderFiles.filter((rf) => rf.file.size > 4 * 1024 * 1024).length;
    if (big > 0) {
      setWarning(
        `${big}개 파일이 4MB 보다 큽니다. 큰 이미지는 1MP 이상이어서 메모리 부족 또는 매우 느린 처리가 발생할 수 있습니다.`,
      );
    } else {
      setWarning(null);
    }
  }, [folderFiles, inputMode]);

  const acceptFile = async (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    loaded?.cleanup();
    try {
      const info = await loadImageFile(f);
      setFile(f);
      setLoaded(info);
      setOutputFormat(detectFormatFromFile(f) ?? 'png');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, {
      mimePrefixes: ['image/'],
      extensions: IMAGE_EXTS,
    });
    if (filtered.length === 0) {
      setError('폴더 안에 이미지가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  const reset = () => {
    loaded?.cleanup();
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setLoaded(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setResult(null);
    setBatchResults(null);
    setError(null);
    setWarning(null);
    setProgressText('');
    setProgress(0);
  };

  const runUpscale = async () => {
    setError(null);
    setBatchResults(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      let runtime: UpscalerRuntime | null = null;
      try {
        runtime = await initUpscalerRuntime(flavor, scale, (s) => setProgressText(s));
        const rt = runtime;
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const info = await loadImageFile(rf.file);
            try {
              const base64 = await rt.upscaler.upscale(info.element, {
                patchSize: 64,
                padding: 2,
                output: 'base64',
              });
              const { blob } = await encodeUpscaledOutput(base64, outputFormat, quality);
              return {
                relativePath: replaceExtension(rf.relativePath, formatExtension(outputFormat)),
                blob,
              };
            } finally {
              info.cleanup();
            }
          },
          {
            concurrency: 1,
            onProgress: (d, t, p) => setProgressText(`업스케일 ${d}/${t} — ${p}`),
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? `업스케일 실패: ${err.message}` : '일괄 처리 실패');
      } finally {
        runtime?.disposeAll();
        setProcessing(false);
        setProgressText('');
        setProgress(0);
      }
      return;
    }

    if (!file || !loaded) return;
    setProcessing(true);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    let runtime: UpscalerRuntime | null = null;
    try {
      runtime = await initUpscalerRuntime(flavor, scale, (s) => setProgressText(s));
      setProgressText('업스케일 처리 중');
      const base64 = await runtime.upscaler.upscale(loaded.element, {
        patchSize: 64,
        padding: 2,
        output: 'base64',
        progress: (rate: number) => {
          setProgress(Math.round(rate * 100));
          setProgressText(`업스케일 처리 중 ${Math.round(rate * 100)}%`);
        },
      });

      setProgressText('최종 인코딩');
      const { blob, width: outW, height: outH } = await encodeUpscaledOutput(
        base64,
        outputFormat,
        quality,
      );

      const newName = renameWithSuffix(file.name, `-${scale}x`, formatExtension(outputFormat));
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        fileName: newName,
        outW,
        outH,
      });
    } catch (err) {
      setError(
        err instanceof Error ? `업스케일 실패: ${err.message}` : '업스케일 처리에 실패했습니다.',
      );
    } finally {
      runtime?.disposeAll();
      setProcessing(false);
      setProgressText('');
      setProgress(0);
    }
  };

  const folderInputSize = folderFiles.reduce((s, f) => s + f.file.size, 0);
  const ready = inputMode === 'folder' ? folderFiles.length > 0 : !!file && !!loaded;

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
            <Maximize className="h-5 w-5" />
            <h1 className="font-semibold text-base">AI 이미지 업스케일</h1>
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
        <DualDropZone
          mode={inputMode}
          onModeChange={(m) => {
            setInputMode(m);
            setError(null);
            setWarning(null);
          }}
          fileProps={{
            accept: 'image/*',
            description: '저해상도 이미지를 업로드하세요',
            hint: 'ESRGAN 기반 초해상도. 1MP 이하 권장. 최초 실행 시 모델(~10MB)을 다운로드합니다.',
            onFiles: (files) => acceptFile(files[0]),
          }}
          folderProps={{
            accept: 'image/*',
            description: '폴더 안 모든 이미지를 같은 배율로 일괄 업스케일합니다. 구조 유지.',
            onFolder: onFolderPicked,
          }}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {warning && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-400">
            {warning}
          </div>
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <>
            <FolderPreviewPanel
              files={allFolderFiles}
              onSelectionChange={setFolderFiles}
              fileKindLabel="이미지"
            />
            <p className="text-[10px] text-yellow-500">
              GPU 메모리 부담이 큽니다. 동시 1장씩 처리하며, 큰 이미지는 수 분이 걸릴 수 있습니다.
            </p>
          </>
        )}

        {inputMode === 'files' && file && loaded && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {loaded.width}×{loaded.height} → 예상{' '}
                  {loaded.width * scale}×{loaded.height * scale}
                </p>
              </div>
            </div>
          </div>
        )}

        {ready && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">확대 배율</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([2, 3, 4] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    disabled={processing}
                    className={`h-10 text-sm rounded-md border font-semibold ${
                      scale === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">모델 타입</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFlavor('slim')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                    flavor === 'slim'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    Slim (빠름)
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    모델 ~5MB · 처리 빠름 · 품질 보통
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFlavor('thick')}
                  disabled={processing}
                  className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                    flavor === 'thick'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">Thick (고품질)</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    모델 ~30MB · 처리 느림 · 품질 우수
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['png', 'jpeg', 'webp'] as const).map((f) => (
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

            {processing && inputMode === 'files' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium">{progressText}</p>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {processing && inputMode === 'folder' && progressText && (
              <p className="text-xs text-muted-foreground truncate">{progressText}</p>
            )}

            <Separator />

            <Button onClick={runUpscale} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {inputMode === 'folder' ? '일괄 처리 중...' : '처리 중... (수 분 소요 가능)'}
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4" />
                  {inputMode === 'folder'
                    ? `${folderFiles.length}장 ${scale}× 업스케일`
                    : `${scale}× 업스케일 실행`}
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
                src={result.url}
                alt="결과"
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">출력 해상도</p>
                <p className="text-sm font-semibold mt-0.5">
                  {result.outW}×{result.outH}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">파일 크기</p>
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

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || `upscaled-${scale}x`}
            zipFileName={`${commonRoot(folderFiles) || 'upscaled'}-${scale}x.zip`}
            totalInputSize={folderInputSize}
          />
        )}

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          UpscalerJS + ESRGAN (MIT) · TensorFlow.js WebGL 백엔드. 모델 라이브러리는 2023년 이후 정체
          상태이므로 일부 환경에서 불안정할 수 있습니다.
        </p>
      </main>
    </div>
  );
}
