'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import {
  isPdfFile,
  loadPdfFromFile,
  saveAsBlob,
  stripExtension,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

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

export default function PdfMergePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
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

  const reset = () => {
    clearResult();
    setItems([]);
    setError(null);
    setProgressText('');
  };

  const runMerge = async () => {
    if (items.length < 2) {
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
      for (let i = 0; i < items.length; i++) {
        setProgressText(`병합 중 ${i + 1}/${items.length}`);
        const { file } = items[i];
        totalOriginal += file.size;
        const src = await loadPdfFromFile(file);
        const pages = await outDoc.copyPages(src, src.getPageIndices());
        pages.forEach((p) => outDoc.addPage(p));
        totalPages += src.getPageCount();
      }

      setProgressText('PDF 저장 중');
      const blob = await saveAsBlob(outDoc);
      const fileName = `${stripExtension(items[0].file.name)}-merged.pdf`;

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
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Merge className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 합치기</h1>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <FileDropZone
          accept="application/pdf"
          multiple
          title="PDF 파일을 끌어다 놓거나 클릭하여 추가"
          description="여러 파일을 한 번에 추가할 수 있습니다"
          onFiles={addFiles}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {items.length > 0 && (
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
