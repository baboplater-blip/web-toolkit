'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_STRENGTH = 100;
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * 표준 세피아 행렬을 강도 t(0~1) 로 원본과 선형 보간해 적용한다.
 * t=0 이면 원본, t=1 이면 완전 세피아.
 * 알파(data[i + 3])는 보존한다.
 */
function applySepia(data: Uint8ClampedArray, strength: number): void {
  const t = Math.min(1, Math.max(0, strength / 100));
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const sr = 0.393 * r + 0.769 * g + 0.189 * b;
    const sg = 0.349 * r + 0.686 * g + 0.168 * b;
    const sb = 0.272 * r + 0.534 * g + 0.131 * b;
    data[i] = Math.min(255, r + (sr - r) * t);
    data[i + 1] = Math.min(255, g + (sg - g) * t);
    data[i + 2] = Math.min(255, b + (sb - b) * t);
  }
}

export default function ImageSepiaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [strength, setStrength] = useState(DEFAULT_STRENGTH);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·강도 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, strength]);

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
      applySepia(image.data, strength);
      ctx.putImageData(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '세피아 변환에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setStrength(DEFAULT_STRENGTH);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="세피아 톤" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지에 따뜻한 세피아 톤을 입혀 빈티지 느낌을 줍니다.
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
            <label className="text-xs font-medium" htmlFor="sepia-strength">
              세피아 강도 ({strength}%)
            </label>
            <input
              id="sepia-strength"
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              0%는 원본, 100%는 완전한 세피아 톤입니다.
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
            <img src={previewUrl} alt="세피아 변환 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="sepia.png"
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
