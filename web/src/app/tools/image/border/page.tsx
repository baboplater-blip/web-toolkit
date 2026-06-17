'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

const RENDER_DEBOUNCE_MS = 250;
const MAX_BORDER_PX = 200;
const MAX_INPUT_BYTES = 50 * 1024 * 1024;

export default function ImageBorderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [thickness, setThickness] = useState(20);
  const [color, setColor] = useState('#ffffff');
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => {
      void render(file, thickness, color);
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [file, thickness, color]);

  async function render(target: File, border: number, borderColor: string): Promise<void> {
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(target);
      const { width, height } = bitmap;
      // 결과는 원본보다 사방 border 만큼 커진다 → 2×border 추가.
      const outWidth = width + border * 2;
      const outHeight = height + border * 2;
      assertCanvasSize(outWidth, outHeight);

      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');

      // 테두리 색으로 전체를 채운 뒤 가운데에 원본을 그린다.
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, outWidth, outHeight);
      ctx.drawImage(bitmap, border, border);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))),
          'image/png',
        ),
      );
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (e) {
      console.error('[image/border] render failed', e);
      setError(e instanceof Error ? e.message : '테두리 처리에 실패했습니다.');
    } finally {
      bitmap?.close();
      setBusy(false);
    }
  }

  function reset(): void {
    setFile(null);
    setThickness(20);
    setColor('#ffffff');
    setBusy(false);
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 테두리" widthClass="max-w-2xl" onReset={file ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지에 색상·두께를 지정한 테두리를 추가합니다.</p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          maxBytes={MAX_INPUT_BYTES}
          title="이미지 1장을 끌어다 놓거나 클릭하여 선택"
          description="JPG · PNG · WebP · GIF 등"
        />

        {file && (
          <div className="space-y-3 rounded-xl border bg-card p-3">
            <div className="space-y-1">
              <label htmlFor="border-thickness" className="text-xs font-medium">
                테두리 두께 ({thickness}px)
              </label>
              <input
                id="border-thickness"
                type="range"
                min={0}
                max={MAX_BORDER_PX}
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="border-color" className="text-xs font-medium">
                테두리 색상
              </label>
              <input
                id="border-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border bg-background"
              />
              <span className="text-xs text-muted-foreground">{color}</span>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> 처리 중…
          </p>
        )}

        {previewUrl && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="테두리 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="bordered.png"
              className={buttonVariants({ variant: 'default', className: 'w-full' })}
            >
              <Download className="h-4 w-4" aria-hidden /> PNG 다운로드
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
