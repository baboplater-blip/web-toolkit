'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_LEVELS = 4;
const MIN_LEVELS = 2;
const MAX_LEVELS = 8;
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * 각 채널 값을 levels 단계로 양자화해 색 단계를 줄인다(포스터화).
 * 0~255 를 (levels-1) 개 구간으로 반올림해 가장 가까운 단계 색으로 스냅한다.
 * 예: levels=2 → 0/255 두 단계, levels=4 → 0/85/170/255 네 단계.
 * 알파(data[i + 3])는 보존한다.
 */
function applyPosterize(data: Uint8ClampedArray, levels: number): void {
  const steps = levels - 1;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (Math.round((data[i] / 255) * steps) / steps) * 255;
    data[i + 1] = (Math.round((data[i + 1] / 255) * steps) / steps) * 255;
    data[i + 2] = (Math.round((data[i + 2] / 255) * steps) / steps) * 255;
  }
}

export default function ImagePosterizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·단계 수 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, levels]);

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
      applyPosterize(image.data, levels);
      ctx.putImageData(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '포스터화 변환에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setLevels(DEFAULT_LEVELS);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="이미지 포스터화" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          채널별 색 단계 수를 줄여 포스터·일러스트 같은 느낌으로 변환합니다.
        </p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          title="이미지 1장을 끌어다 놓거나 클릭"
          maxBytes={MAX_BYTES}
        />

        {file && (
          <div className="rounded-xl border bg-card p-3 space-y-1">
            <label className="text-xs font-medium" htmlFor="posterize-levels">
              채널별 색 단계 ({levels}단계)
            </label>
            <input
              id="posterize-levels"
              type="range"
              min={MIN_LEVELS}
              max={MAX_LEVELS}
              value={levels}
              onChange={(e) => setLevels(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              단계가 적을수록 색이 단순해지고, 많을수록 원본에 가까워집니다.
            </p>
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
            <img src={previewUrl} alt="포스터화 변환 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="posterize.png"
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
