'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더/토글 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_THRESHOLD = 128;
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * 각 픽셀의 휘도를 임계값과 비교해 순수 흑(0) 또는 백(255)으로 이진화한다.
 * 휘도 = 0.299R + 0.587G + 0.114B (Rec.601). 휘도 > threshold 이면 흰색,
 * 아니면 검은색이며 invert 면 흑백을 뒤집는다. R·G·B 를 같은 값으로 설정한다.
 * 알파(data[i + 3])는 보존한다.
 */
function applyThreshold(data: Uint8ClampedArray, threshold: number, invert: boolean): void {
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let value = luminance > threshold ? 255 : 0;
    if (invert) value = 255 - value;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
}

export default function ImageThresholdPage() {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [invert, setInvert] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·임계값·반전 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, threshold, invert]);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await loadBitmap(file);
      const { width, height } = bitmap;
      assertCanvasSize(width, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      ctx.drawImage(bitmap, 0, 0);

      const image = ctx.getImageData(0, 0, width, height);
      applyThreshold(image.data, threshold, invert);
      ctx.putImageData(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '임계값 변환에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setThreshold(DEFAULT_THRESHOLD);
    setInvert(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="흑백 임계값" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          임계값을 기준으로 이미지를 순수한 흑백 두 색으로 이진화합니다.
        </p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          title="이미지 1장을 끌어다 놓거나 클릭"
          maxBytes={MAX_BYTES}
        />

        {file && (
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="threshold-value">
                임계값 ({threshold})
              </label>
              <input
                id="threshold-value"
                type="range"
                min={0}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                값이 낮을수록 더 많은 영역이 흰색으로, 높을수록 검은색으로 바뀝니다.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
                className="h-4 w-4"
              />
              흑백 반전
            </label>
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
            <img src={previewUrl} alt="임계값 변환 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="threshold.png"
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
