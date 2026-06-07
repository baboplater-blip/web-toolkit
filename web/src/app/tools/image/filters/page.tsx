'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';

type FilterId =
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'highContrast';

interface FilterDef {
  id: FilterId;
  label: string;
  /** canvas ctx.filter 문자열로 표현 가능한 필터. 픽셀 연산이 필요하면 null. */
  cssFilter: string | null;
}

const FILTERS: FilterDef[] = [
  { id: 'grayscale', label: '흑백', cssFilter: 'grayscale(1)' },
  { id: 'sepia', label: '세피아', cssFilter: 'sepia(1)' },
  { id: 'invert', label: '반전', cssFilter: 'invert(1)' },
  { id: 'vintage', label: '빈티지', cssFilter: 'sepia(0.5) contrast(1.1) saturate(1.3) brightness(0.95)' },
  { id: 'warm', label: '따뜻하게', cssFilter: null },
  { id: 'cool', label: '차갑게', cssFilter: null },
  { id: 'highContrast', label: '고대비', cssFilter: 'contrast(1.6)' },
];

/**
 * cssFilter 로 표현 불가능한 색온도 보정(warm/cool)을 픽셀 단위로 적용한다.
 * warm: R↑ B↓, cool: R↓ B↑.
 */
function applyTemperature(data: Uint8ClampedArray, redDelta: number, blueDelta: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + redDelta));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + blueDelta));
  }
}

export default function ImageFiltersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [filterId, setFilterId] = useState<FilterId>('grayscale');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      bitmap?.close();
    };
  }, [bitmap]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResultBlob(null);
    try {
      const bmp = await createImageBitmap(picked);
      bitmap?.close();
      setBitmap(bmp);
      setFile(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드에 실패했습니다.');
    }
  }

  async function renderFilter(target: FilterId) {
    if (!bitmap) return;
    setProcessing(true);
    setError(null);
    try {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

      const def = FILTERS.find((f) => f.id === target);
      if (!def) throw new Error('알 수 없는 필터입니다.');

      ctx.filter = def.cssFilter ?? 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      ctx.filter = 'none';

      if (target === 'warm' || target === 'cool') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (target === 'warm') applyTemperature(imageData.data, 25, -20);
        else applyTemperature(imageData.data, -20, 25);
        ctx.putImageData(imageData, 0, 0);
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))),
          'image/png',
        );
      });
      setResultBlob(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : '필터 적용 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function selectFilter(id: FilterId) {
    setFilterId(id);
    void renderFilter(id);
  }

  function download() {
    if (!resultBlob || !file) return;
    const base = stripExtension(file.name);
    triggerDownload(resultBlob, `${base}-${filterId}.png`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden />
          이미지 필터
        </h1>
        <p className="text-sm text-muted-foreground">흑백·세피아·빈티지 등 인스타 풍 필터를 적용해 저장합니다.</p>
      </header>

      {!file && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} />}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {file && bitmap && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFilter(f.id)}
                disabled={processing}
                className={`h-10 rounded-md border text-xs transition-colors disabled:opacity-50 ${
                  filterId === f.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {processing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              적용 중...
            </div>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="필터 결과" className="max-h-[50vh] max-w-full object-contain" />
          </div>
          <Button className="w-full" onClick={download} disabled={!resultBlob}>
            <Download className="h-4 w-4" />
            PNG 다운로드
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
