'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileImage,
  FlipHorizontal,
  FlipVertical,
  Loader2,
  RotateCcw,
  RotateCw,
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

type Angle = 0 | 90 | 180 | 270;

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

export default function ImageRotatePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [angle, setAngle] = useState<Angle>(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; previewUrl: string } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  useEffect(() => () => loaded?.cleanup(), [loaded]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.previewUrl);
    };
  }, [result]);

  const acceptFile = async (f: File) => {
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
      const fmt = detectFormatFromFile(f) ?? 'jpeg';
      setOutputFormat(fmt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드 실패');
    }
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
    if (result) URL.revokeObjectURL(result.previewUrl);
    setFile(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setLoaded(null);
    setResult(null);
    setBatchResults(null);
    setError(null);
    setAngle(90);
    setFlipH(false);
    setFlipV(false);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const info = await loadImageFile(srcFile);
    try {
      const iw = info.width;
      const ih = info.height;
      const rotated = angle === 90 || angle === 270;
      const canvas = document.createElement('canvas');
      canvas.width = rotated ? ih : iw;
      canvas.height = rotated ? iw : ih;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');

      if (outputFormat === 'jpeg' || outputFormat === 'avif') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(info.element, -iw / 2, -ih / 2, iw, ih);
      ctx.restore();

      return await canvasToBlob(canvas, outputFormat, quality / 100);
    } finally {
      info.cleanup();
    }
  }

  const runTransform = async () => {
    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setError(null);
      setBatchResults(null);
      const ext = formatExtension(outputFormat);
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await processOne(rf.file);
            return { relativePath: replaceExtension(rf.relativePath, ext), blob };
          },
          {
            concurrency: 2,
            onProgress: (d, t, p) => setProgressText(`처리 중 ${d}/${t} — ${p}`),
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 처리 실패');
      } finally {
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
      const newName = renameWithSuffix(file.name, '-rotated', formatExtension(outputFormat));
      setResult({
        blob,
        fileName: newName,
        previewUrl: URL.createObjectURL(blob),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

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
            <RotateCw className="h-5 w-5" />
            <h1 className="font-semibold text-base">이미지 회전 / 반전</h1>
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
              description: '회전/반전할 이미지를 업로드하세요',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'image/*',
              description: '폴더 안 모든 이미지에 같은 회전/반전을 일괄 적용합니다.',
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
              <label className="text-xs font-medium mb-1.5 block">회전 각도 (시계방향)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {([0, 90, 180, 270] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAngle(a)}
                    disabled={processing}
                    className={`h-10 text-sm rounded-md border transition-colors ${
                      angle === a
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {a}°
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">반전</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFlipH((v) => !v)}
                  disabled={processing}
                  className={`h-10 text-xs rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
                    flipH
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <FlipHorizontal className="h-4 w-4" />
                  좌우 반전
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((v) => !v)}
                  disabled={processing}
                  className={`h-10 text-xs rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
                    flipV
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <FlipVertical className="h-4 w-4" />
                  상하 반전
                </button>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['jpeg', 'png', 'webp', 'avif'] as const).map((f) => (
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

            <Separator />

            <Button onClick={runTransform} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '처리 중...'}
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  {inputMode === 'folder' ? `폴더 일괄 적용 (${folderFiles.length}개)` : '적용'}
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              미리보기
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

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'rotated'}
            zipFileName={`${commonRoot(folderFiles) || 'images'}-rotated.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
