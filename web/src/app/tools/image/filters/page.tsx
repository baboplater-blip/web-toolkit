'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';
import { loadBitmap, assertCanvasSize } from '@/lib/tools/image-common';

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

/** 내보내기 포맷. 불투명 사진 필터라 JPEG/WebP 로 PNG 대비 용량을 크게 줄일 수 있다. */
type ExportFormat = 'png' | 'jpeg' | 'webp';

const EXPORT_FORMATS: { id: ExportFormat; label: string; ext: string; quality?: number }[] = [
  { id: 'jpeg', label: 'JPG', ext: 'jpg', quality: 0.92 },
  { id: 'webp', label: 'WebP', ext: 'webp', quality: 0.92 },
  { id: 'png', label: 'PNG', ext: 'png' },
];

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
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jpeg');
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
      const bmp = await loadBitmap(picked);
      bitmap?.close();
      setBitmap(bmp);
      setFile(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 로드에 실패했습니다.');
    }
  }

  async function renderFilter(target: FilterId, format: ExportFormat) {
    if (!bitmap) return;
    setProcessing(true);
    setError(null);
    try {
      // 빈(투명) 결과물 방지: 브라우저 캔버스 한계 초과 시 명확히 실패시킨다.
      assertCanvasSize(bitmap.width, bitmap.height);
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

      const def = FILTERS.find((f) => f.id === target);
      if (!def) throw new Error('알 수 없는 필터입니다.');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // JPEG 는 알파 미지원 → 흰 배경으로 먼저 채워 투명 영역이 검게 나오지 않게 한다.
      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.filter = def.cssFilter ?? 'none';
      ctx.drawImage(bitmap, 0, 0);
      ctx.filter = 'none';

      if (target === 'warm' || target === 'cool') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (target === 'warm') applyTemperature(imageData.data, 25, -20);
        else applyTemperature(imageData.data, -20, 25);
        ctx.putImageData(imageData, 0, 0);
      }

      const fmt = EXPORT_FORMATS.find((f) => f.id === format);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))),
          `image/${format}`,
          fmt?.quality,
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
    void renderFilter(id, exportFormat);
  }

  function selectFormat(format: ExportFormat) {
    setExportFormat(format);
    // 이미 결과가 있으면 새 포맷으로 즉시 재인코딩(미리보기/다운로드 일치).
    if (resultBlob) void renderFilter(filterId, format);
  }

  function download() {
    if (!resultBlob || !file) return;
    const base = stripExtension(file.name);
    const ext = EXPORT_FORMATS.find((f) => f.id === exportFormat)?.ext ?? 'png';
    triggerDownload(resultBlob, `${base}-${filterId}.${ext}`);
  }

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    setFile(null);
    setFilterId('grayscale');
    setExportFormat('jpeg');
    setResultBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 필터" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">흑백·세피아·빈티지 등 인스타 풍 필터를 적용해 저장합니다.</p>

      {!file && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} maxBytes={50 * 1024 * 1024} />}

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

          <div>
            <span className="mb-1.5 block text-xs font-medium">저장 포맷</span>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selectFormat(f.id)}
                  disabled={processing}
                  className={`h-9 rounded-md border text-xs transition-colors disabled:opacity-50 ${
                    exportFormat === f.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              사진 필터는 JPG·WebP 가 PNG 보다 용량이 훨씬 작습니다.
            </p>
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
            {EXPORT_FORMATS.find((f) => f.id === exportFormat)?.label ?? 'PNG'} 다운로드
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
}
