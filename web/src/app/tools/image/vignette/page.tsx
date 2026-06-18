'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { buttonVariants } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { assertCanvasSize, loadBitmap } from '@/lib/tools/image-common';

// 슬라이더 연속 조작 시 마지막 값만 처리하는 디바운스(ms).
const RENDER_DEBOUNCE_MS = 200;
const DEFAULT_STRENGTH = 60;
const DEFAULT_RADIUS = 70;
const MAX_BYTES = 50 * 1024 * 1024;

export default function ImageVignettePage() {
  const [file, setFile] = useState<File | null>(null);
  const [strength, setStrength] = useState(DEFAULT_STRENGTH);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 ObjectURL 은 교체/언마운트 시 회수해 누수를 막는다.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 파일·강도·반경 변경 시 디바운스 후 재처리.
  useEffect(() => {
    if (!file) return;
    const timer = setTimeout(() => { void render(); }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, strength, radius]);

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

      // 중심부는 투명, 가장자리로 갈수록 검은색이 짙어지는 방사형 그라디언트를
      // source-over 로 곱해(덧그려) 비네트를 만든다.
      const cx = width / 2;
      const cy = height / 2;
      const outer = Math.hypot(cx, cy);
      // 반경(%)이 클수록 어두워지는 시작 지점이 바깥으로 밀려 효과가 약해진다.
      const innerRatio = Math.min(0.95, Math.max(0, radius / 100));
      const maxAlpha = Math.min(1, Math.max(0, strength / 100));

      const gradient = ctx.createRadialGradient(cx, cy, outer * innerRatio, cx, cy, outer);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${maxAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 인코딩에 실패했습니다.'))), 'image/png'),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : '비네트 적용에 실패했습니다.');
    } finally {
      if (bitmap) bitmap.close();
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setStrength(DEFAULT_STRENGTH);
    setRadius(DEFAULT_RADIUS);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setError(null);
    setBusy(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="비네팅" widthClass="max-w-2xl" onReset={file ? handleReset : undefined} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이미지 가장자리를 어둡게 하는 비네트 효과로 시선을 가운데로 모읍니다.
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
              <label className="text-xs font-medium" htmlFor="vig-strength">
                강도 ({strength}%)
              </label>
              <input
                id="vig-strength"
                type="range"
                min={0}
                max={100}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                가장자리가 얼마나 어두워질지 결정합니다.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="vig-radius">
                반경 ({radius}%)
              </label>
              <input
                id="vig-radius"
                type="range"
                min={0}
                max={95}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                값이 클수록 밝게 유지되는 중앙 영역이 넓어집니다.
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
            <img src={previewUrl} alt="비네트 적용 미리보기" className="w-full rounded-md border bg-card" />
            <a
              href={previewUrl}
              download="vignette.png"
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
