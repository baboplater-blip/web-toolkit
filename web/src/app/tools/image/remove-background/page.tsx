'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Eraser,
  FileImage,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import { triggerDownload } from '@/lib/tools/file-utils';
import { loadBgRemoval } from '@/lib/tools/bg-removal-lazy';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type Quality = 'fast' | 'medium' | 'high';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];
/** 단일 이미지 권장 상한(50MB). 초과 시 메모리 부족·매우 느린 처리 위험을 안내. */
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export default function RemoveBackgroundPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>('medium');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // 단일 모드 취소 플래그 — @imgly/background-removal 은 AbortSignal 을 받지 않으므로
  // 진행 중 결과를 폐기하는 방식으로 취소를 구현한다(추론은 백그라운드에서 끝나면 버려짐).
  const singleCancelRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; fileName: string } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  // previewUrl 과 result 는 서로 독립적인 생명주기를 가지므로 정리 이펙트를 분리한다.
  // (합쳐 두면 setResult 가 여전히 표시 중인 previewUrl 까지 revoke 해 원본 미리보기가 깨진다)
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

  const accept = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 지원합니다.');
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setError('이미지가 너무 큽니다(50MB 초과). 더 작은 이미지로 시도하세요.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setBatchResults(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const { removeBackground } = await loadBgRemoval();
    return await removeBackground(srcFile, {
      model:
        quality === 'fast'
          ? 'isnet_fp16'
          : quality === 'high'
            ? 'isnet'
            : 'isnet_quint8',
      output: { format: 'image/png', quality: 0.9 },
    });
  }

  const runRemove = async () => {
    setError(null);
    setBatchResults(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await processOne(rf.file);
            return { relativePath: replaceExtension(rf.relativePath, 'png'), blob };
          },
          {
            concurrency: 1,
            signal: ctrl.signal,
            onProgress: (done, total, path) => {
              setProgress({ done, total, current: path });
              setProgressText(`처리 중 ${done}/${total} — ${path}`);
            },
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

    if (!file) {
      setError('이미지 파일을 선택해주세요.');
      return;
    }
    setProcessing(true);
    setResult(null);
    setProgressPct(0);
    setCancelling(false);
    singleCancelRef.current = false;
    setProgressText('AI 모델 로드 중 (최초 실행 시 ~40MB)');

    try {
      const { removeBackground } = await loadBgRemoval();
      const outBlob = await removeBackground(file, {
        model:
          quality === 'fast'
            ? 'isnet_fp16'
            : quality === 'high'
              ? 'isnet'
              : 'isnet_quint8',
        output: { format: 'image/png', quality: 0.9 },
        progress: (key, current, total) => {
          const pct = total > 0 ? (current / total) * 100 : 0;
          setProgressPct(Math.round(pct));
          setProgressText(key);
        },
      });

      // 취소되었으면 결과를 폐기(blob URL 도 만들지 않음).
      if (singleCancelRef.current) return;
      const url = URL.createObjectURL(outBlob);
      const fileName = renameWithSuffix(file.name, '-no-bg', 'png');
      setResult({ blob: outBlob, url, fileName });
    } catch (err) {
      if (!singleCancelRef.current) {
        setError(err instanceof Error ? err.message : '배경 제거 실패');
      }
    } finally {
      setProcessing(false);
      setProgressText('');
      setProgressPct(0);
      setCancelling(false);
    }
  };

  const cancelRun = () => {
    // 폴더(배치) 모드: AbortController 로 워커 루프 중단.
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
      return;
    }
    // 단일 모드: 진행 중 추론 결과를 폐기.
    if (inputMode === 'files' && processing && !singleCancelRef.current) {
      singleCancelRef.current = true;
      setCancelling(true);
      setProgressText('취소 중...');
    }
  };

  const folderInputSize = folderFiles.reduce((s, f) => s + f.file.size, 0);
  const ready = inputMode === 'folder' ? folderFiles.length > 0 : !!file;

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
            <Eraser className="h-5 w-5" />
            <h1 className="font-semibold text-base">AI 배경 제거</h1>
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
          }}
          fileProps={{
            accept: 'image/*',
            description: '인물·상품·오브젝트 이미지를 업로드하세요',
            hint: '최초 실행 시 AI 모델을 다운로드합니다 (약 40MB, 이후 캐시). 모든 처리는 브라우저 내.',
            onFiles: (files) => accept(files[0]),
          }}
          folderProps={{
            accept: 'image/*',
            description: '폴더 안 모든 이미지의 배경을 일괄 제거합니다 (PNG 출력). 구조 유지.',
            onFolder: onFolderPicked,
          }}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
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
              AI 모델 메모리 소모가 큽니다. 동시 1장씩 처리하므로 시간이 걸릴 수 있습니다.
            </p>
          </>
        )}

        {inputMode === 'files' && file && previewUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="원본"
                className="max-w-full max-h-[40vh] object-contain"
              />
            </div>
          </div>
        )}

        {ready && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">모델 품질</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['fast', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    disabled={processing}
                    className={`h-auto py-2 px-2 text-xs rounded-md border text-left ${
                      quality === q
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium">
                      {q === 'fast' ? '빠름' : q === 'medium' ? '보통' : '정확'}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      {q === 'fast' ? 'FP16 · 20MB' : q === 'medium' ? 'Quint8 · 40MB' : 'FP32 · 80MB'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {processing && inputMode === 'files' && (
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

            {processing && inputMode === 'folder' && progressText && !progress && (
              <p className="text-xs text-muted-foreground">{progressText}</p>
            )}

            <Separator />

            {processing && inputMode === 'files' ? (
              <div className="flex gap-2">
                <Button disabled className="flex-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelRun}
                  disabled={cancelling}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                  {cancelling ? '취소 중...' : '취소'}
                </Button>
              </div>
            ) : (
              <Button onClick={runRemove} disabled={processing} className="w-full">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    일괄 처리 중...
                  </>
                ) : (
                  <>
                    <Eraser className="h-4 w-4" />
                    {inputMode === 'folder'
                      ? `${folderFiles.length}장 일괄 배경 제거`
                      : '배경 제거'}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              결과 (투명 배경 PNG)
            </h2>
            <div
              className="rounded-lg border p-3 flex items-center justify-center"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="결과"
                className="max-w-full max-h-[40vh] object-contain"
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
            label="배경 제거 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'no-bg'}
            zipFileName={`${commonRoot(folderFiles) || 'images'}-no-bg.zip`}
            totalInputSize={folderInputSize}
          />
        )}

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          @imgly/background-removal (AGPL-3.0) 기반. 모델은 로컬에 캐시되며 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}
