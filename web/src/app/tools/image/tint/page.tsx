'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더/색상 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_COLOR = '#1e90ff';
const DEFAULT_OPACITY = 40;
const MAX_BYTES = 50 * 1024 * 1024;

export default function ImageTintPage() {
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·색상·불투명도 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, color, opacity]);

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
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      ctx.drawImage(bitmap, 0, 0);

      // 단색 오버레이를 source-atop 으로 합성해 원본 픽셀이 있는 영역에만
      // 색조를 덮는다(투명 영역은 그대로 유지).
      const alpha = Math.min(1, Math.max(0, opacity / 100));
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      // 합성 상태를 기본값으로 되돌려 이후 인코딩에 영향을 주지 않게 한다.
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '색조 적용에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setColor(DEFAULT_COLOR);
    setOpacity(DEFAULT_OPACITY);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="색조 입히기" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지 위에 단색 색조(틴트)를 덮어 분위기를 바꿉니다.
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
            <label className="space-y-1 block">
              <span className="text-xs font-medium">색조 색상</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  aria-label="색조 색상"
                />
                <span className="font-mono text-xs text-muted-foreground">{color}</span>
              </div>
            </label>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="tint-opacity">
                불투명도 ({opacity}%)
              </label>
              <input
                id="tint-opacity"
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                색조를 얼마나 진하게 덮을지 결정합니다.
              </p>
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
            <img src={previewUrl} alt="색조 적용 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="tint.png"
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
