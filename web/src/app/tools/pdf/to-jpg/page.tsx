'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import JSZip from 'jszip';
import type { PDFPageProxy } from 'pdfjs-dist';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  allPages,
  isPdfFile,
  parsePageRanges,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type Format = 'jpeg' | 'png';
type TargetMode = 'all' | 'range';

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjs;
}

async function renderPage(
  page: PDFPageProxy,
  scale: number,
  format: Format,
  quality: number,
): Promise<Blob> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))),
      `image/${format}`,
      format === 'jpeg' ? quality : undefined,
    );
  });
}

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<Format>('jpeg');
  const [quality, setQuality] = useState(85);
  const [scale, setScale] = useState(200); // 2.0x
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [rangeSpec, setRangeSpec] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    count: number;
    size: number;
  } | null>(null);

  const acceptFile = async (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    try {
      const pdfjs = await loadPdfJs();
      const buf = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      setFile(f);
      setPageCount(pdf.numPages);
      setRangeSpec(`1-${pdf.numPages}`);
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

  const runExtract = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

      const targets =
        targetMode === 'all' ? allPages(pdf.numPages) : parsePageRanges(rangeSpec, pdf.numPages);
      if (targets.length === 0) {
        setError('추출할 페이지가 없습니다.');
        setProcessing(false);
        return;
      }

      const baseName = stripExtension(file.name);
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const s = scale / 100;
      const q = quality / 100;

      if (targets.length === 1) {
        setProgressText(`페이지 ${targets[0]} 추출 중`);
        const page = await pdf.getPage(targets[0]);
        const blob = await renderPage(page, s, format, q);
        page.cleanup();
        setResult({
          blob,
          fileName: `${baseName}-p${targets[0]}.${ext}`,
          count: 1,
          size: blob.size,
        });
        setProcessing(false);
        setProgressText('');
        return;
      }

      const zip = new JSZip();
      let totalSize = 0;
      const digits = String(targets[targets.length - 1]).length;
      for (let i = 0; i < targets.length; i++) {
        setProgressText(`페이지 ${i + 1}/${targets.length} 변환 중`);
        const pageNum = targets[i];
        const page = await pdf.getPage(pageNum);
        const blob = await renderPage(page, s, format, q);
        totalSize += blob.size;
        const name = `${baseName}-p${String(pageNum).padStart(digits, '0')}.${ext}`;
        zip.file(name, await blob.arrayBuffer());
        page.cleanup();
      }

      setProgressText('ZIP 압축 중');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setResult({
        blob: zipBlob,
        fileName: `${baseName}-images.zip`,
        count: targets.length,
        size: totalSize,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다');
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
            <FileImage className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF → JPG</h1>
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
            maxBytes={100 * 1024 * 1024}
            description="이미지로 변환할 PDF 를 업로드하세요"
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
              <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['jpeg', 'png'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      format === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {format === 'jpeg' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">JPEG 품질</label>
                  <span className="text-xs text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={processing}
                  className="w-full accent-primary" aria-label="JPEG 품질" />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">렌더링 배율</label>
                <span className="text-xs text-muted-foreground">{(scale / 100).toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={100}
                max={400}
                step={25}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-primary" aria-label="렌더링 배율" />
              <p className="text-[10px] text-muted-foreground mt-1">
                높을수록 선명해지지만 파일 크기가 커집니다.
              </p>
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
                  placeholder="예: 1, 3, 5-7"
                  disabled={processing}
                  className="h-9 mt-2" aria-label="예: 1, 3, 5-7" />
              )}
            </div>

            <Separator />

            <Button onClick={runExtract} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '변환 중...'}
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  이미지로 변환
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
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">추출 페이지</p>
                <p className="text-sm font-semibold mt-0.5">{result.count}개</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {result.count === 1 ? '크기' : '합계'}
                </p>
                <p className="text-sm font-semibold mt-0.5">{formatBytes(result.size)}</p>
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
