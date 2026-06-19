'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더/토글 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_AMOUNT = 30;
const MAX_BYTES = 50 * 1024 * 1024;

/** 0~255 범위로 클램프한다. */
function clamp255(value: number): number {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value;
}

/**
 * 각 픽셀에 무작위 노이즈를 더한다. amount(0~100)는 ±오프셋의 최대 폭을 정한다.
 * Math.random 은 마운트 후 사용자가 파일을 올린 뒤 호출되는 처리 함수 안에서만
 * 쓰이므로 초기 렌더 결정성(하이드레이션)에 영향을 주지 않는다.
 * monochrome=true 면 R·G·B 에 같은 오프셋을, false 면 채널별 독립 오프셋을 더한다.
 * 알파(data[i + 3])는 보존한다.
 */
function applyNoise(data: Uint8ClampedArray, amount: number, monochrome: boolean): void {
  // amount 비율을 ±range 픽셀 폭으로 환산(최대 ±127).
  const range = (Math.min(100, Math.max(0, amount)) / 100) * 127;
  for (let i = 0; i < data.length; i += 4) {
    if (monochrome) {
      const offset = (Math.random() * 2 - 1) * range;
      data[i] = clamp255(data[i] + offset);
      data[i + 1] = clamp255(data[i + 1] + offset);
      data[i + 2] = clamp255(data[i + 2] + offset);
    } else {
      data[i] = clamp255(data[i] + (Math.random() * 2 - 1) * range);
      data[i + 1] = clamp255(data[i + 1] + (Math.random() * 2 - 1) * range);
      data[i + 2] = clamp255(data[i + 2] + (Math.random() * 2 - 1) * range);
    }
  }
}

export default function ImageNoisePage() {
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [monochrome, setMonochrome] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·노이즈량·색상 모드 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, amount, monochrome]);

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
      applyNoise(image.data, amount, monochrome);
      ctx.putImageData(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '노이즈 적용에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setAmount(DEFAULT_AMOUNT);
    setMonochrome(true);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="노이즈/필름 그레인" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          사진에 무작위 노이즈를 더해 필름 그레인 같은 거친 질감을 만듭니다.
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
              <label className="text-xs font-medium" htmlFor="noise-amount">
                노이즈 강도 ({amount}%)
              </label>
              <input
                id="noise-amount"
                type="range"
                min={0}
                max={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                0%는 원본, 100%는 가장 거친 노이즈입니다.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={monochrome}
                onChange={(e) => setMonochrome(e.target.checked)}
                className="h-4 w-4"
              />
              흑백 노이즈 (끄면 컬러 노이즈)
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
            <img src={previewUrl} alt="노이즈 적용 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="noise.png"
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
