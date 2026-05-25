'use client';

import { useState } from 'react';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';
import {
  ArrowLeft,
  MoveLeft,
  MoveRight,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  isPdfFile,
  loadPdfFromFile,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { renderAllThumbnails, type Thumbnail } from '@/lib/tools/pdf-thumbnails';
import { formatBytes } from '@/lib/compress/format';

interface Slot {
  /** 슬롯 고유 ID (복제 시 서로 다른 id 부여) */
  id: string;
  /** 원본 페이지 번호 (1-based). pdf-lib copyPages 소스로 사용. */
  sourcePage: number;
}

export default function PdfOrganizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
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
      const thumbs = await renderAllThumbnails(f, (c, t) => {
        setLoadProgress(`썸네일 생성 중 ${c}/${t}`);
      });
      setFile(f);
      setThumbnails(thumbs);
      setSlots(
        thumbs.map((t) => ({
          id: `s-${t.pageNumber}-${Math.random().toString(36).slice(2, 7)}`,
          sourcePage: t.pageNumber,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 로드 실패');
    } finally {
      setLoading(false);
      setLoadProgress('');
    }
  };

  const reset = () => {
    setFile(null);
    setThumbnails([]);
    setSlots([]);
    setResult(null);
    setError(null);
  };

  const moveSlot = (id: string, dir: -1 | 1) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const deleteSlot = (id: string) =>
    setSlots((prev) => prev.filter((s) => s.id !== id));

  const duplicateSlot = (id: string) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const clone: Slot = {
        id: `s-${prev[idx].sourcePage}-${Math.random().toString(36).slice(2, 7)}`,
        sourcePage: prev[idx].sourcePage,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  };

  const resetSlots = () => {
    if (!file) return;
    setSlots(
      thumbnails.map((t) => ({
        id: `s-${t.pageNumber}-${Math.random().toString(36).slice(2, 7)}`,
        sourcePage: t.pageNumber,
      })),
    );
  };

  const runSave = async () => {
    if (!file) return;
    if (slots.length === 0) {
      setError('최소 1개 이상의 페이지가 필요합니다.');
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const { PDFDocument } = await loadPdfLib();
      const src = await loadPdfFromFile(file);
      const outDoc = await PDFDocument.create();
      outDoc.setProducer('');
      outDoc.setCreator('');

      const pageIndices = slots.map((s) => s.sourcePage - 1);
      const copied = await outDoc.copyPages(src, pageIndices);
      copied.forEach((p) => outDoc.addPage(p));

      const blob = await saveAsBlob(outDoc);
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-organized.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Shuffle className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 페이지 정리</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {!file && !loading && (
          <FileDropZone
            accept="application/pdf"
            description="페이지 순서를 바꾸거나 삭제할 PDF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {loading && (
          <div className="rounded-xl border bg-card p-6 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground mb-2" />
            <p className="text-sm">{loadProgress || '로딩 중...'}</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && !loading && (
          <>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · 원본 {thumbnails.length}페이지 · 현재{' '}
                    {slots.length}페이지
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={resetSlots}
                  disabled={processing}
                >
                  원본 순서로
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                페이지 배열
              </h2>

              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  모든 페이지가 삭제되었습니다. &ldquo;원본 순서로&rdquo; 를 눌러 복원하세요.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {slots.map((slot, idx) => {
                    const thumb = thumbnails[slot.sourcePage - 1];
                    return (
                      <div
                        key={slot.id}
                        className="relative group rounded-lg border overflow-hidden bg-muted"
                      >
                        <div className="aspect-[3/4] flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb.dataUrl}
                            alt={`페이지 ${slot.sourcePage}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="absolute top-1 left-1 bg-background/90 rounded px-1.5 py-0.5 text-[10px] font-mono">
                          {idx + 1}번
                        </div>
                        <div className="absolute top-1 right-1 bg-background/90 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          p.{slot.sourcePage}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-1 bg-background/95 flex items-center justify-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveSlot(slot.id, -1)}
                            disabled={idx === 0 || processing}
                            title="앞으로"
                          >
                            <MoveLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveSlot(slot.id, 1)}
                            disabled={idx === slots.length - 1 || processing}
                            title="뒤로"
                          >
                            <MoveRight className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => duplicateSlot(slot.id)}
                            disabled={processing}
                            title="복제"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteSlot(slot.id)}
                            disabled={processing}
                            title="삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              <Button
                onClick={runSave}
                disabled={processing || slots.length === 0}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Shuffle className="h-4 w-4" />
                    정리된 PDF 저장 ({slots.length}페이지)
                  </>
                )}
              </Button>
            </div>
          </>
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
