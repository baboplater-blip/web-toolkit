'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { PDFDocument, PageSizes } from '@cantoo/pdf-lib';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import {
  isImageFile,
  saveAsBlob,
  stripExtension,
  triggerDownload,
} from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

type PageSize = 'A4' | 'Letter' | 'Legal' | 'fit';
type Orientation = 'portrait' | 'landscape';
type MarginPreset = 'none' | 'small' | 'medium' | 'large';

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
}

const MARGIN_VALUES: Record<MarginPreset, number> = {
  none: 0,
  small: 20,
  medium: 40,
  large: 72,
};

export default function FromJpgPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [margin, setMargin] = useState<MarginPreset>('small');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; size: number } | null>(
    null,
  );

  const addFiles = (files: File[]) => {
    setError(null);
    setResult(null);
    const imgs = files.filter(isImageFile);
    if (imgs.length === 0) {
      setError('이미지 파일만 추가할 수 있습니다.');
      return;
    }
    const unsupported = imgs.filter(
      (f) => !/\/(jpeg|jpg|png)$/.test(f.type.toLowerCase()),
    );
    if (unsupported.length > 0) {
      setError(
        `JPG/PNG 만 지원합니다. 지원되지 않는 포맷: ${unsupported.map((f) => f.name).join(', ')}`,
      );
      return;
    }
    const newItems: QueueItem[] = imgs.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const reset = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setError(null);
    setResult(null);
  };

  const runConvert = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const doc = await PDFDocument.create();
      doc.setProducer('');
      doc.setCreator('');

      const marginPx = MARGIN_VALUES[margin];
      const baseSize =
        pageSize === 'A4'
          ? PageSizes.A4
          : pageSize === 'Letter'
            ? PageSizes.Letter
            : pageSize === 'Legal'
              ? PageSizes.Legal
              : null;

      for (let i = 0; i < items.length; i++) {
        setProgressText(`변환 중 ${i + 1}/${items.length}`);
        const { file } = items[i];
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isJpg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
        const image = isJpg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
        const imgW = image.width;
        const imgH = image.height;

        let pageW: number;
        let pageH: number;
        if (pageSize === 'fit') {
          pageW = imgW + marginPx * 2;
          pageH = imgH + marginPx * 2;
        } else {
          const [w, h] = baseSize!;
          if (orientation === 'portrait') {
            pageW = w;
            pageH = h;
          } else {
            pageW = h;
            pageH = w;
          }
        }

        const page = doc.addPage([pageW, pageH]);
        const availW = pageW - marginPx * 2;
        const availH = pageH - marginPx * 2;
        const scale = Math.min(availW / imgW, availH / imgH, 1);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        page.drawImage(image, { x, y, width: drawW, height: drawH });
      }

      setProgressText('PDF 저장 중');
      const blob = await saveAsBlob(doc);
      const baseName =
        items.length === 1 ? stripExtension(items[0].file.name) : 'images';
      setResult({
        blob,
        fileName: `${baseName}.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 생성 중 오류가 발생했습니다');
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
            <FileText className="h-5 w-5" />
            <h1 className="font-semibold text-base">JPG → PDF</h1>
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
          accept="image/jpeg,image/png"
          multiple
          title="이미지를 끌어다 놓거나 클릭하여 추가"
          description="JPG, PNG (여러 장 선택 가능)"
          onFiles={addFiles}
        />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              이미지 순서 ({items.length}장)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map((it, idx) => (
                <div key={it.id} className="relative group rounded-lg border overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.previewUrl}
                      alt={it.file.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="absolute top-1 left-1 bg-background/90 rounded px-1.5 py-0.5 text-[10px] font-mono">
                    {idx + 1}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-1.5 bg-background/90 flex items-center justify-between gap-1">
                    <p className="text-[10px] truncate flex-1">{it.file.name}</p>
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveItem(it.id, -1)}
                        disabled={idx === 0 || processing}
                        title="앞으로"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveItem(it.id, 1)}
                        disabled={idx === items.length - 1 || processing}
                        title="뒤로"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive"
                        onClick={() => removeItem(it.id)}
                        disabled={processing}
                        title="제거"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <label className="text-xs font-medium mb-1.5 block">용지 크기</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['A4', 'Letter', 'Legal', 'fit'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPageSize(s)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      pageSize === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {s === 'fit' ? '이미지 크기' : s}
                  </button>
                ))}
              </div>
            </div>

            {pageSize !== 'fit' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">방향</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['portrait', 'landscape'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOrientation(o)}
                      disabled={processing}
                      className={`h-9 text-xs rounded-md border transition-colors ${
                        orientation === o
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      {o === 'portrait' ? '세로' : '가로'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1.5 block">여백</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['none', 'small', 'medium', 'large'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMargin(m)}
                    disabled={processing}
                    className={`h-9 text-xs rounded-md border transition-colors ${
                      margin === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    } disabled:opacity-50`}
                  >
                    {m === 'none' ? '없음' : m === 'small' ? '좁게' : m === 'medium' ? '보통' : '넓게'}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <Button onClick={runConvert} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '변환 중...'}
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  PDF 로 변환
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
              생성된 PDF 크기: {formatBytes(result.size)}
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
