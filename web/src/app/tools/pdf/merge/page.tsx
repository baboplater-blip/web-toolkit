'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  FileText,
  Loader2,
  Merge,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { PDFDocument } from '@cantoo/pdf-lib';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import { ResultCard } from '@/components/tools/ResultCard';
import {
  isPdfFile,
  loadPdfFromFile,
  saveAsBlob,
  stripExtension,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

interface QueueItem {
  id: string;
  file: File;
}

interface MergeResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  url: string;
  pageCount: number;
}

type SortMode = 'name-asc' | 'name-desc' | 'natural' | 'path';

const KO_COLLATOR = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });

export default function PdfMergePage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [allFolderPdfs, setAllFolderPdfs] = useState<RelativeFile[]>([]);
  const [folderPdfs, setFolderPdfs] = useState<RelativeFile[]>([]);
  const [folderRoot, setFolderRoot] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('natural');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);

  const clearResult = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const addFiles = (files: File[]) => {
    clearResult();
    setError(null);
    const pdfs = files.filter(isPdfFile);
    if (pdfs.length === 0) {
      setError('PDF 파일만 추가할 수 있습니다.');
      return;
    }
    const newItems: QueueItem[] = pdfs.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const moveItem = (id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const onFolderPicked = (files: RelativeFile[]) => {
    clearResult();
    setError(null);
    const filtered = filterFiles(files, { extensions: ['.pdf'] });
    if (filtered.length === 0) {
      setError('폴더 안에 PDF 가 없습니다.');
      setAllFolderPdfs([]);
      setFolderPdfs([]);
      return;
    }
    setAllFolderPdfs(filtered);
    setFolderPdfs(filtered);
    setFolderRoot(commonRoot(filtered));
  };

  const reset = () => {
    clearResult();
    setItems([]);
    setAllFolderPdfs([]);
    setFolderPdfs([]);
    setFolderRoot('');
    setError(null);
    setProgressText('');
  };

  function sortedFolderPdfs(): RelativeFile[] {
    const arr = [...folderPdfs];
    switch (sortMode) {
      case 'name-asc':
        arr.sort((a, b) => KO_COLLATOR.compare(a.file.name, b.file.name));
        break;
      case 'name-desc':
        arr.sort((a, b) => KO_COLLATOR.compare(b.file.name, a.file.name));
        break;
      case 'path':
        arr.sort((a, b) => KO_COLLATOR.compare(a.relativePath, b.relativePath));
        break;
      case 'natural':
      default:
        // Intl.Collator numeric=true 가 '2.pdf' < '10.pdf' 처리
        arr.sort((a, b) => KO_COLLATOR.compare(a.file.name, b.file.name));
    }
    return arr;
  }

  const runMerge = async () => {
    const sourceFiles =
      inputMode === 'folder'
        ? sortedFolderPdfs().map((rf) => rf.file)
        : items.map((it) => it.file);

    if (sourceFiles.length < 2) {
      setError('최소 2개 이상의 PDF 파일이 필요합니다.');
      return;
    }
    setProcessing(true);
    setError(null);
    clearResult();

    try {
      const outDoc = await PDFDocument.create();
      outDoc.setProducer('');
      outDoc.setCreator('');

      let totalOriginal = 0;
      let totalPages = 0;
      for (let i = 0; i < sourceFiles.length; i++) {
        const file = sourceFiles[i];
        setProgressText(`병합 중 ${i + 1}/${sourceFiles.length} — ${file.name}`);
        totalOriginal += file.size;
        const src = await loadPdfFromFile(file);
        const pages = await outDoc.copyPages(src, src.getPageIndices());
        pages.forEach((p) => outDoc.addPage(p));
        totalPages += src.getPageCount();
      }

      setProgressText('PDF 저장 중');
      const blob = await saveAsBlob(outDoc);
      const baseName =
        inputMode === 'folder' && folderRoot
          ? folderRoot
          : stripExtension(sourceFiles[0].name);
      const fileName = `${baseName}-merged.pdf`;

      setResult({
        fileName,
        originalSize: totalOriginal,
        compressedSize: blob.size,
        url: URL.createObjectURL(blob),
        pageCount: totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '병합 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
      setProgressText('');
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
            <Merge className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 합치기</h1>
          </div>
          {(items.length > 0 || allFolderPdfs.length > 0) && (
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
            accept: 'application/pdf',
            multiple: true,
            title: 'PDF 파일을 끌어다 놓거나 클릭하여 추가',
            description: '여러 파일을 한 번에 추가할 수 있습니다',
            onFiles: addFiles,
          }}
          folderProps={{
            accept: 'application/pdf',
            description: '폴더 안의 PDF 들을 자동 정렬하여 한 개로 합칩니다.',
            onFolder: onFolderPicked,
          }}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {inputMode === 'folder' && allFolderPdfs.length > 0 && (
          <FolderPreviewPanel
            files={allFolderPdfs}
            onSelectionChange={setFolderPdfs}
            fileKindLabel="PDF"
          />
        )}

        {inputMode === 'folder' && folderPdfs.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                정렬 방식
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ['natural', '이름 (자연순)'],
                    ['name-asc', '이름 오름차순'],
                    ['name-desc', '이름 내림차순'],
                    ['path', '전체 경로'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSortMode(v)}
                    disabled={processing}
                    className={`h-8 text-[10px] rounded-md border ${
                      sortMode === v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <details className="text-[11px]">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                병합 순서 미리보기
              </summary>
              <ol className="mt-2 max-h-40 overflow-y-auto space-y-0.5 text-[10px] font-mono text-muted-foreground list-decimal pl-6">
                {sortedFolderPdfs().slice(0, 100).map((rf, i) => (
                  <li key={i} className="truncate">
                    {rf.relativePath}
                  </li>
                ))}
                {folderPdfs.length > 100 && (
                  <li className="italic list-none">… 외 {folderPdfs.length - 100}개</li>
                )}
              </ol>
            </details>

            <Separator />

            <Button
              onClick={runMerge}
              disabled={processing || folderPdfs.length < 2}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '합치는 중...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  폴더 PDF 합치기 ({folderPdfs.length}개)
                </>
              )}
            </Button>
          </div>
        )}

        {inputMode === 'files' && items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                파일 순서 ({items.length}개)
              </h2>
              <span className="text-[10px] text-muted-foreground">↑↓ 버튼으로 순서 변경</span>
            </div>

            <div className="space-y-1.5">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex items-center gap-2 rounded-lg border p-2"
                >
                  <span className="shrink-0 w-5 text-center text-xs text-muted-foreground font-mono">
                    {idx + 1}
                  </span>
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{it.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(it.file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => moveItem(it.id, -1)}
                    disabled={idx === 0 || processing}
                    title="위로"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => moveItem(it.id, 1)}
                    disabled={idx === items.length - 1 || processing}
                    title="아래로"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive"
                    onClick={() => removeItem(it.id)}
                    disabled={processing}
                    title="제거"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <Button
              onClick={runMerge}
              disabled={processing || items.length < 2}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '합치는 중...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  PDF 합치기 ({items.length}개)
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <ResultCard
            fileName={result.fileName}
            originalSize={result.originalSize}
            compressedSize={result.compressedSize}
            blobUrl={result.url}
            extraInfo={`${result.pageCount}페이지 통합`}
          />
        )}
      </main>
    </div>
  );
}
