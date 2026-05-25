'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { rgb, StandardFonts } from '@cantoo/pdf-lib';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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

type Position = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';
type FormatType = 'num' | 'num-total' | 'page-num' | 'page-num-total';
type TargetMode = 'all' | 'range';

const POSITION_LABEL: Record<Position, string> = {
  tl: '↖',
  tc: '↑',
  tr: '↗',
  bl: '↙',
  bc: '↓',
  br: '↘',
};

function formatNumber(type: FormatType, current: number, total: number): string {
  switch (type) {
    case 'num':
      return String(current);
    case 'num-total':
      return `${current} / ${total}`;
    case 'page-num':
      return `페이지 ${current}`;
    case 'page-num-total':
      return `페이지 ${current} / ${total}`;
  }
}

export default function PageNumbersPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>('bc');
  const [formatType, setFormatType] = useState<FormatType>('num-total');
  const [fontSize, setFontSize] = useState(12);
  const [margin, setMargin] = useState(30);
  const [startNumber, setStartNumber] = useState(1);
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

  const acceptFile = async (f: File) => {
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
    setFile(null);
    setAllFolderFiles([]);
    setFolderFiles([]);
    setPageCount(0);
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  async function processOne(srcFile: File): Promise<Blob> {
    const doc = await loadPdfFromFile(srcFile);
    const total = doc.getPageCount();
    const targets = targetMode === 'all' ? allPages(total) : parsePageRanges(rangeSpec, total);
    if (targets.length === 0) {
      throw new Error('페이지 번호를 삽입할 대상이 없습니다.');
    }

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const targetTotal = targets.length;

    for (let i = 0; i < targets.length; i++) {
      const pageIdx = targets[i] - 1;
      const page = pages[pageIdx];
      const { width: w, height: h } = page.getSize();
      const currentNum = startNumber + i;
      const text = formatNumber(formatType, currentNum, startNumber + targetTotal - 1);
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x = margin;
      let y = margin;
      switch (position) {
        case 'tl':
          x = margin;
          y = h - margin - fontSize;
          break;
        case 'tc':
          x = (w - textWidth) / 2;
          y = h - margin - fontSize;
          break;
        case 'tr':
          x = w - margin - textWidth;
          y = h - margin - fontSize;
          break;
        case 'bl':
          x = margin;
          y = margin;
          break;
        case 'bc':
          x = (w - textWidth) / 2;
          y = margin;
          break;
        case 'br':
          x = w - margin - textWidth;
          y = margin;
          break;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    return saveAsBlob(doc);
  }

  const runApply = async () => {
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
        fileName: `${baseName}-numbered.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다');
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
            <Layers className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 페이지 번호</h1>
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
              description: '페이지 번호를 삽입할 PDF 를 업로드하세요',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'application/pdf',
              description: '폴더 안 모든 PDF 에 페이지 번호를 일괄 삽입합니다.',
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
              <label className="text-xs font-medium mb-1.5 block">위치</label>
              <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                {(['tl', 'tc', 'tr'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosition(p)}
                    disabled={processing}
                    className={`h-10 text-base rounded-md border transition-colors ${
                      position === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {POSITION_LABEL[p]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['bl', 'bc', 'br'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosition(p)}
                    disabled={processing}
                    className={`h-10 text-base rounded-md border transition-colors ${
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
              <label className="text-xs font-medium mb-1.5 block">형식</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ['num', '1'],
                    ['num-total', '1 / N'],
                    ['page-num', '페이지 1'],
                    ['page-num-total', '페이지 1 / N'],
                  ] as const
                ).map(([f, label]) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormatType(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      formatType === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">글자 크기</label>
                <Input
                  type="number"
                  min={6}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Math.max(6, Number(e.target.value) || 12))}
                  disabled={processing}
                  className="h-9" aria-label="글자 크기" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">여백 (px)</label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={margin}
                  onChange={(e) => setMargin(Math.max(0, Number(e.target.value) || 0))}
                  disabled={processing}
                  className="h-9" aria-label="여백 (px)" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">시작 번호</label>
                <Input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value) || 1))}
                  disabled={processing}
                  className="h-9" aria-label="시작 번호" />
              </div>
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
                    inputMode === 'folder' ? '예: 2-10 (모든 PDF 에 동일 적용)' : '예: 2-10'
                  }
                  disabled={processing}
                  aria-label="페이지 번호를 넣을 페이지 범위"
                  className="h-9 mt-2"
                />
              )}
            </div>

            <Separator />

            <Button onClick={runApply} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '삽입 중...'}
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  {inputMode === 'folder'
                    ? `폴더 일괄 삽입 (${folderFiles.length}개)`
                    : '페이지 번호 삽입'}
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
              출력 크기: {formatBytes(result.size)}
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
            label="페이지 번호 추가 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'numbered'}
            zipFileName={`${commonRoot(folderFiles) || 'pdfs'}-numbered.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}
