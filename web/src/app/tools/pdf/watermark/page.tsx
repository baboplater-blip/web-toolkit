'use client';

import { useRef, useState } from 'react';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import {
  ArrowLeft,
  Download,
  FileText,
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
  allPages,
  isPdfFile,
  loadPdfFromFile,
  parsePageRanges,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type WmType = 'text' | 'image';
type Position = 'center' | 'tl' | 'tr' | 'bl' | 'br';
type TargetMode = 'all' | 'range';

const POSITION_LABEL: Record<Position, string> = {
  center: '중앙',
  tl: '왼쪽 위',
  tr: '오른쪽 위',
  bl: '왼쪽 아래',
  br: '오른쪽 아래',
};

export default function PdfWatermarkPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [wmType, setWmType] = useState<WmType>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>('center');
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(60);
  const [imageScale, setImageScale] = useState(30);
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [rangeSpec, setRangeSpec] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; size: number } | null>(
    null,
  );
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  const acceptPdf = async (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    try {
      const doc = await loadPdfFromFile(f);
      setFile(f);
      setPageCount(doc.getPageCount());
      setRangeSpec(`1-${doc.getPageCount()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드 실패');
    }
  };

  const acceptImage = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일을 선택하세요.');
      return;
    }
    if (!/\/(jpeg|jpg|png)$/.test(f.type.toLowerCase())) {
      setError('JPG 또는 PNG 만 지원합니다.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setError(null);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, { extensions: ['.pdf'] });
    if (filtered.length === 0) {
      setError('폴더 안에 PDF 파일이 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  const reset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setFile(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setPageCount(0);
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const { degrees, rgb, StandardFonts } = await loadPdfLib();
    const doc = await loadPdfFromFile(srcFile);
    const total = doc.getPageCount();
    const targets = targetMode === 'all' ? allPages(total) : parsePageRanges(rangeSpec, total);
    if (targets.length === 0) {
      throw new Error('워터마크를 적용할 페이지가 없습니다.');
    }

    const pages = doc.getPages();
    const op = opacity / 100;

    if (wmType === 'text') {
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      for (const pn of targets) {
        const page = pages[pn - 1];
        const { width: pw, height: ph } = page.getSize();
        const { x, y } = computePosition(position, pw, ph, textWidth, textHeight);
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: op,
          rotate: degrees(rotation),
        });
      }
    } else {
      if (!imageFile) throw new Error('워터마크 이미지가 없습니다.');
      const imgBytes = new Uint8Array(await imageFile.arrayBuffer());
      const isJpg = imageFile.type === 'image/jpeg' || /\.jpe?g$/i.test(imageFile.name);
      const image = isJpg ? await doc.embedJpg(imgBytes) : await doc.embedPng(imgBytes);
      const scaleRatio = imageScale / 100;

      for (const pn of targets) {
        const page = pages[pn - 1];
        const { width: pw, height: ph } = page.getSize();
        const baseDim = Math.min(pw, ph) * scaleRatio;
        const ratio = baseDim / Math.max(image.width, image.height);
        const drawW = image.width * ratio;
        const drawH = image.height * ratio;
        const { x, y } = computePosition(position, pw, ph, drawW, drawH);
        page.drawImage(image, {
          x,
          y,
          width: drawW,
          height: drawH,
          opacity: op,
          rotate: degrees(rotation),
        });
      }
    }

    return saveAsBlob(doc);
  }

  const runApply = async () => {
    if (wmType === 'text' && !text.trim()) {
      setError('워터마크 텍스트를 입력하세요.');
      return;
    }
    if (wmType === 'image' && !imageFile) {
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
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await processOne(rf.file);
            return { relativePath: rf.relativePath, blob };
          },
          {
            concurrency: 2,
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

    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blob = await processOne(file);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-watermarked.pdf`,
        size: blob.size,
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
            <h1 className="font-semibold text-base">PDF 워터마크</h1>
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
              accept: 'application/pdf',
              description: '워터마크를 넣을 PDF 를 업로드하세요',
              onFiles: (files) => acceptPdf(files[0]),
            }}
            folderProps={{
              accept: 'application/pdf',
              description: '폴더 안 모든 PDF 에 같은 워터마크를 일괄 적용합니다.',
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
            fileKindLabel="PDF"
          />
        )}

        {((file && inputMode === 'files') ||
          (inputMode === 'folder' && allFolderFiles.length > 0)) && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            {inputMode === 'files' && file && (
              <>
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} · {pageCount}페이지
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
                  className={`h-9 text-xs rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
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
                  className={`h-9 text-xs rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
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
                  <label className="text-xs font-medium mb-1.5 block">텍스트 내용</label>
                  <Input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="예: CONFIDENTIAL"
                    disabled={processing}
                    className="h-9" aria-label="텍스트 내용" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Helvetica 폰트 사용. 한글은 표시되지 않을 수 있습니다.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">글자 크기</label>
                    <span className="text-xs text-muted-foreground">{fontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={2}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    disabled={processing}
                    className="w-full accent-primary" aria-label="글자 크기" />
                </div>
              </>
            )}

            {wmType === 'image' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">로고 이미지</label>
                {!imageFile ? (
                  <FileDropZone
                    accept="image/jpeg,image/png"
                    title="이미지를 선택하거나 끌어다 놓으세요"
                    description="JPG, PNG"
                    hint="투명 배경 PNG 권장"
                    onFiles={(files) => acceptImage(files[0])}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    {imagePreview && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="h-14 w-14 object-contain rounded bg-muted"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{imageFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatBytes(imageFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={clearImage}
                      disabled={processing}
                      aria-label="워터마크 이미지 제거"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}
                {imageFile && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium">이미지 크기 (페이지 대비)</label>
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
                      className="w-full accent-primary" aria-label="이미지 크기 (페이지 대비)" />
                  </div>
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
                    className={`h-9 text-[10px] rounded-md border transition-colors ${
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
                className="w-full accent-primary" aria-label="회전" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">투명도</label>
                <span className="text-xs text-muted-foreground">{opacity}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary" aria-label="투명도" />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">대상 페이지</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTargetMode('all')}
                  disabled={processing}
                  className={`h-9 text-xs rounded-md border transition-colors ${
                    targetMode === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  모든 페이지
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('range')}
                  disabled={processing}
                  className={`h-9 text-xs rounded-md border transition-colors ${
                    targetMode === 'range'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  페이지 지정
                </button>
              </div>
              {targetMode === 'range' && (
                <Input
                  type="text"
                  value={rangeSpec}
                  onChange={(e) => setRangeSpec(e.target.value)}
                  placeholder={
                    inputMode === 'folder' ? '예: 1-5, 7 (모든 PDF 에 동일 적용)' : '예: 1-5, 7'
                  }
                  disabled={processing}
                  aria-label="워터마크를 적용할 페이지 범위"
                  className="h-9 mt-2"
                />
              )}
            </div>

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
              완료
            </h2>
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.size)}
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
            zipFileName={`${commonRoot(folderFiles) || 'pdfs'}-watermarked.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}

function computePosition(
  position: Position,
  pageW: number,
  pageH: number,
  objW: number,
  objH: number,
): { x: number; y: number } {
  const margin = 30;
  switch (position) {
    case 'center':
      return { x: (pageW - objW) / 2, y: (pageH - objH) / 2 };
    case 'tl':
      return { x: margin, y: pageH - margin - objH };
    case 'tr':
      return { x: pageW - margin - objW, y: pageH - margin - objH };
    case 'bl':
      return { x: margin, y: margin };
    case 'br':
      return { x: pageW - margin - objW, y: margin };
  }
}
