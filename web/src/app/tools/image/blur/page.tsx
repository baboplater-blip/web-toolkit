'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 재처리 디바운스(ms): 슬라이더 연속 조작 시 마지막 값만 처리한다.
const RENDER_DEBOUNCE_MS = 250;
const MAX_BLUR_PX = 50;
const MAX_INPUT_BYTES = 50 * 1024 * 1024;

export default function ImageBlurPage() {
  const [file, setFile] = useState<File | null>(null);
  const [radius, setRadius] = useState(8);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 결과 blob URL 누수 방지: 교체·언마운트 시 직전 URL 폐기.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 파일·반경 변경 시 디바운스 후 재렌더. effect 안에서 동기 setState 를 피하려고
  // 비동기 render() 만 호출한다(첫 setState 는 render 내부에서 발생).
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => {
      void render(file, radius);
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [file, radius]);

  async function render(target: File, blurRadius: number): Promise<void> {
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(target);
      const { width, height } = bitmap;
      assertCanvasSize(width, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');

      // 0px 이면 필터를 지정하지 않아 원본 그대로 그린다.
      ctx.filter = blurRadius > 0 ? `blur(${blurRadius}px)` : 'none';
      ctx.drawImage(bitmap, 0, 0);

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
      console.error('[image/blur] render failed', e);
      setError(e instanceof Error ? e.message : '블러 처리에 실패했습니다.');
    } finally {
      bitmap?.close();
      setBusy(false);
    }
  }

  function reset(): void {
    setFile(null);
    setRadius(8);
    setBusy(false);
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 흐리게" widthClass="max-w-2xl" onReset={file ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">이미지 전체에 가우시안 블러를 적용합니다.</p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          maxBytes={MAX_INPUT_BYTES}
          title="이미지 1장을 끌어다 놓거나 클릭하여 선택"
          description="JPG · PNG · WebP · GIF 등"
        />

        {file && (
          <div className="space-y-1 rounded-xl border bg-card p-3">
            <label htmlFor="blur-radius" className="text-xs font-medium">
              블러 반경 ({radius}px)
            </label>
            <input
              id="blur-radius"
              type="range"
              min={0}
              max={MAX_BLUR_PX}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
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
            <img src={previewUrl} alt="블러 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="blurred.png"
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
