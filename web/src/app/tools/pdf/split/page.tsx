'use client';

import { useState } from 'react';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  SplitSquareHorizontal,
} from 'lucide-react';
import JSZip from 'jszip';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  isPdfFile,
  loadPdfFromFile,
  parsePageRanges,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type SplitMode = 'ranges' | 'every' | 'each';

interface ResultState {
  blob: Blob;
  fileName: string;
  partCount: number;
  totalSize: number;
}

export default function PdfSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState('1-3, 4-6');
  const [everyN, setEveryN] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  // 결과 Blob 은 보관만 하고, 다운로드 시 triggerDownload 가 objectURL 수명을 직접 관리한다.

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
      setRanges(`1-${doc.getPageCount()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드 실패');
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setResult(null);
    setError(null);
  };

  const buildParts = (total: number): number[][] => {
    if (mode === 'each') {
      return Array.from({ length: total }, (_, i) => [i + 1]);
    }
    if (mode === 'every') {
      const size = Math.max(1, everyN);
      const parts: number[][] = [];
      for (let s = 1; s <= total; s += size) {
        const end = Math.min(total, s + size - 1);
        parts.push(Array.from({ length: end - s + 1 }, (_, i) => s + i));
      }
      return parts;
    }
    // 'ranges' — 콤마로 구분된 각 파트를 독립 PDF 로
    const segments = ranges.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    const parts: number[][] = [];
    for (const seg of segments) {
      const nums = parsePageRanges(seg, total);
      if (nums.length > 0) parts.push(nums);
    }
    return parts;
  };

  const runSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const { PDFDocument } = await loadPdfLib();
      const src = await loadPdfFromFile(file);
      const total = src.getPageCount();
      const parts = buildParts(total);

      if (parts.length === 0) {
        setError('유효한 페이지 범위가 없습니다.');
        setProcessing(false);
        return;
      }

      const baseName = stripExtension(file.name);

      if (parts.length === 1) {
        // 단일 결과 — ZIP 없이 바로 PDF 다운로드
        setProgressText('PDF 생성 중');
        const outDoc = await PDFDocument.create();
        const copied = await outDoc.copyPages(
          src,
          parts[0].map((p) => p - 1),
        );
        copied.forEach((p) => outDoc.addPage(p));
        const blob = await saveAsBlob(outDoc);
        const fileName = `${baseName}-p${parts[0][0]}-${parts[0][parts[0].length - 1]}.pdf`;
        setResult({
          blob,
          fileName,
          partCount: 1,
          totalSize: blob.size,
        });
        setProcessing(false);
        return;
      }

      // 다중 결과 — ZIP 압축
      const zip = new JSZip();
      let totalSize = 0;
      for (let i = 0; i < parts.length; i++) {
        setProgressText(`분할 중 ${i + 1}/${parts.length}`);
        const pages = parts[i];
        const outDoc = await PDFDocument.create();
        const copied = await outDoc.copyPages(
          src,
          pages.map((p) => p - 1),
        );
        copied.forEach((p) => outDoc.addPage(p));
        const blob = await saveAsBlob(outDoc);
        totalSize += blob.size;
        const partName = `${baseName}-part${String(i + 1).padStart(2, '0')}-p${pages[0]}-${pages[pages.length - 1]}.pdf`;
        zip.file(partName, await blob.arrayBuffer());
      }

      setProgressText('ZIP 압축 중');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setResult({
        blob: zipBlob,
        fileName: `${baseName}-split.zip`,
        partCount: parts.length,
        totalSize,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '분할 중 오류가 발생했습니다');
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
            <SplitSquareHorizontal className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 분할</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="application/pdf"
            description="단일 PDF 파일을 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
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

            <div>
              <label className="text-xs font-medium mb-1.5 block">분할 방식</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode('ranges')}
                  disabled={processing}
                  className={`py-2 px-2 text-xs rounded-md border transition-colors text-left ${
                    mode === 'ranges'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">범위 지정</div>
                  <div className="text-[10px] opacity-80 mt-0.5">1-3, 4-6</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('every')}
                  disabled={processing}
                  className={`py-2 px-2 text-xs rounded-md border transition-colors text-left ${
                    mode === 'every'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">N페이지마다</div>
                  <div className="text-[10px] opacity-80 mt-0.5">균등 분할</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('each')}
                  disabled={processing}
                  className={`py-2 px-2 text-xs rounded-md border transition-colors text-left ${
                    mode === 'each'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">각 페이지별</div>
                  <div className="text-[10px] opacity-80 mt-0.5">1페이지씩</div>
                </button>
              </div>
            </div>

            {mode === 'ranges' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  페이지 범위 (콤마로 여러 파트 구분)
                </label>
                <Input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="예: 1-3, 4-6, 7"
                  disabled={processing}
                  className="h-9" aria-label="페이지 범위 (콤마로 여러 파트 구분)" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  각 파트가 독립 PDF 로 저장됩니다. 전체 페이지: 1~{pageCount}
                </p>
              </div>
            )}

            {mode === 'every' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">페이지당 크기</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={everyN}
                    onChange={(e) => setEveryN(Math.max(1, Number(e.target.value) || 1))}
                    disabled={processing}
                    className="h-9 w-24" aria-label="페이지당 크기" />
                  <span className="text-xs text-muted-foreground">페이지씩 잘라 독립 PDF 생성</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {Math.ceil(pageCount / Math.max(1, everyN))}개 파일 생성 예정
                </p>
              </div>
            )}

            {mode === 'each' && (
              <p className="text-xs text-muted-foreground">
                {pageCount}개 파일이 생성됩니다 (각 1페이지).
              </p>
            )}

            <Separator />

            <Button onClick={runSplit} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '분할 중...'}
                </>
              ) : (
                <>
                  <SplitSquareHorizontal className="h-4 w-4" />
                  분할 실행
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
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">생성된 파일</p>
                <p className="text-sm font-semibold mt-0.5">{result.partCount}개</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {result.partCount === 1 ? '파일 크기' : '합계 크기'}
                </p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.totalSize)}</p>
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
      </main>
    </div>
  );
}
