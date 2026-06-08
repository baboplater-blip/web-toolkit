'use client';

import { useEffect, useRef, useState } from 'react';
import { Droplets, Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_SHADOW = '#1b1f3b';
const DEFAULT_HIGHLIGHT = '#f5d76e';

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** Rec. 601 휘도(0~1) */
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * 각 픽셀 휘도를 shadow~highlight 두 색 사이로 선형 매핑한다.
 * 알파는 원본 유지.
 */
function applyDuotone(data: Uint8ClampedArray, shadow: Rgb, highlight: Rgb): void {
  for (let i = 0; i < data.length; i += 4) {
    const t = luminance(data[i], data[i + 1], data[i + 2]);
    data[i] = Math.round(shadow.r + (highlight.r - shadow.r) * t);
    data[i + 1] = Math.round(shadow.g + (highlight.g - shadow.g) * t);
    data[i + 2] = Math.round(shadow.b + (highlight.b - shadow.b) * t);
  }
}

export default function ImageDuotonePage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [shadowColor, setShadowColor] = useState(DEFAULT_SHADOW);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => () => bitmap?.close(), [bitmap]);
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

  async function render() {
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyDuotone(imageData.data, hexToRgb(shadowColor), hexToRgb(highlightColor));
      ctx.putImageData(imageData, 0, 0);

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
      setError(err instanceof Error ? err.message : '듀오톤 변환 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultBlob || !file) return;
    triggerDownload(resultBlob, `${stripExtension(file.name)}-duotone.png`);
  }

  function handleReset() {
    setBitmap((prev) => {
      prev?.close();
      return null;
    });
    setFile(null);
    setResultBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="듀오톤" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지를 두 가지 색조의 듀오톤으로 변환합니다.</p>

      {!file && <FileDropZone accept="image/*" onFiles={handleFiles} onError={setError} />}

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {file && bitmap && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium">어두운 색 (그림자)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  aria-label="어두운 색"
                />
                <span className="font-mono text-xs text-muted-foreground">{shadowColor}</span>
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">밝은 색 (하이라이트)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  aria-label="밝은 색"
                />
                <span className="font-mono text-xs text-muted-foreground">{highlightColor}</span>
              </div>
            </label>
          </div>

          <Button className="w-full" onClick={render} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Droplets className="h-4 w-4" />}
            듀오톤 적용
          </Button>
        </div>
      )}

      {previewUrl && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="듀오톤 결과" className="max-h-[50vh] max-w-full object-contain" />
          </div>
          <Button className="w-full" onClick={download} disabled={!resultBlob}>
            <Download className="h-4 w-4" />
            PNG 다운로드
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
}
