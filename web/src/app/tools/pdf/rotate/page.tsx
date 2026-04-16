'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { degrees } from 'pdf-lib';
import { Button } from '@/components/ui/button';
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
import { formatBytes } from '@/lib/compress/format';

type Angle = 90 | 180 | 270;
type TargetMode = 'all' | 'range';

export default function PdfRotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [angle, setAngle] = useState<Angle>(90);
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [rangeSpec, setRangeSpec] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    originalSize: number;
    outputSize: number;
  } | null>(null);

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

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setResult(null);
    setError(null);
  };

  const runRotate = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const doc = await loadPdfFromFile(file);
      const total = doc.getPageCount();
      const targets =
        targetMode === 'all' ? allPages(total) : parsePageRanges(rangeSpec, total);

      if (targets.length === 0) {
        setError('회전 대상 페이지가 없습니다.');
        setProcessing(false);
        return;
      }

      const pages = doc.getPages();
      for (const p of targets) {
        const page = pages[p - 1];
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      }

      const blob = await saveAsBlob(doc);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-rotated.pdf`,
        originalSize: file.size,
        outputSize: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회전 중 오류가 발생했습니다');
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
            <h1 className="font-semibold text-base">PDF 회전</h1>
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
            description="회전할 PDF 파일을 업로드하세요"
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
              <label className="text-xs font-medium mb-1.5 block">회전 각도</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([90, 180, 270] as const).map((a) => (
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
              <p className="text-[10px] text-muted-foreground mt-1">시계 방향 기준</p>
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
                  className="h-9 mt-2"
                />
              )}
            </div>

            <Separator />

            <Button onClick={runRotate} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  회전 중...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  회전 적용 ({angle}°)
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
              원본 {formatBytes(result.originalSize)} → 처리 후 {formatBytes(result.outputSize)}
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
