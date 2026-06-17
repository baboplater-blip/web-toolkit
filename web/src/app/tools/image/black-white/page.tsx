'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button, buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

type Mode = 'grayscale' | 'threshold';

// 슬라이더/모드 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_THRESHOLD = 128;

/** 표준 휘도 계수(Rec. 601). 사람 눈의 채널 민감도 반영. */
function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export default function ImageBlackWhitePage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('grayscale');
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·모드·임계값 변경 시 디바운스 후 재처리. (effect 안에서 동기 setState 금지 — 비동기 render 호출)
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, mode, threshold]);

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
      const data = image.data;
      const useThreshold = mode === 'threshold';
      for (let i = 0; i < data.length; i += 4) {
        const lum = luminance(data[i], data[i + 1], data[i + 2]);
        const value = useThreshold ? (lum >= threshold ? 255 : 0) : Math.round(lum);
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        // 알파(data[i + 3])는 보존.
      }
      ctx.putImageData(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '흑백 변환에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setMode('grayscale');
    setThreshold(DEFAULT_THRESHOLD);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="흑백 변환" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지를 그레이스케일 또는 순흑백(임계값)으로 변환합니다.
        </p>

        <FileDropZone
          accept="image/*"
          onFiles={(f) => setFile(f[0] ?? null)}
          onError={setError}
          title="이미지 1장을 끌어다 놓거나 클릭"
          maxBytes={50 * 1024 * 1024}
        />

        {file && (
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium">변환 모드</p>
              <div className="flex flex-wrap gap-2">
                <Button variant={mode === 'grayscale' ? 'default' : 'outline'} size="sm" onClick={() => setMode('grayscale')}>
                  그레이스케일
                </Button>
                <Button variant={mode === 'threshold' ? 'default' : 'outline'} size="sm" onClick={() => setMode('threshold')}>
                  순흑백(임계값)
                </Button>
              </div>
            </div>
            {mode === 'threshold' && (
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="bw-threshold">
                  임계값 ({threshold})
                </label>
                <input
                  id="bw-threshold"
                  type="range"
                  min={0}
                  max={255}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  밝기가 임계값 이상이면 흰색, 미만이면 검은색으로 처리합니다.
                </p>
              </div>
            )}
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
            <img src={previewUrl} alt="흑백 변환 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="black-white.png"
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
