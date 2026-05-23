'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Crop,
  Download,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  allPages,
  isPdfFile,
  loadPdfFromFile,
  parsePageRanges,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { renderThumbnail, openPdf, type Thumbnail } from '@/lib/tools/pdf-thumbnails';
import { formatBytes } from '@/lib/compress/format';

type TargetMode = 'all' | 'range';

export default function PdfCropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [previewThumb, setPreviewThumb] = useState<Thumbnail | null>(null);
  const [marginTop, setMarginTop] = useState(0);
  const [marginRight, setMarginRight] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [marginLeft, setMarginLeft] = useState(0);
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [rangeSpec, setRangeSpec] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; size: number } | null>(
    null,
  );

  const acceptFile = async (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const pdf = await openPdf(f);
      const numPages = pdf.numPages;
      const thumb = await renderThumbnail(pdf, 1, 360);
      pdf.destroy();
      setFile(f);
      setPageCount(numPages);
      setRangeSpec(`1-${numPages}`);
      setPreviewThumb(thumb);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setPreviewThumb(null);
    setMarginTop(0);
    setMarginRight(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setResult(null);
    setError(null);
  };

  const runCrop = async () => {
    if (!file || !previewThumb) return;
    if (
      marginTop + marginBottom >= previewThumb.originalHeight ||
      marginLeft + marginRight >= previewThumb.originalWidth
    ) {
      setError('여백이 페이지 크기를 초과합니다. 값을 줄여주세요.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const doc = await loadPdfFromFile(file);
      const total = doc.getPageCount();
      const targets =
        targetMode === 'all' ? allPages(total) : parsePageRanges(rangeSpec, total);
      if (targets.length === 0) {
        setError('자를 대상 페이지가 없습니다.');
        setProcessing(false);
        return;
      }

      const pages = doc.getPages();
      for (const pn of targets) {
        const page = pages[pn - 1];
        // getCropBox 는 [x, y, width, height] 반환. PDF 좌표계: 좌하단 원점.
        const cb = page.getCropBox();
        const newX = cb.x + marginLeft;
        const newY = cb.y + marginBottom;
        const newW = cb.width - marginLeft - marginRight;
        const newH = cb.height - marginTop - marginBottom;
        if (newW <= 0 || newH <= 0) continue;
        page.setCropBox(newX, newY, newW, newH);
      }

      const blob = await saveAsBlob(doc);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-cropped.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '자르기 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  // 미리보기 영역 위에 자를 범위를 표시 (thumbnail 픽셀 단위)
  const previewOverlay = previewThumb
    ? {
        topPct: (marginTop / previewThumb.originalHeight) * 100,
        rightPct: (marginRight / previewThumb.originalWidth) * 100,
        bottomPct: (marginBottom / previewThumb.originalHeight) * 100,
        leftPct: (marginLeft / previewThumb.originalWidth) * 100,
      }
    : null;

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
            <Crop className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 여백 자르기</h1>
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
        {!file && !loading && (
          <FileDropZone
            accept="application/pdf"
            description="여백을 자를 PDF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {loading && (
          <div className="rounded-xl border bg-card p-6 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground mb-2" />
            <p className="text-sm">미리보기 생성 중...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && previewThumb && !loading && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {pageCount}페이지 · 원본 크기{' '}
                  {Math.round(previewThumb.originalWidth)}×
                  {Math.round(previewThumb.originalHeight)}pt
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">미리보기 (1페이지)</label>
              <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewThumb.dataUrl}
                    alt="preview"
                    className="max-w-full max-h-[50vh] block"
                  />
                  {previewOverlay && (
                    <>
                      {/* top margin overlay */}
                      <div
                        className="absolute top-0 left-0 right-0 bg-destructive/40 border-b-2 border-destructive"
                        style={{ height: `${previewOverlay.topPct}%` }}
                      />
                      {/* bottom margin overlay */}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-destructive/40 border-t-2 border-destructive"
                        style={{ height: `${previewOverlay.bottomPct}%` }}
                      />
                      {/* left margin overlay */}
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-destructive/40 border-r-2 border-destructive"
                        style={{ width: `${previewOverlay.leftPct}%` }}
                      />
                      {/* right margin overlay */}
                      <div
                        className="absolute top-0 bottom-0 right-0 bg-destructive/40 border-l-2 border-destructive"
                        style={{ width: `${previewOverlay.rightPct}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                붉은색 영역이 잘려나갑니다.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">자를 여백 (pt, 72pt = 1인치)</label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ['위', marginTop, setMarginTop],
                    ['오른쪽', marginRight, setMarginRight],
                    ['아래', marginBottom, setMarginBottom],
                    ['왼쪽', marginLeft, setMarginLeft],
                  ] as Array<[string, number, (n: number) => void]>
                ).map(([label, value, setter]) => (
                  <div key={label}>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">
                      {label}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => setter(Math.max(0, Number(e.target.value) || 0))}
                      disabled={processing}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => {
                    setMarginTop(0);
                    setMarginRight(0);
                    setMarginBottom(0);
                    setMarginLeft(0);
                  }}
                  disabled={processing}
                >
                  초기화
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => {
                    setMarginTop(36);
                    setMarginRight(36);
                    setMarginBottom(36);
                    setMarginLeft(36);
                  }}
                  disabled={processing}
                >
                  0.5인치 일괄
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => {
                    setMarginTop(72);
                    setMarginRight(72);
                    setMarginBottom(72);
                    setMarginLeft(72);
                  }}
                  disabled={processing}
                >
                  1인치 일괄
                </Button>
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
                  placeholder="예: 2-10"
                  disabled={processing}
                  className="h-9 mt-2"
                />
              )}
            </div>

            <Separator />

            <Button onClick={runCrop} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자르는 중...
                </>
              ) : (
                <>
                  <Crop className="h-4 w-4" />
                  여백 자르기
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              CropBox 만 조정합니다. 데이터는 삭제되지 않아 뷰어에서 원본 복원이 가능할 수 있습니다.
            </p>
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
      </main>
    </div>
  );
}
